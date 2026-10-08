// Situação do registro na OAB (RF011) — espelha SITUACOES_OAB em backend/src/services/oab.js.
// Substituiu o antigo `verificado: true/false` em outubro/2026.
export const LABEL_SITUACAO_OAB = {
  em_analise: "OAB em análise",
  aprovado: "OAB verificada",
  recusado: "OAB recusada",
  revogado: "OAB revogada",
};

export function oabAprovada(advogado) {
  return advogado?.situacaoOab === "aprovado";
}

export function labelSituacaoOab(advogado) {
  return LABEL_SITUACAO_OAB[advogado?.situacaoOab] || LABEL_SITUACAO_OAB.em_analise;
}
