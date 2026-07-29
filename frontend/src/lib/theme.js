import { useEffect, useState } from "react";

const CHAVE = "nocturis-theme";

function lerTemaSalvo() {
  return localStorage.getItem(CHAVE) === "dark" ? "dark" : "light";
}

// Claro é o padrão (RNF de UX pedido pelo time) — o escuro só liga se a pessoa escolher,
// e a escolha fica salva. O index.html tem um script inline que já aplica isso antes do
// React montar, pra não piscar o tema errado.
export function useTheme() {
  const [tema, setTema] = useState(lerTemaSalvo);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", tema);
    localStorage.setItem(CHAVE, tema);
  }, [tema]);

  function alternarTema() {
    setTema((atual) => (atual === "dark" ? "light" : "dark"));
  }

  return { tema, alternarTema };
}
