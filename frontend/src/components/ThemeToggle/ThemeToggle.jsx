import "./ThemeToggle.css";

function IconSol() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  );
}

function IconLua() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
    </svg>
  );
}

// Mostra o ícone da AÇÃO (o que vai acontecer ao clicar), não o estado atual — sol pra
// "ligar o modo claro" enquanto estiver escuro, lua pra "ligar o escuro" enquanto claro.
export function ThemeToggle({ tema, onToggle, className = "" }) {
  const escuro = tema === "dark";
  return (
    <button
      type="button"
      className={`theme-toggle ${className}`}
      onClick={onToggle}
      aria-label={escuro ? "Mudar para modo claro" : "Mudar para modo escuro"}
    >
      {escuro ? <IconSol /> : <IconLua />}
    </button>
  );
}
