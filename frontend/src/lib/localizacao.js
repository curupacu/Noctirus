// Mesma lista do backend (backend/src/lib/localizacao.js) — a UF é escolhida numa lista em
// vez de digitada, pra não chegar "São Paulo" ou "sp " no lugar de "SP".
export const UFS = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO",
  "MA", "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI",
  "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO",
];

export function textoLocalizacao(localizacao) {
  const { cidade, uf } = localizacao || {};
  if (cidade && uf) return `${cidade}/${uf}`;
  return cidade || uf || null;
}
