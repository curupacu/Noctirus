import { db } from "../lib/firebase-admin.js";

// Filtro de advogados por área + localização (RF006/RF007), usado tanto na listagem
// pública quanto no resultado da triagem. Filtragem em memória (dataset pequeno no MVP).
//
// `categorias` (subcategorias da triagem, ex.: "rescisao_indireta") não filtra a lista —
// só reordena, colocando primeiro quem tem `especialidades` que batem com o caso. Filtrar
// de verdade zeraria resultados fácil (seed tem só 30 advogados pra 33 categorias x 14
// estados); reordenar mantém sempre alguém pra contatar, mas prioriza quem é mais aderente.
export async function buscarAdvogadosCompativeis({
  area,
  cidade,
  uf,
  categorias,
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

  if (categorias?.length) {
    advogados = advogados
      .map((adv) => ({
        ...adv,
        especialidadesCompativeis: (adv.especialidades || []).filter((e) =>
          categorias.includes(e),
        ).length,
      }))
      .sort((a, b) => b.especialidadesCompativeis - a.especialidadesCompativeis);
  }

  return advogados;
}
