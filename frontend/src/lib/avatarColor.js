// Paleta fixa (não troca com o tema) pra iniciais de avatar de advogado — tons
// derivados da marca (marrom, terracota, ameixa, verde-oliva, slate), nunca o dourado
// de acento (reservado pro badge de OAB verificada, ver docs/DESIGN.md). O objetivo é
// só diferenciar visualmente cada advogado numa lista, não classificar nada.
const PALETA = ["#8A5E38", "#4A3420", "#4C5A72", "#5C6B4F", "#8C5A3D", "#6B4055"];

export function corDoAvatar(semente) {
  const texto = String(semente || "");
  let hash = 0;
  for (let i = 0; i < texto.length; i++) {
    hash = (hash * 31 + texto.charCodeAt(i)) >>> 0;
  }
  return PALETA[hash % PALETA.length];
}
