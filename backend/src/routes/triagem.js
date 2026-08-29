import { Router } from "express";
import { z } from "zod";
import { db } from "../lib/firebase-admin.js";
import { requireRole, verificarToken } from "../middlewares/auth.js";
import { limiteTriagem } from "../middlewares/rateLimit.js";
import { validarBody } from "../middlewares/validar.js";
import { buscarAdvogadosCompativeis } from "../services/matching.js";
import {
  CATEGORIAS_POR_AREA,
  classificar,
  PERGUNTA_PRINCIPAL,
  PERGUNTAS_SEGUNDA_ETAPA,
} from "../services/triagem.js";

export const triagemRouter = Router();

// Soma 1 no contador de "vezes sugerido" de cada advogado que apareceu como compatível
// nessa triagem — vira prova social honesta no perfil/card (não é avaliação de cliente,
// só frequência de match do algoritmo; achado da auditoria de UX, 29/07). Leitura +
// escrita simples em vez de FieldValue.increment de propósito: é um contador de
// popularidade, não crítico, e assim funciona igual contra o fake de testes.
async function somarContadorDeSugestoes(advogados) {
  await Promise.all(
    advogados.map(async ({ uid }) => {
      const doc = await db.collection("advogados").doc(uid).get();
      if (!doc.exists) return;
      await db.collection("advogados").doc(uid).update({
        vezesSugerido: (doc.data().vezesSugerido || 0) + 1,
      });
    }),
  );
}

// descricao sem teto de tamanho ia direto pro prompt da IA (custo/tempo de chamada
// proporcional ao texto) e pro Firestore sem limite nenhum. respostas é um objeto livre
// (chave = id da pergunta), mas cada valor precisa ser texto curto, não estrutura arbitrária.
const schemaTriagem = z.object({
  respostas: z.record(z.string(), z.string().max(500)).optional().default({}),
  descricao: z
    .string()
    .trim()
    .min(10, "Descreva o problema com pelo menos 10 caracteres")
    .max(3000),
  compartilharComAdvogado: z.boolean().optional().default(false),
});

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
  limiteTriagem,
  validarBody(schemaTriagem),
  async (req, res) => {
    const { respostas, descricao, compartilharComAdvogado } = req.body;

    const resultado = await classificar({ respostas, descricao });
    const advogados = await buscarAdvogadosCompativeis(
      resultado.areaClassificada === "indefinido"
        ? {}
        : { area: resultado.areaClassificada, categorias: resultado.categorias },
    );

    const triagem = {
      clienteId: req.user.uid,
      respostas,
      descricao,
      // Opt-in explícito do cliente pra descrição do caso poder aparecer pro advogado
      // que ele vier a contatar (ver POST /conversas/:comUid/mensagens) — falso por
      // padrão, dado sensível não vaza sem escolha ativa.
      compartilharComAdvogado: Boolean(compartilharComAdvogado),
      areaClassificada: resultado.areaClassificada,
      categorias: resultado.categorias || [],
      tipoAdvogadoSugerido: resultado.tipoAdvogadoSugerido,
      origem: resultado.origem,
      justificativa: resultado.justificativa || null,
      advogadosSugeridos: advogados.map((adv) => adv.uid),
      createdAt: new Date().toISOString(),
    };

    const ref = await db.collection("triagens").add(triagem);
    await somarContadorDeSugestoes(advogados);

    // Soma 1 na cópia que já foi buscada, pra resposta não voltar com o contador
    // "atrasado" em relação ao que acabou de ser gravado.
    const advogadosAtualizados = advogados.map((adv) => ({
      ...adv,
      vezesSugerido: (adv.vezesSugerido || 0) + 1,
    }));

    res.status(201).json({ id: ref.id, ...triagem, advogados: advogadosAtualizados });
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
