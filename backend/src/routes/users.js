import { Router } from "express";
import { z } from "zod";
import { auth, db } from "../lib/firebase-admin.js";
import { requireRole, verificarToken } from "../middlewares/auth.js";
import { validarBody } from "../middlewares/validar.js";

export const usersRouter = Router();

const schemaAtualizarPerfil = z.object({
  nome: z.string().trim().min(1).max(150).optional(),
  telefone: z.string().trim().max(20).optional(),
});

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
    const { nome, telefone } = req.body;
    const campos = {};
    if (nome !== undefined) campos.nome = nome;
    if (telefone !== undefined) campos.telefone = telefone;

    if (Object.keys(campos).length === 0) {
      return res.status(400).json({ erro: "Nenhum campo para atualizar" });
    }

    await db.collection("users").doc(req.user.uid).update(campos);
    res.json({ ok: true });
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
    const [advogadoDoc, curriculoDoc, contatosRecebidos, feedbacksRecebidos] = await Promise.all([
      db.collection("advogados").doc(uid).get(),
      db.collection("curriculos").doc(uid).get(),
      db.collection("contatos").where("advogadoId", "==", uid).get(),
      db.collection("feedbacks").where("advogadoId", "==", uid).get(),
    ]);
    dados.perfilAdvogado = advogadoDoc.exists ? advogadoDoc.data() : null;
    dados.curriculo = curriculoDoc.exists ? curriculoDoc.data() : null;
    dados.contatosRecebidos = paraLista(contatosRecebidos);
    dados.feedbacksRecebidos = paraLista(feedbacksRecebidos);
  }

  if (role === "cliente") {
    const [triagens, contatosFeitos, feedbacksEnviados] = await Promise.all([
      db.collection("triagens").where("clienteId", "==", uid).get(),
      db.collection("contatosCliente").where("clienteId", "==", uid).get(),
      db.collection("feedbacks").where("autorId", "==", uid).get(),
    ]);
    dados.triagens = paraLista(triagens);
    dados.contatosFeitos = paraLista(contatosFeitos);
    dados.feedbacksEnviados = paraLista(feedbacksEnviados);
  }

  const [mensagensEnviadas, denunciasFeitas] = await Promise.all([
    db.collection("mensagensChat").where(role === "cliente" ? "clienteId" : "advogadoId", "==", uid).get(),
    db.collection("denuncias").where("autorId", "==", uid).get(),
  ]);
  dados.mensagensChat = paraLista(mensagensEnviadas);
  dados.denunciasFeitas = paraLista(denunciasFeitas);

  res.json(dados);
});

// Direito de eliminação (LGPD, art. 18, VI) — o próprio titular apaga a conta, sem
// depender de um admin fazer isso por ele (antes só existia DELETE /admin/users/:uid).
// Mesmo efeito da remoção feita pelo admin: sai da Auth e do Firestore (users +
// advogados/curriculos, se for o caso). Não apaga registros que também são dado de
// terceiros (mensagens de chat, feedback que ele deixou, denúncia que registrou) — apagar
// esses de vez destruiria o histórico do outro lado da conversa/moderação; ver
// docs/ROADMAP.md pra anonimização completa como item de LGPD mais robusto.
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
