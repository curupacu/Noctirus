import "./PerfilCompletude.css";

const CHECK = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

// Barra + checklist de completude do perfil do advogado. Some sozinha quando o perfil
// já está 100% — não faz sentido continuar cobrando quem já preencheu tudo.
export function PerfilCompletude({ itens }) {
  const completos = itens.filter((item) => item.completo).length;
  const pct = Math.round((completos / itens.length) * 100);

  if (pct === 100) return null;

  return (
    <div className="completude">
      <div className="completude__header">
        <span className="eyebrow" style={{ marginBottom: 0 }}>
          Complete seu perfil
        </span>
        <span className="completude__pct">{pct}%</span>
      </div>
      <div className="completude__track">
        <div className="completude__fill" style={{ width: `${pct}%` }} />
      </div>
      <p className="text-muted completude__hint">
        Perfis completos aparecem com mais confiança pra quem está buscando advogado.
      </p>
      <ul className="completude__list">
        {itens.map((item) => (
          <li
            key={item.label}
            className={`completude__item${item.completo ? " completude__item--ok" : ""}`}
          >
            <span className="completude__dot" aria-hidden="true">
              {item.completo && CHECK}
            </span>
            {item.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
