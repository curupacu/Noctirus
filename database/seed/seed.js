// Popula o Firestore de `nocturis-dev` com advogados fictícios para demonstração.
// Uso: node database/seed/seed.js (requer GOOGLE_APPLICATION_CREDENTIALS configurado).
import { cert, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import lawyers from "./lawyers.json" with { type: "json" };

const app = initializeApp({
  credential: cert(process.env.GOOGLE_APPLICATION_CREDENTIALS),
  projectId: process.env.FIREBASE_PROJECT_ID || "nocturis-dev",
});

const db = getFirestore(app);

for (const lawyer of lawyers) {
  const ref = db.collection("advogados").doc();
  await ref.set(lawyer);
  console.log(`Advogado criado: ${lawyer.nome} (${ref.id})`);
}
