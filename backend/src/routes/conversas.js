import { Router } from "express";
import { enviarEmail } from "../lib/email.js";
import { templateNovaResposta } from "../lib/emailTemplates.js";
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
    // Fechava um ciclo estranho: o advogado podia perguntar "Vamos conversar por
    // WhatsApp?" e não existia como o cliente responder nada (achado do usuário, 18/08).
    "Resposta rápida": ["Sim, pode ser!", "Não, prefiro por aqui mesmo.", "Combinado, obrigado(a)!"],
  };
}

const MENSAGENS_ADVOGADO = {
  Resposta: ["Já te respondi por lá (WhatsApp/e-mail)."],
  Disponibilidade: [
    "Estou ocupado esse mês, mas posso te atender em breve.",
    "No momento não consigo assumir novos casos.",
    "Vamos conversar por WhatsApp?",
  ],
  "Resposta rápida": ["Sim, sem problema.", "Combinado!", "Por enquanto não, mas te aviso."],
};

function todasAs(mapa) {
  return Object.values(mapa).flat();
}

function idConversa(clienteId, advogadoId) {
  return `${clienteId}_${advogadoId}`;
}

// Notifica o cliente por e-mail só na PRIMEIRA mensagem de uma sequência do advogado —
// se ele mandar várias seguidas sem o cliente responder, não manda um e-mail por
// mensagem. Decide isso olhando quem mandou a penúltima mensagem da conversa (antes da
// que acabou de ser salva): se foi o cliente (ou não existe mensagem anterior), notifica.
async function notificarClienteSeNecessario({ conversaId, clienteId, advogadoId }) {
  const anteriores = await db
    .collection("mensagensChat")
    .where("conversaId", "==", conversaId)
    .get();

  const mensagensAnteriores = anteriores.docs
    .map((doc) => doc.data())
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  // A mensagem recém-salva já está nesse snapshot — a penúltima é quem decide.
  const penultima = mensagensAnteriores[mensagensAnteriores.length - 2];
  if (penultima && penultima.remetente === "advogado") return;

  const [clienteDoc, advogadoUserDoc, advogadoPerfilDoc] = await Promise.all([
    db.collection("users").doc(clienteId).get(),
    db.collection("users").doc(advogadoId).get(),
    db.collection("advogados").doc(advogadoId).get(),
  ]);
  const email = clienteDoc.data()?.email;
  if (!email) return;

  const advogadoNome = advogadoUserDoc.data()?.nome || "Um advogado";
  const advogadoFoto = advogadoPerfilDoc.data()?.foto || null;
  await enviarEmail({
    to: email,
    subject: `${advogadoNome} respondeu na Nocturis`,
    html: templateNovaResposta({
      advogadoNome,
      advogadoFoto,
      linkConversa: `https://nocturis.com.br/advogados/${advogadoId}/contato`,
    }),
  });
}

conversasRouter.post(
  "/conversas/:comUid/mensagens",
  verificarToken,
  requireRole("cliente", "advogado"),
  async (req, res) => {
    const { comUid } = req.params;
    const { texto, triagemId } = req.body;
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

    // Vincula a conversa à triagem de origem (RF: mostrar contexto real pro advogado) —
    // só quando o cliente veio de um resultado de triagem e a triagem é mesmo dele. ID
    // inválido/de outro cliente é ignorado silenciosamente, não derruba o envio da
    // mensagem.
    if (souCliente && triagemId) {
      const triagemDoc = await db.collection("triagens").doc(triagemId).get();
      if (triagemDoc.exists && triagemDoc.data().clienteId === req.user.uid) {
        mensagem.triagemId = triagemId;
      }
    }

    const ref = await db.collection("mensagensChat").add(mensagem);

    if (!souCliente) {
      // Notificação é um extra, não pode derrubar o envio da mensagem se falhar.
      try {
        await notificarClienteSeNecessario({ conversaId: mensagem.conversaId, clienteId, advogadoId });
      } catch (erro) {
        console.error("conversas: falha ao notificar cliente por e-mail —", erro.message || erro);
      }
    }

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

// Contexto da triagem que originou a conversa, só pro advogado — e só quando o cliente
// deu opt-in explícito (`compartilharComAdvogado`) na triagem. Sem isso, o advogado não
// vê nada extra além do que o chat já mostra.
conversasRouter.get(
  "/conversas/:comUid/triagem",
  verificarToken,
  requireRole("advogado"),
  async (req, res) => {
    const { comUid: clienteId } = req.params;

    const snapshot = await db
      .collection("mensagensChat")
      .where("conversaId", "==", idConversa(clienteId, req.user.uid))
      .get();

    const mensagemComTriagem = snapshot.docs.map((doc) => doc.data()).find((m) => m.triagemId);
    if (!mensagemComTriagem) {
      return res.json(null);
    }

    const triagemDoc = await db.collection("triagens").doc(mensagemComTriagem.triagemId).get();
    const triagem = triagemDoc.exists ? triagemDoc.data() : null;
    if (!triagem || triagem.clienteId !== clienteId || !triagem.compartilharComAdvogado) {
      return res.json(null);
    }

    res.json({
      areaClassificada: triagem.areaClassificada,
      descricao: triagem.descricao,
      createdAt: triagem.createdAt,
    });
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
