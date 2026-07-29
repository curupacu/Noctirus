import { Router } from "express";
import multer from "multer";
import { cloudinary } from "../lib/cloudinary.js";
import { db } from "../lib/firebase-admin.js";
import { requireRole, verificarToken } from "../middlewares/auth.js";
import { buscarAdvogadosCompativeis } from "../services/matching.js";
import { TODAS_CATEGORIAS } from "../services/triagem.js";

export const advogadosRouter = Router();

// Upload de foto de perfil (achado da auditoria de UX, 29/07: advogados sem foto real
// recebem 17x menos contato — ver docs/ROADMAP.md pra decisão anterior de adiar isso).
// Memória, não disco — o arquivo só existe no processo até subir pro Cloudinary.
const uploadFoto = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Envie um arquivo de imagem"));
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
    const advogados = await buscarAdvogadosCompativeis({ incluirSuspensos: true });
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
    status: usuarioDoc.exists ? usuarioDoc.data().status : null,
    ...advogadoDoc.data(),
  });
});

advogadosRouter.put(
  "/advogados/:uid",
  verificarToken,
  requireRole("advogado"),
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
    if (bio !== undefined) campos.bio = String(bio).trim().slice(0, 240);

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

// Aprovação manual da OAB (não há API externa gratuita pra verificar automaticamente —
// ver docs/ROADMAP.md). Só o admin pode marcar um advogado como verificado.
advogadosRouter.patch(
  "/advogados/:uid/verificar",
  verificarToken,
  requireRole("admin"),
  async (req, res) => {
    const { uid } = req.params;
    const { verificado } = req.body;

    if (typeof verificado !== "boolean") {
      return res.status(400).json({ erro: "Campo 'verificado' deve ser booleano" });
    }

    await db.collection("advogados").doc(uid).update({ verificado });
    res.json({ ok: true });
  },
);
