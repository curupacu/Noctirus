import { db } from "../lib/firebase-admin.js";

const UFS = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO",
  "MA", "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI",
  "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO",
];

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
