import { Resend } from "resend";

// Mesmo padrão opcional do Gemini/Groq: sem RESEND_API_KEY configurada, o backend não
// quebra — só não manda e-mail (loga o motivo). Remetente usa mail.nocturis.com.br (não
// o domínio raiz) — subdomínio dedicado só pra e-mail transacional, verificado no
// Resend via DNS (19/08), pra não conflitar com nada que já exista no domínio raiz.
const REMETENTE = process.env.RESEND_FROM || "Nocturis <notificacoes@mail.nocturis.com.br>";

let clienteResend = null;
function clienteEmail() {
  if (!process.env.RESEND_API_KEY) return null;
  if (!clienteResend) clienteResend = new Resend(process.env.RESEND_API_KEY);
  return clienteResend;
}

export async function enviarEmail({ to, subject, html }) {
  const resend = clienteEmail();
  if (!resend) {
    console.log(`email: RESEND_API_KEY não configurada — não enviado (destinatário: ${to}, assunto: "${subject}")`);
    return { enviado: false };
  }

  try {
    await resend.emails.send({ from: REMETENTE, to, subject, html });
    return { enviado: true };
  } catch (erro) {
    // Nunca derruba a rota que chamou isso (ex.: envio de mensagem no chat) — notificação
    // é um "nice to have", não pode impedir a ação principal do usuário.
    console.error("email: falha ao enviar —", erro.message || erro);
    return { enviado: false };
  }
}
