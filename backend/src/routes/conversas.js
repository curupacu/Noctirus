import { Router } from "express";
import { db } from "../lib/firebase-admin.js";
import { requireRole, verificarToken } from "../middlewares/auth.js";

export const conversasRouter = Router();

// Chatzinho com mensagem só de lista fixa, nos dois sentidos — pedido do usuário, 18/08:
// os botões de mensagem pronta "não davam a impressão que alguma mensagem foi enviada",
// e o advogado também precisava de como responder com algo pronto (ex.: "estou ocupado
// esse mês"). Continua sem texto livre dos dois lados — a substância do caso continua
// acontecendo inteiramente fora da plataforma (WhatsApp/e-mail, ver
// POST /advogados/:uid/contato); isso aqui é só sinalização estruturada, igual uma
// etiqueta de status só que trocada entre as duas pontas e com histórico visível.
const LABEL_AREA = { civel: "cível", trabalhista: "trabalhista" };

function mensagensCliente(areaAdvogado) {
  const area = LABEL_AREA[areaAdvogado] || "jurídica";
  return {
    Saudação: ["Olá!", "Oi, tudo bem?"],
    "Sobre o caso": [
      `Tenho uma questão ${area} e preciso de ajuda.`,
      "Quero sua ajuda com um problema urgente.",
      "Gostaria de agendar uma conversa antes de decidir.",
    ],
  };
}

const MENSAGENS_ADVOGADO = {
  Resposta: ["Já te respondi por lá (WhatsApp/e-mail)."],
  Disponibilidade: [
    "Estou ocupado esse mês, mas posso te atender em breve.",
    "No momento não consigo assumir novos casos.",
    "Vamos conversar por WhatsApp?",
  ],
};

function todasAs(mapa) {
  return Object.values(mapa).flat();
}

function idConversa(clienteId, advogadoId) {
  return `${clienteId}_${advogadoId}`;
}

conversasRouter.post(
  "/conversas/:comUid/mensagens",
  verificarToken,
  requireRole("cliente", "advogado"),
  async (req, res) => {
    const { comUid } = req.params;
    const { texto } = req.body;
    const souCliente = req.user.role === "cliente";
    const clienteId = souCliente ? req.user.uid : comUid;
    const advogadoId = souCliente ? comUid : req.user.uid;

    const outroDoc = await db.collection("users").doc(comUid).get();
    if (!outroDoc.exists) {
      return res.status(404).json({ erro: "Usuário não encontrado" });
    }

    let listaValida;
    if (souCliente) {
      const advogadoDoc = await db.collection("advogados").doc(advogadoId).get();
      listaValida = todasAs(mensagensCliente(advogadoDoc.data()?.areasAtuacao?.[0]));
    } else {
      listaValida = todasAs(MENSAGENS_ADVOGADO);
    }

    if (!listaValida.includes(texto)) {
      return res.status(400).json({ erro: "Mensagem não reconhecida" });
    }

    const mensagem = {
      conversaId: idConversa(clienteId, advogadoId),
      clienteId,
      advogadoId,
      remetente: req.user.role,
      texto,
      createdAt: new Date().toISOString(),
    };
    const ref = await db.collection("mensagensChat").add(mensagem);
    res.status(201).json({ id: ref.id, ...mensagem });
  },
);

conversasRouter.get(
  "/conversas/:comUid/mensagens",
  verificarToken,
  requireRole("cliente", "advogado"),
  async (req, res) => {
    const { comUid } = req.params;
    const souCliente = req.user.role === "cliente";
    const clienteId = souCliente ? req.user.uid : comUid;
    const advogadoId = souCliente ? comUid : req.user.uid;

    const snapshot = await db
      .collection("mensagensChat")
      .where("conversaId", "==", idConversa(clienteId, advogadoId))
      .get();

    const mensagens = snapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    res.json(mensagens);
  },
);

// Visão geral das conversas do usuário logado (só a última mensagem de cada uma) — usada
// na lista de conversas do advogado, que não tinha nenhuma tela própria até agora.
conversasRouter.get(
  "/conversas/minhas",
  verificarToken,
  requireRole("cliente", "advogado"),
  async (req, res) => {
    const campo = req.user.role === "cliente" ? "clienteId" : "advogadoId";
    const snapshot = await db.collection("mensagensChat").where(campo, "==", req.user.uid).get();

    const ultimaPorConversa = new Map();
    for (const doc of snapshot.docs) {
      const dados = doc.data();
      const outroId = req.user.role === "cliente" ? dados.advogadoId : dados.clienteId;
      const atual = ultimaPorConversa.get(outroId);
      if (!atual || dados.createdAt > atual.createdAt) {
        ultimaPorConversa.set(outroId, dados);
      }
    }

    const conversas = await Promise.all(
      [...ultimaPorConversa.entries()].map(async ([outroId, ultima]) => {
        const usuarioDoc = await db.collection("users").doc(outroId).get();
        return {
          comUid: outroId,
          nome: usuarioDoc.exists ? usuarioDoc.data().nome : null,
          ultimaMensagem: ultima.texto,
          ultimoRemetente: ultima.remetente,
          ultimoEm: ultima.createdAt,
        };
      }),
    );

    conversas.sort((a, b) => b.ultimoEm.localeCompare(a.ultimoEm));
    res.json(conversas);
  },
);
