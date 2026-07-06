// Cria o usuário admin diretamente (não existe cadastro público pra admin).
// Uso: node database/seed/criar-admin.js <email> <senha> <nome>
// Requer GOOGLE_APPLICATION_CREDENTIALS e FIREBASE_PROJECT_ID configurados no ambiente.
import { cert, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

const [email, senha, nome] = process.argv.slice(2);

if (!email || !senha || !nome) {
  console.error("Uso: node database/seed/criar-admin.js <email> <senha> <nome>");
  process.exit(1);
}

const app = initializeApp({
  credential: cert(process.env.GOOGLE_APPLICATION_CREDENTIALS),
  projectId: process.env.FIREBASE_PROJECT_ID,
});

const auth = getAuth(app);
const db = getFirestore(app);

const usuario = await auth.createUser({ email, password: senha, displayName: nome });
await auth.setCustomUserClaims(usuario.uid, { role: "admin" });

await db.collection("users").doc(usuario.uid).set({
  role: "admin",
  nome,
  email,
  telefone: "",
  status: "ativo",
  createdAt: new Date().toISOString(),
});

console.log(`Admin criado: ${email} (uid: ${usuario.uid})`);
