import { initializeApp } from "firebase/app";
import { browserLocalPersistence, getAuth, setPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  // Fica em *.firebaseapp.com (não o domínio próprio) de propósito — testado trocar pro
  // domínio próprio em 29/08 achando que resolvia o bug de sessão sumindo, mas quebrou o
  // login com Google (nocturis.com.br/__/auth/handler cai na nossa 404 em vez da página
  // de callback do Firebase — as URLs reservadas /__/auth/** não são servidas em domínio
  // customizado do jeito que a documentação sugere). Revertido no mesmo dia.
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
