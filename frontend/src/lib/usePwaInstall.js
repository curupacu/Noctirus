import { useEffect, useState } from "react";

// beforeinstallprompt só existe em navegadores Chromium (Chrome/Edge/Samsung Internet) —
// no Safari/iOS nunca dispara; lá a instalação é via "Compartilhar > Adicionar à Tela de
// Início", que já funciona sozinho com as meta tags apple-mobile-web-app-* do index.html,
// sem precisar de nenhum JS. Esse hook só cobre o botão de instalar do lado Android/desktop.
export function usePwaInstall() {
  const [evento, setEvento] = useState(null);
  const [instalado, setInstalado] = useState(
    () => window.matchMedia("(display-mode: standalone)").matches,
  );

  useEffect(() => {
    function aoFicarInstalavel(e) {
      e.preventDefault();
      setEvento(e);
    }
    function aoInstalar() {
      setEvento(null);
      setInstalado(true);
    }
    window.addEventListener("beforeinstallprompt", aoFicarInstalavel);
    window.addEventListener("appinstalled", aoInstalar);
    return () => {
      window.removeEventListener("beforeinstallprompt", aoFicarInstalavel);
      window.removeEventListener("appinstalled", aoInstalar);
    };
  }, []);

  async function instalar() {
    if (!evento) return;
    evento.prompt();
    await evento.userChoice;
    setEvento(null);
  }

  return { podeInstalar: !!evento && !instalado, instalar };
}
