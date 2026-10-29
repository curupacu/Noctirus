import { useSyncExternalStore } from "react";

// beforeinstallprompt só existe em navegadores Chromium (Chrome/Edge/Samsung Internet) —
// no Safari/iOS nunca dispara; lá a instalação é via "Compartilhar > Adicionar à Tela de
// Início", que já funciona sozinho com as meta tags apple-mobile-web-app-* do index.html,
// sem precisar de nenhum JS. Esse hook só cobre o botão de instalar do lado Android/desktop.
//
// O evento dispara uma vez só por visita (28/10/2026): antes cada componente ouvia por conta
// própria, então quem montava depois (a tela de Configurações) nunca recebia e dizia que não
// dava pra instalar com o botão do cabeçalho ali do lado. Agora ele fica guardado aqui.
let evento = null;
let instalado = typeof window !== "undefined" && window.matchMedia("(display-mode: standalone)").matches;
const ouvintes = new Set();
const avisar = () => ouvintes.forEach((fn) => fn());

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    evento = e;
    avisar();
  });
  window.addEventListener("appinstalled", () => {
    evento = null;
    instalado = true;
    avisar();
  });
}

function assinar(fn) {
  ouvintes.add(fn);
  return () => ouvintes.delete(fn);
}

export function usePwaInstall() {
  const podeInstalar = useSyncExternalStore(assinar, () => !!evento && !instalado);

  async function instalar() {
    if (!evento) return;
    const atual = evento;
    atual.prompt();
    await atual.userChoice;
    evento = null;
    avisar();
  }

  return { podeInstalar, instalar };
}
