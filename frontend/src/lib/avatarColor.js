// Paleta fixa pra iniciais de avatar: só tons de marrom da marca (28/10/2026: o
// azul-acinzentado, o verde-oliva e o ameixa que tinham aqui destoavam do resto do site).
// O objetivo é só diferenciar visualmente cada pessoa numa lista, não classificar nada.
const PALETA = ["#765039", "#5C3E2B", "#8A5E38", "#3B281C", "#9B6B45", "#6E4A33"];

export function corDoAvatar(semente) {
  const texto = String(semente || "");
  let hash = 0;
  for (let i = 0; i < texto.length; i++) {
    hash = (hash * 31 + texto.charCodeAt(i)) >>> 0;
  }
  return PALETA[hash % PALETA.length];
}
