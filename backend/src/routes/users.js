import { Router } from "express";
import { auth, db } from "../lib/firebase-admin.js";
import { requireRole, verificarToken } from "../middlewares/auth.js";

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

// Gerenciar clientes e advogados (Sprint 8) — admins não aparecem aqui, moderação não se
// aplica entre admins.
usersRouter.get("/admin/users", verificarToken, requireRole("admin"), async (_req, res) => {
  const snapshot = await db.collection("users").where("role", "in", ["cliente", "advogado"]).get();
  res.json(snapshot.docs.map((doc) => ({ uid: doc.id, ...doc.data() })));
});

// Os 30 advogados do seed (database/seed/lawyers.json) só existem no Firestore, pra
// demonstração — não têm conta na Firebase Auth. Chamar auth.updateUser/deleteUser pra eles
// derruba com "auth/user-not-found". Ignora só esse erro específico: pra quem não tem conta
// de login mesmo, o que importa é o status no Firestore (que já tira o advogado da listagem
// e do matching — ver services/matching.js).
async function ignorarSeUsuarioNaoExisteNaAuth(promessa) {
  try {
    await promessa;
  } catch (err) {
    if (err.code !== "auth/user-not-found") throw err;
  }
}

// Suspender bloqueia o login de verdade (Firebase Auth) quando existe conta, não só marca
// um campo que ninguém checa — senão a pessoa suspensa continuava usando a plataforma
// normalmente.
usersRouter.patch(
  "/admin/users/:uid/suspender",
  verificarToken,
  requireRole("admin"),
  async (req, res) => {
    const { uid } = req.params;
    const { suspenso } = req.body;

    if (typeof suspenso !== "boolean") {
      return res.status(400).json({ erro: "Campo 'suspenso' deve ser booleano" });
    }

    const doc = await db.collection("users").doc(uid).get();
    if (!doc.exists) {
      return res.status(404).json({ erro: "Usuário não encontrado" });
    }
    if (doc.data().role === "admin") {
      return res.status(403).json({ erro: "Não é possível suspender um admin" });
    }

    await ignorarSeUsuarioNaoExisteNaAuth(auth.updateUser(uid, { disabled: suspenso }));
    await db.collection("users").doc(uid).update({ status: suspenso ? "suspenso" : "ativo" });
    res.json({ ok: true });
  },
);

// Remoção definitiva (RF014) — sai da Auth (se existir conta) e do Firestore (users +
// advogados/curriculos, se for o caso). Dataset é fictício no MVP, por isso não há
// soft-delete/histórico.
usersRouter.delete("/admin/users/:uid", verificarToken, requireRole("admin"), async (req, res) => {
  const { uid } = req.params;

  const doc = await db.collection("users").doc(uid).get();
  if (!doc.exists) {
    return res.status(404).json({ erro: "Usuário não encontrado" });
  }
  if (doc.data().role === "admin") {
    return res.status(403).json({ erro: "Não é possível remover um admin" });
  }

  const batch = db.batch();
  batch.delete(db.collection("users").doc(uid));
  if (doc.data().role === "advogado") {
    batch.delete(db.collection("advogados").doc(uid));
    batch.delete(db.collection("curriculos").doc(uid));
  }
  await batch.commit();
  await ignorarSeUsuarioNaoExisteNaAuth(auth.deleteUser(uid));

  res.json({ ok: true });
});
