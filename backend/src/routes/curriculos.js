import { Router } from "express";
import { db } from "../lib/firebase-admin.js";
import { requireRole, verificarToken } from "../middlewares/auth.js";

export const curriculosRouter = Router();

const CAMPOS = ["formacao", "especializacoes", "cursos", "experiencias"];

curriculosRouter.get("/curriculos/:uid", async (req, res) => {
  const doc = await db.collection("curriculos").doc(req.params.uid).get();
  if (!doc.exists) {
    return res.status(404).json({ erro: "Currículo não encontrado" });
  }
  res.json({ uid: doc.id, ...doc.data() });
});

curriculosRouter.put(
  "/curriculos/:uid",
  verificarToken,
  requireRole("advogado"),
  async (req, res) => {
    const { uid } = req.params;
    if (uid !== req.user.uid) {
      return res.status(403).json({ erro: "Só é possível editar o próprio currículo" });
    }

    const campos = {};
    for (const campo of CAMPOS) {
      if (req.body[campo] !== undefined) {
        if (!Array.isArray(req.body[campo])) {
          return res.status(400).json({ erro: `Campo '${campo}' deve ser uma lista` });
        }
        campos[campo] = req.body[campo];
      }
    }

    if (Object.keys(campos).length === 0) {
      return res.status(400).json({ erro: "Nenhum campo para atualizar" });
    }

    await db.collection("curriculos").doc(uid).update(campos);
    res.json({ ok: true });
  },
);
