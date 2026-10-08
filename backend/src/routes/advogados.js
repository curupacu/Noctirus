import { Router } from "express";
import multer from "multer";
import { z } from "zod";
import { cloudinary } from "../lib/cloudinary.js";
import { db } from "../lib/firebase-admin.js";
import { schemaLocalizacao } from "../lib/localizacao.js";
import { requireRole, tentarVerificarToken, verificarToken } from "../middlewares/auth.js";
import { validarBody } from "../middlewares/validar.js";
import { buscarAdvogadosCompativeis, perfilPublico } from "../services/matching.js";
import { avisarAdvogadoSobreOab } from "../services/avisosOab.js";
import {
  oabJaCadastrada,
  podeMudarSituacao,
  SITUACOES_COM_MOTIVO,
  SITUACOES_OAB,
  validarFormatoOab,
} from "../services/oab.js";
import { AREAS_VALIDAS, TODAS_CATEGORIAS } from "../services/triagem.js";

export const advogadosRouter = Router();

// Upload de foto de perfil (achado da auditoria de UX, 29/07: advogados sem foto real
// recebem 17x menos contato — ver docs/historico/ROADMAP-julho-2026.md pra decisão anterior de adiar isso).
// Memória, não disco — o arquivo só existe no processo até subir pro Cloudinary.
// Só formatos raster — nunca SVG, que pode embutir <script> e virar XSS armazenado se
// algum dia a URL for aberta como documento (achado da auditoria de segurança, F3).
const MIMETYPES_FOTO_PERMITIDOS = ["image/jpeg", "image/png", "image/webp"];

const uploadFoto = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!MIMETYPES_FOTO_PERMITIDOS.includes(file.mimetype)) {
      return cb(new Error("Envie uma imagem JPEG, PNG ou WebP"));
    }
    cb(null, true);
  },
}).single("foto");

function tratarUploadFoto(req, res, next) {
  uploadFoto(req, res, (erro) => {
    if (erro instanceof multer.MulterError && erro.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ erro: "Imagem muito grande (máximo 5MB)" });
    }
    if (erro) {
      return res.status(400).json({ erro: erro.message || "Não foi possível processar a imagem" });
    }
    next();
  });
}

// Lista todos os advogados (admin usa pra ver quem falta aprovar a OAB).
advogadosRouter.get(
  "/admin/advogados",
  verificarToken,
  requireRole("admin"),
  async (_req, res) => {
    const advogados = await buscarAdvogadosCompativeis({ somenteAprovados: false });
    res.json(advogados);
  },
);

// Lista pública de advogados, com filtro opcional por área e localização (matching —
// RF006/RF007). Filtragem em memória (dataset pequeno no MVP), sem precisar de índice
// composto no Firestore.
advogadosRouter.get("/advogados", async (req, res) => {
  const { area, cidade, uf, categorias } = req.query;
  const advogados = await buscarAdvogadosCompativeis({
    area,
    cidade,
    uf,
    categorias: categorias ? categorias.split(",").filter(Boolean) : undefined,
  });
  res.json(advogados.map(perfilPublico));
});

// Perfil público só existe pra advogado aprovado (RF009). O próprio advogado e o admin
// continuam vendo o perfil em qualquer situação — o painel do advogado lê daqui.
advogadosRouter.get("/advogados/:uid", tentarVerificarToken, async (req, res) => {
  const { uid } = req.params;
  const [advogadoDoc, usuarioDoc] = await Promise.all([
    db.collection("advogados").doc(uid).get(),
    db.collection("users").doc(uid).get(),
  ]);

  if (!advogadoDoc.exists) {
    return res.status(404).json({ erro: "Advogado não encontrado" });
  }

  const podeVerSemAprovacao = req.user && (req.user.uid === uid || req.user.role === "admin");
  if (advogadoDoc.data().situacaoOab !== "aprovado" && !podeVerSemAprovacao) {
    return res.status(404).json({ erro: "Perfil indisponível" });
  }

  const perfil = { uid, nome: usuarioDoc.exists ? usuarioDoc.data().nome : null, ...advogadoDoc.data() };
  // O próprio advogado (painel/edição) e o admin veem tudo; o resto vê o perfil público.
  res.json(podeVerSemAprovacao ? perfil : perfilPublico(perfil));
});

const schemaEditarAdvogado = z.object({
  areasAtuacao: z.array(z.enum(AREAS_VALIDAS)).optional(),
  especialidades: z.array(z.string()).optional(),
  localizacao: schemaLocalizacao.optional(),
  // Só aceito quando a OAB foi recusada: o advogado corrige e o cadastro volta pra análise.
  oab: z.object({ numero: z.unknown(), uf: z.unknown() }).optional(),
  whatsapp: z.string().trim().max(20).optional(),
  bio: z.string().max(1000).optional(),
});

