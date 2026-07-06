import { Router } from "express";
import { auth, db } from "../lib/firebase-admin.js";
import { verificarToken } from "../middlewares/auth.js";
import { oabJaCadastrada, validarFormatoOab } from "../services/oab.js";

export const authRouter = Router();

const PAPEIS_PERMITIDOS = ["cliente", "advogado"];

authRouter.post("/auth/completar-cadastro", verificarToken, async (req, res) => {
  const { uid, email } = req.user;
  const { role, nome, telefone, oab, areasAtuacao, localizacao, whatsapp } = req.body;

  if (!PAPEIS_PERMITIDOS.includes(role)) {
    return res.status(400).json({ erro: "Papel inválido (use 'cliente' ou 'advogado')" });
  }
  if (!nome) {
    return res.status(400).json({ erro: "Nome é obrigatório" });
  }

  const usuarioExistente = await db.collection("users").doc(uid).get();
  if (usuarioExistente.exists) {
    return res.status(409).json({ erro: "Cadastro já foi concluído para este usuário" });
  }

  if (role === "advogado") {
    const erroFormato = validarFormatoOab(oab || {});
    if (erroFormato) {
      return res.status(400).json({ erro: erroFormato });
    }
    if (await oabJaCadastrada(oab)) {
      return res.status(409).json({ erro: "Essa OAB já está cadastrada" });
    }
  }

  await auth.setCustomUserClaims(uid, { role });

  await db.collection("users").doc(uid).set({
    role,
    nome,
    email,
    telefone: telefone || "",
    status: "ativo",
    createdAt: new Date().toISOString(),
  });

  if (role === "advogado") {
    await db.collection("advogados").doc(uid).set({
      oab: { numero: String(oab.numero), uf: String(oab.uf).toUpperCase() },
      areasAtuacao: areasAtuacao || [],
      localizacao: localizacao || {},
      contatos: { whatsapp: whatsapp || "", email },
      verificado: false,
    });
    await db.collection("curriculos").doc(uid).set({
      formacao: [],
      especializacoes: [],
      cursos: [],
      experiencias: [],
    });
  }

  res.status(201).json({ role });
});
