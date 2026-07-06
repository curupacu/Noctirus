import { Router } from "express";
import { db } from "../lib/firebase-admin.js";
import { verificarToken } from "../middlewares/auth.js";

export const usersRouter = Router();

usersRouter.get("/users/me", verificarToken, async (req, res) => {
  const doc = await db.collection("users").doc(req.user.uid).get();
  if (!doc.exists) {
    return res.status(404).json({ erro: "Cadastro não encontrado" });
  }
  res.json({ uid: doc.id, ...doc.data() });
});

usersRouter.put("/users/me", verificarToken, async (req, res) => {
  const { nome, telefone } = req.body;
  const campos = {};
  if (nome !== undefined) campos.nome = nome;
  if (telefone !== undefined) campos.telefone = telefone;

  if (Object.keys(campos).length === 0) {
    return res.status(400).json({ erro: "Nenhum campo para atualizar" });
  }

  await db.collection("users").doc(req.user.uid).update(campos);
  res.json({ ok: true });
});
