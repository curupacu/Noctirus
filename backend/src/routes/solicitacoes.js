import { Router } from "express";
import { z } from "zod";
import { enviarEmail } from "../lib/email.js";
import { templateAviso } from "../lib/emailTemplates.js";
import { db } from "../lib/firebase-admin.js";
import { requireRole, verificarToken } from "../middlewares/auth.js";
import { validarBody } from "../middlewares/validar.js";
import { criarNotificacao } from "../services/notificacoes.js";

export const solicitacoesRouter = Router();

const SITE_URL = "https://nocturis.com.br";

// Pedido de contato (RF010, RF013, RF014) — substituiu o chat de mensagens prontas e o
// botão de WhatsApp/e-mail direto (outubro/2026). Fluxo:
// 1. Cliente pede contato a um advogado aprovado, a partir de uma triagem dele, e precisa
//    autorizar o envio das respostas da triagem.
// 2. O pedido é registrado na hora e o advogado é avisado (sininho + e-mail).
// 3. O advogado aceita ou recusa; o cliente é avisado nos dois casos.
// 4. Só depois de aceito o cliente vê o WhatsApp/e-mail do advogado, e o advogado vê o
//    nome do cliente. A conversa em si acontece fora da plataforma.
export const SITUACOES_SOLICITACAO = ["pendente", "aceita", "recusada"];

const schemaNovaSolicitacao = z.object({
  advogadoId: z.string().min(1),
  triagemId: z.string().min(1, "Escolha a triagem que vai junto com o pedido"),
  autorizaCompartilhar: z.literal(true, {
    message: "É preciso autorizar o envio das respostas da triagem pro advogado",
  }),
});

const schemaResposta = z.object({
  acao: z.enum(["aceitar", "recusar"], { message: "Ação inválida (use 'aceitar' ou 'recusar')" }),
});

// Sininho e e-mail nunca derrubam o pedido/resposta se falharem.
async function avisar({ destinatarioId, tipo, texto, link, assunto, titulo, paragrafos, botao }) {
  try {
    await criarNotificacao({ destinatarioId, tipo, texto, link });
  } catch (erro) {
    console.error("solicitacoes: falha ao criar notificação —", erro.message || erro);
  }
  try {
    const email = (await db.collection("users").doc(destinatarioId).get()).data()?.email;
    if (!email) return;
    await enviarEmail({
      to: email,
      subject: assunto,
      html: templateAviso({ titulo, paragrafos, botaoTexto: botao, link: `${SITE_URL}${link}` }),
    });
  } catch (erro) {
    console.error("solicitacoes: falha ao enviar e-mail —", erro.message || erro);
  }
}

const LABEL_AREA = { civel: "cível", trabalhista: "trabalhista" };

solicitacoesRouter.post(
  "/solicitacoes",
  verificarToken,
  requireRole("cliente"),
  validarBody(schemaNovaSolicitacao),
  async (req, res) => {
    const clienteId = req.user.uid;
    const { advogadoId, triagemId } = req.body;

    const [advogadoDoc, triagemDoc] = await Promise.all([
      db.collection("advogados").doc(advogadoId).get(),
      db.collection("triagens").doc(triagemId).get(),
    ]);
    if (!advogadoDoc.exists || advogadoDoc.data().situacaoOab !== "aprovado") {
      return res.status(404).json({ erro: "Advogado indisponível" });
    }
    if (!triagemDoc.exists || triagemDoc.data().clienteId !== clienteId) {
      return res.status(404).json({ erro: "Triagem não encontrada" });
    }

    // Um pedido em aberto (ou já aceito) por cliente+advogado: evita mandar o mesmo pedido
    // várias vezes. Depois de uma recusa, pode pedir de novo.
    const existentes = await db
      .collection("solicitacoes")
      .where("clienteId", "==", clienteId)
      .where("advogadoId", "==", advogadoId)
      .get();
    const emAberto = existentes.docs.find((d) => ["pendente", "aceita"].includes(d.data().situacao));
    if (emAberto) {
      return res.status(409).json({
        erro:
          emAberto.data().situacao === "pendente"
            ? "Você já pediu contato a este advogado — aguarde a resposta"
            : "Este advogado já aceitou seu pedido",
        id: emAberto.id,
      });
    }

    const triagem = triagemDoc.data();
    const agora = new Date().toISOString();
    // Cópia do que o cliente autorizou mandar — o advogado lê isso no pedido, mesmo que a
    // triagem mude depois.
    const solicitacao = {
      clienteId,
      advogadoId,
      triagemId,
      autorizouCompartilharEm: agora,
      area: triagem.areaClassificada,
      especialidade: triagem.especialidade || triagem.categorias?.[0] || null,
      descricao: triagem.descricao || "",
      situacao: "pendente",
      createdAt: agora,
      respondidaEm: null,
    };
    const ref = await db.collection("solicitacoes").add(solicitacao);

    await avisar({
      destinatarioId: advogadoId,
      tipo: "solicitacao_nova",
      texto: `Novo pedido de contato: caso ${LABEL_AREA[solicitacao.area] || ""}. Veja as respostas e aceite ou recuse.`,
      link: "/solicitacoes",
      assunto: "Você recebeu um pedido de contato na Nocturis",
      titulo: "Você recebeu um pedido de contato",
      paragrafos: [
        `Um cliente com um caso ${LABEL_AREA[solicitacao.area] || ""} quer falar com você e autorizou você a ver as respostas da triagem dele.`,
        "Leia o caso e responda: se aceitar, ele recebe seu WhatsApp e e-mail pra combinar o atendimento.",
      ],
      botao: "Ver pedido",
    });

    res.status(201).json({ id: ref.id, ...solicitacao });
  },
);

