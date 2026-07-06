// Popula o Firestore com advogados fictícios pra demonstração.
// Uso: node database/seed/seed.js (requer GOOGLE_APPLICATION_CREDENTIALS e
// FIREBASE_PROJECT_ID no ambiente).
import { cert, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import lawyers from "./lawyers.json" with { type: "json" };

const app = initializeApp({
  credential: cert(process.env.GOOGLE_APPLICATION_CREDENTIALS),
  projectId: process.env.FIREBASE_PROJECT_ID,
});

const db = getFirestore(app);

for (const lawyer of lawyers) {
  const { nome, curriculo, ...dadosAdvogado } = lawyer;
  const ref = db.collection("advogados").doc();

  await db.collection("users").doc(ref.id).set({
    role: "advogado",
    nome,
    email: dadosAdvogado.contatos.email,
    telefone: "",
    status: "ativo",
    createdAt: new Date().toISOString(),
  });
  await ref.set(dadosAdvogado);
  await db.collection("curriculos").doc(ref.id).set({
    formacao: curriculo?.formacao || [],
    especializacoes: curriculo?.especializacoes || [],
    cursos: curriculo?.cursos || [],
    experiencias: curriculo?.experiencias || [],
  });

  console.log(`Advogado criado: ${nome} (${ref.id})`);
}
