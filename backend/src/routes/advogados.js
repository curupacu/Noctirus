import { Router } from "express";
import { db } from "../lib/firebase-admin.js";
import { requireRole, verificarToken } from "../middlewares/auth.js";

export const advogadosRouter = Router();

// Lista todos os advogados (admin usa pra ver quem falta aprovar a OAB).
advogadosRouter.get(
  "/admin/advogados",
  verificarToken,
  requireRole("admin"),
  async (_req, res) => {
    const snapshot = await db.collection("advogados").get();
    const advogados = snapshot.docs.map((doc) => ({ uid: doc.id, ...doc.data() }));
    res.json(advogados);
  },
);

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

advogadosRouter.put(
  "/advogados/:uid",
  verificarToken,
  requireRole("advogado"),
  async (req, res) => {
    const { uid } = req.params;
    if (uid !== req.user.uid) {
      return res.status(403).json({ erro: "Só é possível editar o próprio perfil" });
    }

    const { areasAtuacao, localizacao, whatsapp } = req.body;
    const campos = {};
    if (areasAtuacao !== undefined) campos.areasAtuacao = areasAtuacao;
    if (localizacao !== undefined) campos.localizacao = localizacao;
    if (whatsapp !== undefined) campos["contatos.whatsapp"] = whatsapp;

    if (Object.keys(campos).length === 0) {
      return res.status(400).json({ erro: "Nenhum campo para atualizar" });
    }

    await db.collection("advogados").doc(uid).update(campos);
    res.json({ ok: true });
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
