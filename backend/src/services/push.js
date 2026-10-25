import { db } from "../lib/firebase-admin.js";

// Aviso no celular (o mesmo lugar das notificações do WhatsApp), pelo Firebase Cloud
// Messaging — gratuito, sem plano pago. Cada aparelho que a pessoa autorizou vira um token
// em users/{uid}.tokensPush (ver POST /users/me/avisos-celular). Só "data" na mensagem:
// quem monta e mostra o aviso é o service worker do site (frontend/public/push-sw.js),
// assim o texto e o link pra abrir ficam iguais em Android, iPhone e computador.

const ERROS_TOKEN_MORTO = [
  "messaging/registration-token-not-registered",
  "messaging/invalid-registration-token",
  "messaging/invalid-argument",
];

export async function enviarPush(destinatarioId, { texto, link }) {
  const ref = db.collection("users").doc(destinatarioId);
  const tokens = (await ref.get()).data()?.tokensPush || [];
  if (!tokens.length) return;

  // Import sob demanda: os testes trocam lib/firebase-admin.js por um fake e nunca chegam
  // aqui (usuário de teste não tem token), então o Messaging de verdade só carrega em produção.
  const { getMessaging } = await import("firebase-admin/messaging");
  const resposta = await getMessaging().sendEachForMulticast({
    tokens,
    data: { titulo: "Nocturis", texto, link: link || "/" },
    webpush: { headers: { Urgency: "high" } },
  });

  // Aparelho desinstalou o app ou tirou a permissão: o token morre e sai da lista.
  const mortos = tokens.filter((_, i) => ERROS_TOKEN_MORTO.includes(resposta.responses[i]?.error?.code));
  if (mortos.length) {
    await ref.update({ tokensPush: tokens.filter((t) => !mortos.includes(t)) });
  }
}
