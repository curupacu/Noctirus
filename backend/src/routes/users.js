import { Router } from "express";
import multer from "multer";
import { z } from "zod";
import { cloudinary } from "../lib/cloudinary.js";
import { schemaLocalizacao } from "../lib/localizacao.js";
import { auth, db } from "../lib/firebase-admin.js";
import { requireRole, verificarToken } from "../middlewares/auth.js";
import { validarBody } from "../middlewares/validar.js";

export const usersRouter = Router();

const schemaAtualizarPerfil = z.object({
  nome: z.string().trim().min(1).max(150).optional(),
  telefone: z.string().trim().max(20).optional(),
  localizacao: schemaLocalizacao.optional(),
});

// Mesma foto de perfil que já existia só pro advogado (ver POST /advogados/:uid/foto) —
// pedido do usuário pra cliente também poder colocar a dele (29/08/2026). Fica no doc de
// "users" (não em "advogados"), então só faz sentido pra quem não tem doc em "advogados".
// Só formatos raster, nunca SVG (pode embutir <script>) — mesma regra de advogados.js.
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

usersRouter.get("/users/me", verificarToken, async (req, res) => {
  const doc = await db.collection("users").doc(req.user.uid).get();
  if (!doc.exists) {
    return res.status(404).json({ erro: "Cadastro não encontrado" });
  }
  res.json({ uid: doc.id, ...doc.data() });
});

usersRouter.put(
  "/users/me",
  verificarToken,
  validarBody(schemaAtualizarPerfil),
  async (req, res) => {
    const { nome, telefone, localizacao } = req.body;
    const campos = {};
    if (nome !== undefined) campos.nome = nome;
    if (telefone !== undefined) campos.telefone = telefone;
    if (localizacao !== undefined) {
      // A localização do advogado vive no doc de "advogados" (PUT /advogados/:uid).
      if (req.user.role !== "cliente") {
        return res.status(400).json({ erro: "Advogado altera a cidade pelo próprio perfil profissional" });
      }
      campos.localizacao = localizacao;
    }

    if (Object.keys(campos).length === 0) {
      return res.status(400).json({ erro: "Nenhum campo para atualizar" });
    }

    await db.collection("users").doc(req.user.uid).update(campos);
    res.json({ ok: true });
  },
);

usersRouter.post(
  "/users/me/foto",
  verificarToken,
  requireRole("cliente"),
  tratarUploadFoto,
  async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ erro: "Nenhuma imagem enviada" });
    }

    const resultado = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: "nocturis/clientes",
          public_id: req.user.uid,
          overwrite: true,
          transformation: [{ width: 400, height: 400, crop: "fill", gravity: "face" }],
        },
        (erro, resultado) => (erro ? reject(erro) : resolve(resultado)),
      );
      stream.end(req.file.buffer);
    });

    await db.collection("users").doc(req.user.uid).update({ foto: resultado.secure_url });
    res.json({ foto: resultado.secure_url });
  },
);

// Direito de acesso/portabilidade (LGPD, art. 18) — o titular baixa tudo que a Nocturis
// tem sobre ele sem precisar pedir pro admin. Junta o próprio cadastro com tudo que
// referencia o uid nas outras coleções (como cliente e/ou como advogado, dependendo do
// papel), igual o admin já enxerga espalhado em telas diferentes, só que num lugar só.
usersRouter.get("/users/me/dados", verificarToken, async (req, res) => {
  const { uid, role } = req.user;

  const usuarioDoc = await db.collection("users").doc(uid).get();
  if (!usuarioDoc.exists) {
    return res.status(404).json({ erro: "Cadastro não encontrado" });
  }

  const paraLista = (snapshot) => snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

  const dados = { cadastro: { uid, ...usuarioDoc.data() } };

  if (role === "advogado") {
    const [advogadoDoc, curriculoDoc, solicitacoesRecebidas] = await Promise.all([
      db.collection("advogados").doc(uid).get(),
      db.collection("curriculos").doc(uid).get(),
      db.collection("solicitacoes").where("advogadoId", "==", uid).get(),
    ]);
    dados.perfilAdvogado = advogadoDoc.exists ? advogadoDoc.data() : null;
    dados.curriculo = curriculoDoc.exists ? curriculoDoc.data() : null;
    dados.solicitacoesRecebidas = paraLista(solicitacoesRecebidas);
  }

  if (role === "cliente") {
    const [triagens, solicitacoesFeitas] = await Promise.all([
      db.collection("triagens").where("clienteId", "==", uid).get(),
      db.collection("solicitacoes").where("clienteId", "==", uid).get(),
    ]);
    dados.triagens = paraLista(triagens);
    dados.solicitacoesFeitas = paraLista(solicitacoesFeitas);
  }


  res.json(dados);
});

// Direito de eliminação (LGPD, art. 18, VI) — o próprio titular apaga a conta, sem
// depender de um admin. Sai da Auth e do Firestore (users + advogados/curriculos, se for o
// caso). Não apaga registros que também são dado de terceiros (pedidos de contato) — apagar
// esses de vez destruiria o histórico do outro lado; ver
// docs/historico/ROADMAP-julho-2026.md pra anonimização completa como item de LGPD mais robusto.
usersRouter.delete("/users/me", verificarToken, async (req, res) => {
  const { uid, role } = req.user;

  const batch = db.batch();
  batch.delete(db.collection("users").doc(uid));
  if (role === "advogado") {
    batch.delete(db.collection("advogados").doc(uid));
    batch.delete(db.collection("curriculos").doc(uid));
  }
  await batch.commit();
  await ignorarSeUsuarioNaoExisteNaAuth(auth.deleteUser(uid));

  res.json({ ok: true });
});

// Os 30 advogados do seed (database/seed/lawyers.json) só existem no Firestore, pra
// demonstração — não têm conta na Firebase Auth. Chamar auth.updateUser/deleteUser pra eles
// derruba com "auth/user-not-found". Ignora só esse erro específico: pra quem não tem conta
// de login mesmo, apagar o Firestore já basta.
async function ignorarSeUsuarioNaoExisteNaAuth(promessa) {
  try {
    await promessa;
  } catch (err) {
    if (err.code !== "auth/user-not-found") throw err;
  }
}
