import { useEffect, useState } from "react";
import { usePreferencias } from "../../lib/preferencias";
import "./BotaoOuvir.css";

function vozEmPortugues() {
  const vozes = window.speechSynthesis.getVoices();
  return vozes.find((v) => v.lang === "pt-BR") || vozes.find((v) => v.lang?.startsWith("pt"));
}

// "Ouvir" (28/10/2026): lê o texto em voz alta com a voz que o próprio navegador já tem
// (Web Speech API, sem custo e sem serviço externo). Só aparece se a pessoa ligou a opção
// nas Configurações.
export function BotaoOuvir({ texto, className = "" }) {
  const { ouvir } = usePreferencias();
  const [falando, setFalando] = useState(false);
  const temVoz = typeof window !== "undefined" && "speechSynthesis" in window;

  useEffect(() => () => temVoz && window.speechSynthesis.cancel(), [temVoz]);

  if (!ouvir || !temVoz || !texto) return null;

  function alternar() {
    const sintese = window.speechSynthesis;
    if (falando) {
      sintese.cancel();
      setFalando(false);
      return;
    }
    sintese.cancel();
    const fala = new SpeechSynthesisUtterance(texto);
    fala.lang = "pt-BR";
    const voz = vozEmPortugues();
    if (voz) fala.voice = voz;
    fala.onend = () => setFalando(false);
    fala.onerror = () => setFalando(false);
    sintese.speak(fala);
    setFalando(true);
  }

  return (
    <button type="button" className={`botao-ouvir ${className}`.trim()} onClick={alternar} aria-pressed={falando}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {falando ? (
          <rect x="7" y="7" width="10" height="10" rx="1.5" />
        ) : (
          <>
            <path d="M4 9v6h4l5 4V5L8 9H4z" />
            <path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12" />
          </>
        )}
      </svg>
      {falando ? "Parar" : "Ouvir"}
    </button>
  );
}
