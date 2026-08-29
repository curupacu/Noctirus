import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useOnClickOutside } from "../../lib/useOnClickOutside";
import "./NotificationBell.css";

function tempoRelativo(iso) {
  const segundos = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (segundos < 60) return "agora";
  const minutos = Math.floor(segundos / 60);
  if (minutos < 60) return `${minutos}min`;
  const horas = Math.floor(minutos / 60);
  if (horas < 24) return `${horas}h`;
  return `${Math.floor(horas / 24)}d`;
}

export function NotificationBell({ notificacoes, naoLidas, marcarComoLida }) {
  const [aberto, setAberto] = useState(false);
  const navigate = useNavigate();
  const ref = useRef(null);
  useOnClickOutside(ref, () => setAberto(false));

  function abrirNotificacao(n) {
    if (!n.lida) marcarComoLida(n.id);
    setAberto(false);
    if (n.link) navigate(n.link);
  }

  return (
    <div className="notification-bell" ref={ref}>
      <button
        type="button"
        className="notification-bell__toggle"
        onClick={() => setAberto((v) => !v)}
        aria-label={naoLidas > 0 ? `Notificações (${naoLidas} não lidas)` : "Notificações"}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {naoLidas > 0 && <span className="notification-bell__badge">{naoLidas > 9 ? "9+" : naoLidas}</span>}
      </button>

      {aberto && (
        <div className="notification-bell__panel">
          <span className="notification-bell__title">Notificações</span>
          {notificacoes.length === 0 && (
            <p className="text-muted notification-bell__vazio">Nada por aqui ainda.</p>
          )}
          {notificacoes.map((n) => (
            <button
              key={n.id}
              type="button"
              className={`notification-bell__item${n.lida ? "" : " notification-bell__item--nao-lida"}`}
              onClick={() => abrirNotificacao(n)}
            >
              <span className="notification-bell__texto">{n.texto}</span>
              <span className="notification-bell__quando">{tempoRelativo(n.createdAt)}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
