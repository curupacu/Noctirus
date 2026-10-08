import { Router } from "express";
import multer from "multer";
import { z } from "zod";
import { cloudinary } from "../lib/cloudinary.js";
import { db } from "../lib/firebase-admin.js";
import { schemaLocalizacao } from "../lib/localizacao.js";
import { requireRole, tentarVerificarToken, verificarToken } from "../middlewares/auth.js";
import { validarBody } from "../middlewares/validar.js";
import { buscarAdvogadosCompativeis } from "../services/matching.js";
import { SITUACOES_COM_MOTIVO, SITUACOES_OAB } from "../services/oab.js";
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
    const advogados = await buscarAdvogadosCompativeis();
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
  res.json(advogados);
});

advogadosRouter.get("/advogados/:uid", async (req, res) => {
  const { uid } = req.params;
  const [advogadoDoc, usuarioDoc] = await Promise.all([
    db.collection("advogados").doc(uid).get(),
    db.collection("users").doc(uid).get(),
  ]);

  if (!advogadoDoc.exists) {
    return res.status(404).json({ erro: "Advogado não encontrado" });
  }

  res.json({
    uid,
    nome: usuarioDoc.exists ? usuarioDoc.data().nome : null,
    ...advogadoDoc.data(),
  });
});

const schemaEditarAdvogado = z.object({
  areasAtuacao: z.array(z.enum(AREAS_VALIDAS)).optional(),
  especialidades: z.array(z.string()).optional(),
  localizacao: schemaLocalizacao.optional(),
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

    const { areasAtuacao, especialidades, localizacao, whatsapp, bio } = req.body;
    const campos = {};
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
// Recusar ou revogar exige motivo, que o advogado vai ver. Notificação e regras de
// transição entram no Sprint 2.
const schemaSituacaoOab = z
  .object({
    situacao: z.enum(SITUACOES_OAB, { message: "Situação da OAB inválida" }),
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

    await db.collection("advogados").doc(uid).update({
      situacaoOab: situacao,
      situacaoOabMotivo: SITUACOES_COM_MOTIVO.includes(situacao) ? motivo : null,
      situacaoOabAtualizadaEm: new Date().toISOString(),
      situacaoOabPor: req.user.uid,
    });
    res.json({ ok: true });
  },
);

const CANAIS_CONTATO = ["whatsapp", "email"];

// Loga que alguém clicou em falar no WhatsApp/e-mail (RF010 complementado) — só
// metadado (canal, quando), nunca o conteúdo de nenhuma conversa. Por isso não esbarra
// em sigilo profissional da OAB (Estatuto, Lei 8.906/94, art. 7º XIX): a conversa em si
// acontece inteiramente fora da plataforma, a Nocturis nunca tem acesso a ela. Público,
// sem exigir token — navegar o perfil e clicar em contato não exige login (RF008/RF010).
// tentarVerificarToken (não verificarToken) porque a rota continua funcionando anônima;
// só quando o clique vem de um cliente logado é que também upsertamos contatosCliente,
// pra alimentar GET /contatos/meus (pedido do usuário, 18/08: "advogados que você está
// conversando"). O log bruto em `contatos` (usado nas métricas do advogado) não muda.
advogadosRouter.post("/advogados/:uid/contato", tentarVerificarToken, async (req, res) => {
  const { uid } = req.params;
  const { canal } = req.body;

  if (!CANAIS_CONTATO.includes(canal)) {
    return res.status(400).json({ erro: `Canal deve ser um de: ${CANAIS_CONTATO.join(", ")}` });
  }

  const advogadoDoc = await db.collection("advogados").doc(uid).get();
  if (!advogadoDoc.exists) {
    return res.status(404).json({ erro: "Advogado não encontrado" });
  }

  const agora = new Date().toISOString();
  await db.collection("contatos").add({
    advogadoId: uid,
    canal,
    createdAt: agora,
  });

  if (req.user?.role === "cliente") {
    const ref = db.collection("contatosCliente").doc(`${req.user.uid}_${uid}`);
    const doc = await ref.get();
    const existente = doc.exists ? doc.data() : null;
    // Escreve o objeto completo (sem depender de `set(..., {merge:true})`) — preserva o
    // `status`/`criadoEm` já marcados pelo cliente em contatos anteriores com esse mesmo
    // advogado, só atualizando `ultimoContatoEm`.
    await ref.set({
      clienteId: req.user.uid,
      advogadoId: uid,
      status: existente?.status ?? null,
      criadoEm: existente?.criadoEm ?? agora,
      ultimoContatoEm: agora,
    });
  }

  res.status(201).json({ ok: true });
});

// Métricas do próprio perfil (contatos recebidos por canal) — só o dono ou o
// admin veem, mesmo padrão de autorização usado em PUT /advogados/:uid.
advogadosRouter.get("/advogados/:uid/metricas", verificarToken, async (req, res) => {
  const { uid } = req.params;
  if (uid !== req.user.uid && req.user.role !== "admin") {
    return res.status(403).json({ erro: "Só é possível ver as métricas do próprio perfil" });
  }

  const contatosSnap = await db.collection("contatos").where("advogadoId", "==", uid).get();
  const contatos = contatosSnap.docs.map((doc) => doc.data());

  res.json({
    contatos: {
      total: contatos.length,
      whatsapp: contatos.filter((c) => c.canal === "whatsapp").length,
      email: contatos.filter((c) => c.canal === "email").length,
    },
  });
});
