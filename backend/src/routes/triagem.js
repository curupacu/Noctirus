import { Router } from "express";
import { db } from "../lib/firebase-admin.js";
import { requireRole, verificarToken } from "../middlewares/auth.js";
import { buscarAdvogadosCompativeis } from "../services/matching.js";
import {
  CATEGORIAS_POR_AREA,
  classificar,
  PERGUNTA_PRINCIPAL,
  PERGUNTAS_SEGUNDA_ETAPA,
} from "../services/triagem.js";

export const triagemRouter = Router();

triagemRouter.get("/triagem/perguntas", (_req, res) => {
  res.json({
    principal: PERGUNTA_PRINCIPAL,
    segundaEtapa: PERGUNTAS_SEGUNDA_ETAPA,
    categorias: CATEGORIAS_POR_AREA,
  });
});

// Triagem é sempre vinculada ao cliente logado (clienteId) — o mesmo cliente pode
// descrever mais de um caso ao longo do tempo, cada um vira um documento próprio.
triagemRouter.post(
  "/triagem/classificar",
  verificarToken,
  requireRole("cliente"),
  async (req, res) => {
    const { respostas, descricao } = req.body;

    if (!descricao || descricao.trim().length < 10) {
      return res.status(400).json({ erro: "Descreva o problema com pelo menos 10 caracteres" });
    }

    const resultado = await classificar({ respostas: respostas || {}, descricao });
    const advogados = await buscarAdvogadosCompativeis(
      resultado.areaClassificada === "indefinido"
        ? {}
        : { area: resultado.areaClassificada, categorias: resultado.categorias },
    );

    const triagem = {
      clienteId: req.user.uid,
      respostas: respostas || {},
      descricao,
      areaClassificada: resultado.areaClassificada,
      categorias: resultado.categorias || [],
      tipoAdvogadoSugerido: resultado.tipoAdvogadoSugerido,
      origem: resultado.origem,
      justificativa: resultado.justificativa || null,
      advogadosSugeridos: advogados.map((adv) => adv.uid),
      createdAt: new Date().toISOString(),
    };

    const ref = await db.collection("triagens").add(triagem);

    res.status(201).json({ id: ref.id, ...triagem, advogados });
  },
);

triagemRouter.get(
  "/triagem/historico",
  verificarToken,
  requireRole("cliente"),
  async (req, res) => {
    const snapshot = await db
      .collection("triagens")
      .where("clienteId", "==", req.user.uid)
      .orderBy("createdAt", "desc")
      .get();

    res.json(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
  },
);

triagemRouter.get("/triagem/:id", verificarToken, requireRole("cliente"), async (req, res) => {
  const doc = await db.collection("triagens").doc(req.params.id).get();
  if (!doc.exists || doc.data().clienteId !== req.user.uid) {
    return res.status(404).json({ erro: "Triagem não encontrada" });
  }

  const triagem = doc.data();
  const advogados = await buscarAdvogadosCompativeis(
    triagem.areaClassificada === "indefinido"
      ? {}
      : { area: triagem.areaClassificada, categorias: triagem.categorias },
  );

  res.json({ id: doc.id, ...triagem, advogados });
});
