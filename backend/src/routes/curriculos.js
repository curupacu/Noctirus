import { Router } from "express";
import { z } from "zod";
import { db } from "../lib/firebase-admin.js";
import { requireRole, tentarVerificarToken, verificarToken } from "../middlewares/auth.js";
import { validarBody } from "../middlewares/validar.js";

export const curriculosRouter = Router();

const CAMPOS = ["formacao", "especializacoes", "cursos", "experiencias"];

// Antes só checava "é array" — dava pra mandar um item de 50KB ou uma lista com milhares
// de entradas, sem limite nenhum de tamanho do documento no Firestore. Cada item é uma
// linha curta de texto livre (ex.: "Direito - USP (2015)"), não um texto longo.
const listaDeLinhas = z.array(z.string().trim().max(200)).max(50).optional();
const schemaCurriculo = z.object({
  formacao: listaDeLinhas,
  especializacoes: listaDeLinhas,
  cursos: listaDeLinhas,
  experiencias: listaDeLinhas,
});

// Mesma regra do perfil (RF009): currículo só é público se a OAB do advogado foi aprovada;
// o próprio advogado e o admin veem sempre.
curriculosRouter.get("/curriculos/:uid", tentarVerificarToken, async (req, res) => {
  const { uid } = req.params;
  const [doc, advogado] = await Promise.all([
    db.collection("curriculos").doc(uid).get(),
    db.collection("advogados").doc(uid).get(),
  ]);
  const podeVerSemAprovacao = req.user && (req.user.uid === uid || req.user.role === "admin");
  if (!doc.exists || (advogado.data()?.situacaoOab !== "aprovado" && !podeVerSemAprovacao)) {
    return res.status(404).json({ erro: "Currículo não encontrado" });
  }
  res.json({ uid: doc.id, ...doc.data() });
});

curriculosRouter.put(
  "/curriculos/:uid",
  verificarToken,
  requireRole("advogado"),
  validarBody(schemaCurriculo),
  async (req, res) => {
    const { uid } = req.params;
    if (uid !== req.user.uid) {
      return res.status(403).json({ erro: "Só é possível editar o próprio currículo" });
    }

    const campos = {};
    for (const campo of CAMPOS) {
      if (req.body[campo] !== undefined) campos[campo] = req.body[campo];
    }

    if (Object.keys(campos).length === 0) {
      return res.status(400).json({ erro: "Nenhum campo para atualizar" });
    }

    await db.collection("curriculos").doc(uid).update(campos);
    res.json({ ok: true });
  },
);
