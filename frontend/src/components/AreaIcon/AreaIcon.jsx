// Ícone de área (cível/trabalhista) pros cards de triagem — antes era só a inicial
// (C/T) numa caixa colorida, que lia como placeholder inacabado, não ícone de verdade
// (achado do usuário, 18/08). Mesmo estilo de traço do BottomNav (viewBox 24, stroke),
// pra parecer parte do mesmo sistema, não um elemento novo solto.
function IconContrato() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 3h7l4 4v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" />
      <path d="M14 3v4h4" />
      <path d="M9 12.5h6M9 15.5h6M9 9.5h2.5" />
    </svg>
  );
}

function IconMaleta() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="7.5" width="18" height="11.5" rx="2" />
      <path d="M8.5 7.5V5.5a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v2" />
      <path d="M3 12.5h18" />
      <path d="M10.5 12.5v1.5h3v-1.5" />
    </svg>
  );
}

function IconIndefinido() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 9.3a2.5 2.5 0 1 1 3.6 2.3c-.9.5-1.3 1-1.3 1.9" />
      <path d="M12 17h.01" />
    </svg>
  );
}

const ICONES = { civel: IconContrato, trabalhista: IconMaleta };

export function AreaIcon({ area, className }) {
  const Icone = ICONES[area] || IconIndefinido;
  return (
    <span className={`area-icon area-icon--${ICONES[area] ? area : "indefinido"} ${className || ""}`.trim()}>
      <Icone />
    </span>
  );
}