// RF014: o cliente vê os próprios pedidos — advogado, data e situação. Contato do
// advogado só nos aceitos.
solicitacoesRouter.get("/solicitacoes/minhas", verificarToken, requireRole("cliente"), async (req, res) => {
  const snapshot = await db.collection("solicitacoes").where("clienteId", "==", req.user.uid).get();

  const lista = await Promise.all(
    snapshot.docs.map(async (doc) => {
      const s = doc.data();
      const [advogadoDoc, usuarioDoc] = await Promise.all([
        db.collection("advogados").doc(s.advogadoId).get(),
        db.collection("users").doc(s.advogadoId).get(),
      ]);
      const advogado = advogadoDoc.exists ? advogadoDoc.data() : {};
      return {
        id: doc.id,
        advogadoId: s.advogadoId,
        advogadoNome: usuarioDoc.exists ? usuarioDoc.data().nome : null,
        advogadoFoto: advogado.foto || null,
        triagemId: s.triagemId,
        area: s.area,
        especialidade: s.especialidade,
        situacao: s.situacao,
        createdAt: s.createdAt,
        respondidaEm: s.respondidaEm,
        contatos: s.situacao === "aceita" ? advogado.contatos || null : null,
      };
    }),
  );

  lista.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  res.json(lista);
});

// Pedidos que o advogado recebeu, com as respostas da triagem (autorizadas pelo cliente).
// Nome do cliente só depois de aceito.
solicitacoesRouter.get("/solicitacoes/recebidas", verificarToken, requireRole("advogado"), async (req, res) => {
  const snapshot = await db.collection("solicitacoes").where("advogadoId", "==", req.user.uid).get();

  const lista = await Promise.all(
    snapshot.docs.map(async (doc) => {
      const s = doc.data();
      const aceita = s.situacao === "aceita";
      const clienteNome = aceita ? (await db.collection("users").doc(s.clienteId).get()).data()?.nome || null : null;
      return {
        id: doc.id,
        area: s.area,
        especialidade: s.especialidade,
        descricao: s.descricao,
        situacao: s.situacao,
        createdAt: s.createdAt,
        respondidaEm: s.respondidaEm,
        clienteNome,
      };
    }),
  );

  lista.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  res.json(lista);
});

// RF013: o advogado aceita ou recusa um pedido pendente; o cliente é avisado nos dois casos.
solicitacoesRouter.patch(
  "/solicitacoes/:id",
  verificarToken,
  requireRole("advogado"),
  validarBody(schemaResposta),
  async (req, res) => {
    const ref = db.collection("solicitacoes").doc(req.params.id);
    const doc = await ref.get();
    if (!doc.exists || doc.data().advogadoId !== req.user.uid) {
      return res.status(404).json({ erro: "Pedido não encontrado" });
    }
    const solicitacao = doc.data();
    if (solicitacao.situacao !== "pendente") {
      return res.status(409).json({ erro: "Este pedido já foi respondido" });
    }

    const aceitou = req.body.acao === "aceitar";
    const situacao = aceitou ? "aceita" : "recusada";
    await ref.update({ situacao, respondidaEm: new Date().toISOString() });

    const advogadoNome = (await db.collection("users").doc(req.user.uid).get()).data()?.nome || "O advogado";
    await avisar({
      destinatarioId: solicitacao.clienteId,
      tipo: aceitou ? "solicitacao_aceita" : "solicitacao_recusada",
      texto: aceitou
        ? `${advogadoNome} aceitou seu pedido. O contato dele já está liberado.`
        : `${advogadoNome} não pode atender seu caso agora. Você pode pedir contato a outro advogado.`,
      link: "/minhas-solicitacoes",
      assunto: aceitou ? `${advogadoNome} aceitou seu pedido de contato` : "Resposta ao seu pedido de contato",
      titulo: aceitou ? `${advogadoNome} aceitou seu pedido` : `${advogadoNome} não pode atender agora`,
      paragrafos: aceitou
        ? ["O WhatsApp e o e-mail do advogado já aparecem nas suas solicitações. Chame ele pra combinar o atendimento."]
        : ["Isso acontece quando a agenda está cheia ou o caso foge da área dele. Você pode pedir contato a outro advogado compatível."],
      botao: "Ver minhas solicitações",
    });

    res.json({ id: doc.id, situacao });
  },
);
