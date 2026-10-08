import { enviarEmail } from "../lib/email.js";
import { db } from "../lib/firebase-admin.js";
import { templateAviso } from "../lib/emailTemplates.js";
import { criarNotificacao } from "./notificacoes.js";

const SITE_URL = "https://nocturis.com.br";

// O que o advogado lê no sininho e no e-mail a cada decisão do admin sobre a OAB (RF011:
// "notificando o advogado em cada caso"). Em linguagem direta, sem juridiquês.
function mensagens({ situacao, motivo }) {
  if (situacao === "aprovado") {
    return {
      notificacao: "Sua OAB foi verificada. Seu perfil já aparece pros clientes.",
      assunto: "Sua OAB foi verificada na Nocturis",
      titulo: "Sua OAB foi verificada",
      paragrafos: [
        "Conferimos seu registro na OAB e seu perfil já aparece pros clientes que fazem triagem na sua área.",
        "Vale completar o perfil com foto e currículo: é o que o cliente olha antes de escolher.",
      ],
      botao: "Ver meu painel",
      link: "/perfil",
    };
  }
  if (situacao === "recusado") {
    return {
      notificacao: `Não conseguimos confirmar sua OAB. Motivo: ${motivo}`,
      assunto: "Não conseguimos confirmar sua OAB na Nocturis",
      titulo: "Não conseguimos confirmar sua OAB",
      paragrafos: [
        `Motivo: ${motivo}`,
        "Se o número ou a UF estiverem errados, corrija no seu perfil e envie de novo pra análise.",
      ],
      botao: "Corrigir minha OAB",
      link: "/perfil/editar",
    };
  }
  return {
    notificacao: `Sua aprovação na Nocturis foi revogada. Motivo: ${motivo}`,
    assunto: "Sua aprovação na Nocturis foi revogada",
    titulo: "Sua aprovação foi revogada",
    paragrafos: [
      `Motivo: ${motivo}`,
      "Seu perfil deixou de aparecer pros clientes. A Nocturis só exibe advogados com inscrição ativa na OAB.",
    ],
    botao: "Ver meu painel",
    link: "/perfil",
  };
}

// Sininho e e-mail são extras: falha em qualquer um dos dois nunca desfaz a decisão do admin.
export async function avisarAdvogadoSobreOab({ uid, situacao, motivo }) {
  const texto = mensagens({ situacao, motivo });

  try {
    await criarNotificacao({
      destinatarioId: uid,
      tipo: "situacao_oab",
      texto: texto.notificacao,
      link: texto.link,
    });
  } catch (erro) {
    console.error("avisosOab: falha ao criar notificação —", erro.message || erro);
  }

  try {
    const usuario = (await db.collection("users").doc(uid).get()).data();
    if (!usuario?.email) return;
    await enviarEmail({
      to: usuario.email,
      subject: texto.assunto,
      html: templateAviso({
        titulo: texto.titulo,
        paragrafos: texto.paragrafos,
        botaoTexto: texto.botao,
        link: `${SITE_URL}${texto.link}`,
      }),
    });
  } catch (erro) {
    console.error("avisosOab: falha ao enviar e-mail —", erro.message || erro);
  }
}
