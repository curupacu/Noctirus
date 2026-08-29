import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const SUFIXO = " · Nocturis";
const TITULO_PADRAO = "Nocturis — Advocacia Virtual: Triagem e Direcionamento Jurídico";

// Título único por rota (cada página da SPA usava o mesmo <title> estático do index.html)
// e, de quebra, o pageview do GA4 — a config automática do gtag só dispara uma vez no
// carregamento do script (ver index.html, send_page_view: false), então numa SPA cada
// troca de rota via React Router precisa mandar o evento na mão.
export function useTitulo(titulo) {
  const location = useLocation();

  useEffect(() => {
    document.title = titulo ? `${titulo}${SUFIXO}` : TITULO_PADRAO;

    if (typeof window.gtag === "function") {
      window.gtag("event", "page_view", {
        page_title: document.title,
        page_location: window.location.href,
        page_path: location.pathname + location.search,
      });
    }
  }, [titulo, location.pathname, location.search]);
}
