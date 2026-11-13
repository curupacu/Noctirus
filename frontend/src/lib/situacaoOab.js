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

// Perfis de demonstração (advogados fictícios do projeto) não exibem "OAB verificada" nem o
// número da OAB: o número é inventado e poderia coincidir com o de alguém real.
export function ehDemonstracao(advogado) {
  return advogado?.demonstracao === true;
}

export function labelSituacaoOab(advogado) {
  if (ehDemonstracao(advogado)) return "Perfil de demonstração";
  return LABEL_SITUACAO_OAB[advogado?.situacaoOab] || LABEL_SITUACAO_OAB.em_analise;
}
