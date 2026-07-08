import { db } from "../lib/firebase-admin.js";

// Filtro de advogados por área + localização (RF006/RF007), usado tanto na listagem
// pública quanto no resultado da triagem. Filtragem em memória (dataset pequeno no MVP).
export async function buscarAdvogadosCompativeis({ area, cidade, uf } = {}) {
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

  return advogados;
}
