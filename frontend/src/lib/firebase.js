import { initializeApp } from "firebase/app";
import { getAuth, indexedDBLocalPersistence, setPersistence } from "firebase/auth";
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
// Era browserLocalPersistence (achando que era "o padrão mais seguro do SDK") — na
// verdade essa suposição estava errada e era a causa provável do bug de sessão sumindo:
// o SDK moderno já usa indexedDB como padrão por ser bem mais confiável que localStorage
// em PWA/app fechado no Android (localStorage é mais sujeito a eviction do navegador).
// Diagnóstico do usuário em 08/09 achou o indexedDB (firebaseLocalStorageDb) intacto na
// hora que a sessão "sumiu" — ou seja, o dado sobrevivia, só não era mais a fonte de
// verdade porque a gente tinha forçado localStorage explicitamente. Ficando explícito
// mesmo assim, só que agora com o valor certo.
setPersistence(auth, indexedDBLocalPersistence).catch((err) => {
  console.error("Falha ao configurar persistência de sessão", err);
});
// Só pro sininho de notificação (onSnapshot em tempo real) — o resto do app fala com o
// Firestore só através da API (Admin SDK no backend), essa é a única leitura direta do
// cliente, liberada nas firestore.rules (ver database/firestore.rules).
export const db = getFirestore(firebaseApp);
