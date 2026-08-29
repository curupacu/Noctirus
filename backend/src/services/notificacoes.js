import { db } from "../lib/firebase-admin.js";

// Notificação em tempo real (sininho) — o frontend escuta essa coleção direto com
// onSnapshot (ver lib/useNotificacoes.js), sem precisar dar refresh ou consultar a API.
// Só o backend escreve aqui (ver firestore.rules); nunca pode derrubar a ação principal
// (enviar mensagem, resolver denúncia) se falhar — por isso quem chama envolve isso num
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
}
