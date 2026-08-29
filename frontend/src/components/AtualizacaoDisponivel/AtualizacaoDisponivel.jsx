import { useRegisterSW } from "virtual:pwa-register/react";
import "./AtualizacaoDisponivel.css";

// Registra o service worker (ver vite.config.js, injectRegister:false — o registro fica
// só aqui) e mostra um avisinho quando uma versão nova já foi baixada em segundo plano.
// registerType:"prompt" garante que isso só troca de versão quando a pessoa clicar —
// nunca no meio de um formulário sendo preenchido.
export function AtualizacaoDisponivel() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  if (!needRefresh) return null;

  return (
    <div className="atualizacao-disponivel" role="status">
      <span>Nova versão do app disponível.</span>
      <div className="atualizacao-disponivel__actions">
        <button type="button" onClick={() => updateServiceWorker(true)}>
          Atualizar
        </button>
        <button type="button" onClick={() => setNeedRefresh(false)}>
          Depois
        </button>
      </div>
    </div>
  );
}
