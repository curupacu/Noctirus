import { useSyncExternalStore } from "react";

// Preferências da tela de Configurações (28/10/2026). Ficam salvas no aparelho (não na
// conta), então valem pra qualquer pessoa que use este navegador, logada ou não. As de
// acessibilidade viram atributos no <html> pro CSS agir no site inteiro.
const CHAVE = "nocturis:preferencias";

const PADRAO = {
  texto: "normal", // normal | grande | maior
  movimento: "normal", // normal | reduzido
  ouvir: false, // botão "Ouvir" nos textos principais
  avisosDesligados: false, // a pessoa desligou os avisos no celular por aqui
};

function ler() {
  try {
    return { ...PADRAO, ...JSON.parse(localStorage.getItem(CHAVE) || "{}") };
  } catch {
    return { ...PADRAO };
  }
}

let atuais = ler();
const ouvintes = new Set();

export function aplicarPreferencias(prefs = atuais) {
  const raiz = document.documentElement;
  raiz.dataset.texto = prefs.texto;
  raiz.dataset.movimento = prefs.movimento;
}

export function lerPreferencias() {
  return atuais;
}

export function salvarPreferencia(nome, valor) {
  atuais = { ...atuais, [nome]: valor };
  try {
    localStorage.setItem(CHAVE, JSON.stringify(atuais));
  } catch {
    // sem localStorage: vale só até fechar a aba
  }
  aplicarPreferencias();
  ouvintes.forEach((avisar) => avisar());
}

export function usePreferencias() {
  return useSyncExternalStore(
    (avisar) => {
      ouvintes.add(avisar);
      return () => ouvintes.delete(avisar);
    },
    () => atuais,
  );
}

// Junta a preferência do aparelho (sistema) com a escolhida aqui.
export function movimentoReduzido() {
  return atuais.movimento === "reduzido" || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
