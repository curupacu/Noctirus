import { api } from "./api";
import { firebaseApp } from "./firebase";

// Avisos no celular pelo Firebase Cloud Messaging (gratuito). A chave pública VAPID vem do
// Firebase Console (Configurações do projeto > Cloud Messaging > Certificados push da Web).
// Sem ela no .env, o recurso fica escondido em vez de quebrar.
const CHAVE_VAPID = import.meta.env.VITE_FIREBASE_VAPID_KEY;

export function ehIphone() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

export function estaInstalado() {
  return window.matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
}

export function avisosConfigurados() {
  return Boolean(CHAVE_VAPID);
}

// iPhone só tem Notification/PushManager dentro do app instalado (iOS 16.4 ou mais novo).
export function suportaAvisos() {
  return avisosConfigurados() && "Notification" in window && "serviceWorker" in navigator && "PushManager" in window;
}

function registroDoServiceWorker() {
  return Promise.race([
    navigator.serviceWorker.ready,
    new Promise((_, rejeitar) => setTimeout(() => rejeitar(new Error("service worker não ficou pronto")), 10000)),
  ]);
}

// Gera (ou renova) o token deste aparelho e manda pro backend. Chamado ao ativar e, depois,
// em silêncio a cada visita, porque o token pode mudar com o tempo.
export async function registrarAparelho() {
  const { getMessaging, getToken, isSupported } = await import("firebase/messaging");
  if (!(await isSupported())) throw new Error("Este navegador não recebe avisos.");
  const token = await getToken(getMessaging(firebaseApp), {
    vapidKey: CHAVE_VAPID,
    serviceWorkerRegistration: await registroDoServiceWorker(),
  });
  if (token) await api.post("/users/me/avisos-celular", { token });
}

export async function ativarAvisos() {
  const permissao = await Notification.requestPermission();
  if (permissao === "granted") await registrarAparelho();
  return permissao;
}
