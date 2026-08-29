import { useEffect } from "react";

// Fecha um painel/dropdown ao clicar fora dele (ex.: NotificationBell) — mousedown, não
// click, pra fechar antes do próximo clique disparar sua própria ação.
export function useOnClickOutside(ref, aoClicarFora) {
  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) aoClicarFora();
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [ref, aoClicarFora]);
}
