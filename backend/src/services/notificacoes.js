import { db } from "../lib/firebase-admin.js";
import { enviarPush } from "./push.js";

// Notificação em tempo real (sininho) — o frontend escuta essa coleção direto com
// onSnapshot (ver lib/useNotificacoes.js), sem precisar dar refresh ou consultar a API.
// Só o backend escreve aqui (ver firestore.rules); nunca pode derrubar a ação principal
// (enviar mensagem) se falhar — por isso quem chama envolve isso num
// try/catch próprio.
export async function criarNotificacao({ destinatarioId, tipo, texto, link }) {
  await db.collection("notificacoes").add({
    destinatarioId,
    tipo,
    texto,
    link,
    lida: false,
    createdAt: new Date().toISOString(),
  });
  // Mesmo aviso no celular de quem ativou. Falha aqui não apaga o do sininho.
  try {
    await enviarPush(destinatarioId, { texto, link });
  } catch (erro) {
    console.error("notificacoes: falha ao enviar aviso no celular:", erro.message || erro);
  }
}
