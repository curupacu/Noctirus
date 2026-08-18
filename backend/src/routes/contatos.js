import { Router } from "express";
import { db } from "../lib/firebase-admin.js";
import { requireRole, verificarToken } from "../middlewares/auth.js";

export const contatosRouter = Router();

// Etiquetas pré-prontas que o cliente pode marcar num advogado contatado (pedido do
// usuário, 18/08: "mensagens pré-prontas como 'te chamei no whatsapp'") — é um status que
// o próprio cliente escolhe pra se organizar, não uma mensagem enviada de verdade pro
// advogado (a conversa em si acontece fora da plataforma, ver nota de sigilo profissional
// em POST /advogados/:uid/contato).
export const STATUS_CONTATO_CLIENTE = [
  "Chamei no WhatsApp",
  "Mandei e-mail",
  "Aguardando resposta",
  "Já conversamos",
];

// Advogados que o cliente logado já contatou — populado por POST /advogados/:uid/contato
// quando o clique acontece logado. Resolve nome/foto/status do advogado pra não expor o
// documento cru (mesmo padrão de /triagem/:id e /admin/denuncias).
contatosRouter.get("/contatos/meus", verificarToken, requireRole("cliente"), async (req, res) => {
  const snapshot = await db
    .collection("contatosCliente")
    .where("clienteId", "==", req.user.uid)
    .get();

  const contatos = await Promise.all(
    snapshot.docs.map(async (doc) => {
      const dados = doc.data();
      const [advogadoDoc, usuarioDoc] = await Promise.all([
        db.collection("advogados").doc(dados.advogadoId).get(),
        db.collection("users").doc(dados.advogadoId).get(),
      ]);

      return {
        advogadoId: dados.advogadoId,
        status: dados.status || null,
        ultimoContatoEm: dados.ultimoContatoEm,
        advogadoNome: usuarioDoc.exists ? usuarioDoc.data().nome : null,
        advogadoFoto: advogadoDoc.exists ? advogadoDoc.data().foto || null : null,
        advogadoSuspenso: usuarioDoc.exists ? usuarioDoc.data().status === "suspenso" : false,
      };
    }),
  );

  contatos.sort((a, b) => b.ultimoContatoEm.localeCompare(a.ultimoContatoEm));
  res.json(contatos);
});

contatosRouter.patch(
  "/contatos/meus/:advogadoId",
  verificarToken,
  requireRole("cliente"),
  async (req, res) => {
    const { advogadoId } = req.params;
    const { status } = req.body;

    if (status !== null && !STATUS_CONTATO_CLIENTE.includes(status)) {
      return res
        .status(400)
        .json({ erro: `Status deve ser um de: ${STATUS_CONTATO_CLIENTE.join(", ")} ou null` });
    }

    const ref = db.collection("contatosCliente").doc(`${req.user.uid}_${advogadoId}`);
    const doc = await ref.get();
    if (!doc.exists) {
      return res.status(404).json({ erro: "Contato não encontrado" });
    }

    await ref.update({ status });
    res.json({ ok: true });
  },
);

// "Tirar da lista" — remove só o rastreio pessoal do cliente, não o log em `contatos`
// usado nas métricas do advogado (esse é permanente, pra não distorcer os números dele).
contatosRouter.delete(
  "/contatos/meus/:advogadoId",
  verificarToken,
  requireRole("cliente"),
  async (req, res) => {
    const { advogadoId } = req.params;
    const ref = db.collection("contatosCliente").doc(`${req.user.uid}_${advogadoId}`);
    const doc = await ref.get();
    if (!doc.exists) {
      return res.status(404).json({ erro: "Contato não encontrado" });
    }

    await ref.delete();
    res.json({ ok: true });
  },
);
