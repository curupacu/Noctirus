import { db } from "../lib/firebase-admin.js";
import { UFS } from "../lib/localizacao.js";

// Situação do registro na OAB de cada advogado (RF011). Todo advogado nasce "em_analise";
// só o admin muda, depois de conferir o número no Cadastro Nacional dos Advogados. Só
// "aprovado" pode aparecer pro cliente (RF009 — esse filtro entra no Sprint 2).
export const SITUACOES_OAB = ["em_analise", "aprovado", "recusado", "revogado"];
// Recusar ou revogar sempre exige dizer o porquê — o advogado vê esse motivo.
export const SITUACOES_COM_MOTIVO = ["recusado", "revogado"];

// Pra onde cada situação pode ir pelas mãos do admin. Recusar é só pra quem ainda está em
// análise; revogar é só pra quem já foi aprovado (inscrição deixou de estar ativa). Quem
// foi recusado ou revogado pode ser aprovado de novo depois de uma nova conferência. Voltar
// pra "em_analise" só acontece quando o próprio advogado corrige a OAB recusada.
export const TRANSICOES_OAB = {
  em_analise: ["aprovado", "recusado"],
  aprovado: ["revogado"],
  recusado: ["aprovado"],
  revogado: ["aprovado"],
};

export function podeMudarSituacao(de, para) {
  return (TRANSICOES_OAB[de || "em_analise"] || []).includes(para);
}

export function validarFormatoOab({ numero, uf }) {
  if (!numero || !/^\d{4,7}$/.test(String(numero))) {
    return "Número da OAB inválido (esperado 4 a 7 dígitos)";
  }
  if (!uf || !UFS.includes(String(uf).toUpperCase())) {
    return "UF da OAB inválida";
  }
  return null;
}

export async function oabJaCadastrada({ numero, uf }, uidParaIgnorar = null) {
  const snapshot = await db
    .collection("advogados")
    .where("oab.numero", "==", String(numero))
    .where("oab.uf", "==", String(uf).toUpperCase())
    .get();

  return snapshot.docs.some((doc) => doc.id !== uidParaIgnorar);
}
