import { NavLink } from "react-router-dom";
import { useAuth } from "../../features/auth/AuthContext";
import { rotaInicial } from "../../features/auth/rotaInicial";
import "./BottomNav.css";

function IconInicio() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 11.5 12 4l9 7.5" />
      <path d="M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9" />
    </svg>
  );
}

function IconTriagem() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="4" width="14" height="17" rx="2" />
      <path d="M9 4V3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1" />
      <path d="M9 12.5l2 2 4-4.5" />
    </svg>
  );
}

function IconAdvogados() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
      <circle cx="17.5" cy="9" r="2.3" />
      <path d="M15.7 14.3c2.5.5 4.3 2.7 4.3 5.7" />
    </svg>
  );
}

function IconPerfil() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" />
    </svg>
  );
}

export function BottomNav() {
  const { user, role, loading } = useAuth();

  if (loading || !user) return null;

  const itens = [
    { to: rotaInicial(role), label: "Início", Icon: IconInicio, end: true },
    ...(role === "cliente" ? [{ to: "/triagem", label: "Triagem", Icon: IconTriagem }] : []),
    { to: "/advogados", label: "Advogados", Icon: IconAdvogados },
    { to: "/perfil", label: "Perfil", Icon: IconPerfil },
  ];

  return (
    <>
      <div className="bottom-nav-spacer" aria-hidden="true" />
      <nav className="bottom-nav">
        {itens.map(({ to, label, Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) => `bottom-nav__item${isActive ? " bottom-nav__item--active" : ""}`}
          >
            <Icon />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </>
  );
}