advogadosRouter.put(
  "/advogados/:uid",
  verificarToken,
  requireRole("advogado"),
  validarBody(schemaEditarAdvogado),
  async (req, res) => {
    const { uid } = req.params;
    if (uid !== req.user.uid) {
      return res.status(403).json({ erro: "Só é possível editar o próprio perfil" });
    }

    const { areasAtuacao, especialidades, localizacao, whatsapp, bio, oab } = req.body;
    const campos = {};

    if (oab !== undefined) {
      const atual = (await db.collection("advogados").doc(uid).get()).data();
      if (atual?.situacaoOab !== "recusado") {
        return res.status(400).json({ erro: "A OAB só pode ser corrigida depois de uma recusa" });
      }
      const erroFormato = validarFormatoOab(oab);
      if (erroFormato) return res.status(400).json({ erro: erroFormato });
      if (await oabJaCadastrada(oab, uid)) {
        return res.status(409).json({ erro: "Essa OAB já está cadastrada" });
      }
      const agora = new Date().toISOString();
      campos.oab = { numero: String(oab.numero), uf: String(oab.uf).toUpperCase() };
      campos.situacaoOab = "em_analise";
      campos.situacaoOabMotivo = null;
      campos.situacaoOabAtualizadaEm = agora;
      campos.situacaoOabPor = uid;
      campos.historicoOab = [
        ...(atual.historicoOab || []),
        { situacao: "em_analise", motivo: "OAB corrigida e reenviada pelo advogado", em: agora, por: uid },
      ];
    }
    if (areasAtuacao !== undefined) campos.areasAtuacao = areasAtuacao;
    if (especialidades !== undefined) {
      campos.especialidades = especialidades.filter((e) => TODAS_CATEGORIAS.includes(e));
    }
    if (localizacao !== undefined) campos.localizacao = localizacao;
    if (whatsapp !== undefined) campos["contatos.whatsapp"] = whatsapp;
    if (bio !== undefined) campos.bio = bio.trim().slice(0, 240);

    if (Object.keys(campos).length === 0) {
      return res.status(400).json({ erro: "Nenhum campo para atualizar" });
    }

    await db.collection("advogados").doc(uid).update(campos);
    res.json({ ok: true });
  },
);

advogadosRouter.post(
  "/advogados/:uid/foto",
  verificarToken,
  requireRole("advogado"),
  tratarUploadFoto,
  async (req, res) => {
    const { uid } = req.params;
    if (uid !== req.user.uid) {
      return res.status(403).json({ erro: "Só é possível editar o próprio perfil" });
    }
    if (!req.file) {
      return res.status(400).json({ erro: "Nenhuma imagem enviada" });
    }

    // public_id fixo por advogado + overwrite: subir uma foto nova substitui a antiga
    // no Cloudinary em vez de acumular lixo. Recorte quadrado centrado no rosto quando
    // detectável, pra ficar bom no círculo do avatar sem a pessoa recortar antes.
    const resultado = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: "nocturis/advogados",
          public_id: uid,
          overwrite: true,
          transformation: [{ width: 400, height: 400, crop: "fill", gravity: "face" }],
        },
        (erro, resultado) => (erro ? reject(erro) : resolve(resultado)),
      );
      stream.end(req.file.buffer);
    });

    await db.collection("advogados").doc(uid).update({ foto: resultado.secure_url });
    res.json({ foto: resultado.secure_url });
  },
);

// Validação manual da OAB pelo admin (RF011) — não existe API pública gratuita da OAB, então
// o admin confere o número no Cadastro Nacional dos Advogados e registra aqui a decisão.
// Recusar ou revogar exige motivo, que o advogado vai ver. Cada decisão fica no histórico
// do advogado e ele é avisado pelo sininho e por e-mail.
const schemaSituacaoOab = z
  .object({
    situacao: z.enum(
      SITUACOES_OAB.filter((s) => s !== "em_analise"),
      { message: "Situação da OAB inválida" },
    ),
    motivo: z.string().trim().max(500).optional().default(""),
  })
  .refine((dados) => !SITUACOES_COM_MOTIVO.includes(dados.situacao) || dados.motivo.length >= 5, {
    message: "Explique o motivo (pelo menos 5 caracteres)",
    path: ["motivo"],
  });

advogadosRouter.patch(
  "/advogados/:uid/situacao-oab",
  verificarToken,
  requireRole("admin"),
  validarBody(schemaSituacaoOab),
  async (req, res) => {
    const { uid } = req.params;
    const { situacao, motivo } = req.body;

    const advogadoDoc = await db.collection("advogados").doc(uid).get();
    if (!advogadoDoc.exists) {
      return res.status(404).json({ erro: "Advogado não encontrado" });
    }

    const atual = advogadoDoc.data();
    if (!podeMudarSituacao(atual.situacaoOab, situacao)) {
      return res.status(409).json({
        erro: `Não dá pra passar de "${atual.situacaoOab || "em_analise"}" pra "${situacao}"`,
      });
    }

    const agora = new Date().toISOString();
    const motivoFinal = SITUACOES_COM_MOTIVO.includes(situacao) ? motivo : null;
    await db.collection("advogados").doc(uid).update({
      situacaoOab: situacao,
      situacaoOabMotivo: motivoFinal,
      situacaoOabAtualizadaEm: agora,
      situacaoOabPor: req.user.uid,
      historicoOab: [
        ...(atual.historicoOab || []),
        { situacao, motivo: motivoFinal, em: agora, por: req.user.uid },
      ],
    });

    await avisarAdvogadoSobreOab({ uid, situacao, motivo: motivoFinal });
    res.json({ ok: true });
  },
);
