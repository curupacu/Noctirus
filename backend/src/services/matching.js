import { db } from "../lib/firebase-admin.js";

// Filtro de advogados por área + localização (RF006/RF007), usado tanto na listagem
// pública quanto no resultado da triagem. Filtragem em memória (dataset pequeno no MVP).
//
// `categorias` (subcategorias da triagem, ex.: "rescisao_indireta") não filtra a lista —
// só reordena, colocando primeiro quem tem `especialidades` que batem com o caso. Filtrar
// de verdade zeraria resultados fácil (seed tem só 30 advogados pra 33 categorias x 14
// estados); reordenar mantém sempre alguém pra contatar, mas prioriza quem é mais aderente.
// Compara cidade sem diferenciar maiúscula nem acento ("São Paulo" = "sao paulo").
function normalizarCidade(cidade) {
  return String(cidade || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

// `somenteAprovados` (padrão) deixa de fora quem não teve a OAB aprovada pelo admin — o
// cliente só vê advogado aprovado (RF009). Só a fila do admin passa `false`.
//
// `perto` é a localização do cliente no resultado da triagem (RF008): fica só quem atende
// no mesmo estado, e quem é da mesma cidade vem primeiro (marcado com `mesmaCidade`).
// Diferente de `cidade`/`uf` (filtro manual da listagem pública), que só filtram.
export async function buscarAdvogadosCompativeis({
  area,
  cidade,
  uf,
  categorias,
  perto,
  somenteAprovados = true,
} = {}) {
  const snapshot = await db.collection("advogados").get();
  let advogados = await Promise.all(
    snapshot.docs.map(async (doc) => {
      const usuarioDoc = await db.collection("users").doc(doc.id).get();
      return {
        uid: doc.id,
        nome: usuarioDoc.exists ? usuarioDoc.data().nome : null,
        ...doc.data(),
      };
    }),
  );

  if (somenteAprovados) {
    advogados = advogados.filter((adv) => adv.situacaoOab === "aprovado");
  }
  if (area) {
    advogados = advogados.filter((adv) => adv.areasAtuacao?.includes(area));
  }
  if (uf) {
    advogados = advogados.filter(
      (adv) => adv.localizacao?.uf?.toUpperCase() === String(uf).toUpperCase(),
    );
  }
  if (cidade) {
    advogados = advogados.filter((adv) =>
      adv.localizacao?.cidade?.toLowerCase().includes(String(cidade).toLowerCase()),
    );
  }

  if (perto?.uf) {
    const ufCliente = String(perto.uf).toUpperCase();
    const cidadeCliente = normalizarCidade(perto.cidade);
    advogados = advogados
      .filter((adv) => adv.localizacao?.uf?.toUpperCase() === ufCliente)
      .map((adv) => ({
        ...adv,
        mesmaCidade: Boolean(cidadeCliente) && normalizarCidade(adv.localizacao?.cidade) === cidadeCliente,
      }));
  }

  if (categorias?.length) {
    advogados = advogados.map((adv) => ({
      ...adv,
      especialidadesCompativeis: (adv.especialidades || []).filter((e) => categorias.includes(e)).length,
    }));
  }

  // Mesma cidade primeiro; dentro disso, quem atende mais das especialidades do caso.
  // (sort é estável: sem nenhum dos dois critérios, a ordem original fica.)
  if (perto?.uf || categorias?.length) {
    advogados.sort(
      (a, b) =>
        Number(b.mesmaCidade || 0) - Number(a.mesmaCidade || 0) ||
        (b.especialidadesCompativeis || 0) - (a.especialidadesCompativeis || 0),
    );
  }

  return advogados;
}
