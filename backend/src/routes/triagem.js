import { Router } from "express";
import { z } from "zod";
import { db } from "../lib/firebase-admin.js";
import { requireRole, verificarToken } from "../middlewares/auth.js";
import { limiteTriagem } from "../middlewares/rateLimit.js";
import { validarBody } from "../middlewares/validar.js";
import { buscarAdvogadosCompativeis } from "../services/matching.js";
import {
  AREAS_VALIDAS,
  CATEGORIAS_POR_AREA,
  classificar,
  montarDescricao,
  PERGUNTAS_ETAPA1,
  PERGUNTAS_ETAPA2,
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

// Advogados do resultado da triagem: área + especialidades do caso + região do cliente
// (RF008). Usa a cidade/UF atual do cadastro do cliente — quem acabou de informar a
// cidade pelo aviso do painel já vê o resultado filtrado. Cliente antigo sem cidade vê
// todo mundo da área (o frontend avisa que falta a cidade).
async function advogadosDaTriagem({ clienteId, area, categorias }) {
  const usuario = (await db.collection("users").doc(clienteId).get()).data();
  const regiao = usuario?.localizacao?.uf ? usuario.localizacao : null;
  if (area === "indefinido") return { advogados: [], regiao };

  const advogados = await buscarAdvogadosCompativeis({
    area,
    categorias,
    ...(regiao ? { perto: regiao } : {}),
  });
  return { advogados, regiao };
}

// Valida as respostas de uma etapa contra a lista de perguntas dela: toda pergunta precisa
// ser respondida (restrição do caso de uso "Realizar triagem jurídica"), dentro do tamanho
// mínimo/máximo — o máximo é também o teto de custo do prompt da IA.
function validarRespostas(perguntas, respostas, ctx, prefixo) {
  for (const p of perguntas) {
    const valor = respostas?.[p.id];
    const texto = typeof valor === "string" ? valor.trim() : "";
    if (texto.length < p.minimo) {
      ctx.addIssue({
        code: "custom",
        path: [prefixo, p.id],
        message: `Responda "${p.pergunta}" com pelo menos ${p.minimo} caracteres`,
      });
    } else if (texto.length > p.maximo) {
      ctx.addIssue({ code: "custom", path: [prefixo, p.id], message: `Resposta longa demais (máx. ${p.maximo})` });
    }
  }
}

const respostasTexto = z.record(z.string(), z.string().max(3000)).default({});

const schemaEtapa1 = z
  .object({ etapa1: respostasTexto })
  .superRefine((dados, ctx) => validarRespostas(PERGUNTAS_ETAPA1, dados.etapa1, ctx, "etapa1"));

// A área vem do cliente porque ele pode corrigir a que a IA sugeriu na etapa 1 (ou escolher,
// quando a IA não conseguiu identificar) — a etapa 2 só faz sentido com uma área definida.
const schemaClassificar = z
  .object({
    etapa1: respostasTexto,
    area: z.enum(AREAS_VALIDAS, { message: "Escolha a área: cível ou trabalhista" }),
    etapa2: respostasTexto,
    compartilharComAdvogado: z.boolean().optional().default(false),
  })
  .superRefine((dados, ctx) => {
    validarRespostas(PERGUNTAS_ETAPA1, dados.etapa1, ctx, "etapa1");
    validarRespostas(PERGUNTAS_ETAPA2[dados.area] || [], dados.etapa2, ctx, "etapa2");
  });

// Guarda só as respostas das perguntas que existem (nada de chave arbitrária no banco).
function somenteDasPerguntas(perguntas, respostas) {
  return Object.fromEntries(perguntas.map((p) => [p.id, respostas[p.id].trim()]));
}

triagemRouter.get("/triagem/perguntas", (_req, res) => {
  res.json({
    etapa1: PERGUNTAS_ETAPA1,
    etapa2: PERGUNTAS_ETAPA2,
    categorias: CATEGORIAS_POR_AREA,
  });
});

// Etapa 1 (RF006): identifica a área a partir das respostas comuns. Não grava nada — a
// triagem só é salva no fim da etapa 2, com tudo junto.
triagemRouter.post(
  "/triagem/area",
  verificarToken,
  requireRole("cliente"),
  limiteTriagem,
  validarBody(schemaEtapa1),
  async (req, res) => {
    const descricao = montarDescricao(PERGUNTAS_ETAPA1, req.body.etapa1);
    const resultado = await classificar({ descricao });
    const area = resultado.areaClassificada;

    res.json({
      area,
      origem: resultado.origem,
      justificativa: resultado.justificativa || null,
      perguntas: PERGUNTAS_ETAPA2[area] || null,
    });
  },
);

// Etapa 2 (RF007/RF008): com a área definida, identifica a especialidade, grava a triagem
// e devolve os advogados compatíveis. Triagem é sempre vinculada ao cliente logado — o mesmo
// cliente pode ter várias ao longo do tempo, cada uma vira um documento próprio.
triagemRouter.post(
  "/triagem/classificar",
  verificarToken,
  requireRole("cliente"),
  limiteTriagem,
  validarBody(schemaClassificar),
  async (req, res) => {
    const { area, compartilharComAdvogado } = req.body;
    const etapa1 = somenteDasPerguntas(PERGUNTAS_ETAPA1, req.body.etapa1);
    const etapa2 = somenteDasPerguntas(PERGUNTAS_ETAPA2[area], req.body.etapa2);
    const descricao = [
      montarDescricao(PERGUNTAS_ETAPA1, etapa1),
      montarDescricao(PERGUNTAS_ETAPA2[area], etapa2),
    ].join("\n");

    const resultado = await classificar({ descricao, areaFixa: area });
    const { advogados, regiao } = await advogadosDaTriagem({
      clienteId: req.user.uid,
      area,
      categorias: resultado.categorias,
    });

    const triagem = {
      clienteId: req.user.uid,
      respostas: { etapa1, etapa2 },
      descricao,
      // Opt-in explícito do cliente pra descrição do caso poder aparecer pro advogado
      // que ele vier a contatar (ver POST /conversas/:comUid/mensagens) — falso por
      // padrão, dado sensível não vaza sem escolha ativa.
      compartilharComAdvogado: Boolean(compartilharComAdvogado),
      areaClassificada: area,
      // Especialidade principal (RF007) + as demais que também se aplicam ao caso.
      especialidade: resultado.categorias[0] || null,
      categorias: resultado.categorias || [],
      tipoAdvogadoSugerido: resultado.tipoAdvogadoSugerido,
      origem: resultado.origem,
      justificativa: resultado.justificativa || null,
      advogadosSugeridos: advogados.map((adv) => adv.uid),
      // Região usada no filtro no momento da triagem (só registro — o resultado aberto de
      // novo usa a cidade atual do cadastro).
      regiaoCliente: regiao,
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

    res.status(201).json({ id: ref.id, ...triagem, regiao, advogados: advogadosAtualizados });
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
  // `?categorias=a,b` — o cliente marcou/desmarcou especialidades na tela de resultado e a
  // lista é recalculada com elas (só vale categoria da área da triagem).
  const daArea = (CATEGORIAS_POR_AREA[triagem.areaClassificada] || []).map((c) => c.valor);
  const categorias =
    typeof req.query.categorias === "string"
      ? req.query.categorias.split(",").filter((c) => daArea.includes(c))
      : triagem.categorias;

  const { advogados, regiao } = await advogadosDaTriagem({
    clienteId: req.user.uid,
    area: triagem.areaClassificada,
    categorias,
  });

  res.json({ id: doc.id, ...triagem, regiao, advogados });
});
