// Aplica bio/foto (e reconfirma especialidades) do lawyers.json nos advogados que já
// existem no Firestore, casando por número da OAB — não cria documento novo nem duplica
// nada, só faz update() dos campos que vieram no JSON.
// Uso: node database/seed/atualizar-bio-foto.js
// Requer GOOGLE_APPLICATION_CREDENTIALS e FIREBASE_PROJECT_ID configurados no ambiente.
import { cert, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import lawyers from "./lawyers.json" with { type: "json" };

const app = initializeApp({
  credential: cert(process.env.GOOGLE_APPLICATION_CREDENTIALS),
  projectId: process.env.FIREBASE_PROJECT_ID,
});

const db = getFirestore(app);
const snap = await db.collection("advogados").get();
const porOab = new Map(snap.docs.map((d) => [`${d.data().oab?.numero}/${d.data().oab?.uf}`, d]));

let atualizados = 0;
let semCorrespondencia = [];

for (const lawyer of lawyers) {
  const chave = `${lawyer.oab.numero}/${lawyer.oab.uf}`;
  const doc = porOab.get(chave);
  if (!doc) {
    semCorrespondencia.push(lawyer.nome);
    continue;
  }
  await doc.ref.update({
    bio: lawyer.bio,
    foto: lawyer.foto,
    especialidades: lawyer.especialidades,
  });
  atualizados++;
  console.log(`Atualizado: ${lawyer.nome} (${doc.id})`);
}

console.log(`\n${atualizados} advogados atualizados.`);
if (semCorrespondencia.length) {
  console.log(`Sem correspondência no Firestore (não existiam ainda): ${semCorrespondencia.join(", ")}`);
}
