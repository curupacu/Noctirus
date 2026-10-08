// Migração do Sprint 1 (outubro/2026): troca o antigo `verificado: true/false` dos
// advogados pela `situacaoOab` ("aprovado" | "em_analise" | "recusado" | "revogado").
//
// Uso: node database/seed/migrar-situacao-oab.js [--remover-verificado]
// (requer GOOGLE_APPLICATION_CREDENTIALS e FIREBASE_PROJECT_ID no ambiente)
//
// Em duas etapas de propósito: sem a flag, só ADICIONA a situação nova e mantém o
// `verificado` — o site que ainda está no ar continua funcionando até o deploy do código
// novo. Depois do deploy, rodar de novo com --remover-verificado pra apagar o campo antigo.
// Advogado que já tem `situacaoOab` não é tocado (dá pra rodar mais de uma vez).
import { cert, initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";

const removerVerificado = process.argv.includes("--remover-verificado");

const app = initializeApp({
  credential: cert(process.env.GOOGLE_APPLICATION_CREDENTIALS),
  projectId: process.env.FIREBASE_PROJECT_ID,
});
const db = getFirestore(app);

const snapshot = await db.collection("advogados").get();
let migrados = 0;
let limpos = 0;

for (const doc of snapshot.docs) {
  const dados = doc.data();
  const campos = {};

  if (!dados.situacaoOab) {
    campos.situacaoOab = dados.verificado ? "aprovado" : "em_analise";
    campos.situacaoOabMotivo = null;
    campos.situacaoOabAtualizadaEm = new Date().toISOString();
    campos.situacaoOabPor = null;
    migrados++;
  }
  if (removerVerificado && "verificado" in dados) {
    campos.verificado = FieldValue.delete();
    limpos++;
  }

  if (Object.keys(campos).length > 0) await doc.ref.update(campos);
}

console.log(`${snapshot.size} advogados lidos, ${migrados} migrados, ${limpos} com "verificado" removido.`);
