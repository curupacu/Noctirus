import { initializeApp } from "firebase/app";
import { browserLocalPersistence, getAuth, setPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  // Domínio próprio, não o *.firebaseapp.com padrão — com domínios diferentes, o Firebase
  // depende de um iframe entre os dois domínios pra sincronizar a sessão, e navegador com
  // bloqueio de storage entre domínios (Safari, PWA instalado) simplesmente não guarda o
  // login (achado do usuário, 29/08: login "some" toda vez que fecha o site/app). Precisa
  // estar na lista de domínios autorizados do Auth (Firebase Console) — já estava, de
  // quando o login com Google foi configurado.
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const firebaseApp = initializeApp(firebaseConfig);
export const auth = getAuth(firebaseApp);
// browserLocalPersistence já é o padrão do SDK, mas fica explícito de propósito — depois
// do bug de sessão sumindo, não vale deixar isso implícito esperando que ninguém mude sem
// perceber.
setPersistence(auth, browserLocalPersistence);
// Só pro sininho de notificação (onSnapshot em tempo real) — o resto do app fala com o
// Firestore só através da API (Admin SDK no backend), essa é a única leitura direta do
// cliente, liberada nas firestore.rules (ver database/firestore.rules).
export const db = getFirestore(firebaseApp);
