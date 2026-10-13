import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import logoIcone from "../../assets/logosvg_sócoruja.svg";
import { useAuth } from "../../features/auth/AuthContext";
import { rotaInicial } from "../../features/auth/rotaInicial";
import { TELAS_VITRINE } from "../../lib/telasVitrine";
import { useNotificacoes } from "../../lib/useNotificacoes";
import { itensNavegacao } from "../BottomNav/BottomNav";
import { Button } from "../Button/Button";
import { InstallButton } from "../InstallButton/InstallButton";
import { NotificationBell } from "../NotificationBell/NotificationBell";
import "./Header.css";

export function Header() {
  const { user, role, loading, logout } = useAuth();
  const { notificacoes, naoLidas, marcarComoLida } = useNotificacoes(user?.uid);
  const navigate = useNavigate();
  const location = useLocation();

  async function handleLogout() {
    await logout();
    navigate("/");
  }

  if (TELAS_VITRINE.includes(location.pathname)) return null;

  return (
    <header className="site-header">
      <Link to={user ? rotaInicial(role) : "/"} className="site-header__brand" aria-label="Nocturis">
        <img src={logoIcone} alt="Nocturis" className="site-header__logo" />
      </Link>

      {/* No computador o menu mora aqui em cima (a barra de baixo é só do celular). */}
      {!loading && user && (
        <nav className="site-header__nav" aria-label="Menu principal">
          {itensNavegacao(role).map(({ to, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => `site-header__nav-item${isActive ? " site-header__nav-item--ativo" : ""}`}
            >
              {label}
            </NavLink>
          ))}
        </nav>
      )}

      <div className="site-header__actions">
        <InstallButton />

        {!loading && (
          <>
            {user ? (
              <>
                <NotificationBell
                  notificacoes={notificacoes}
                  naoLidas={naoLidas}
                  marcarComoLida={marcarComoLida}
                />
                <span className="avatar-placeholder site-header__avatar">
                  {(user.email || "?").charAt(0).toUpperCase()}
                </span>
                <Button variant="secondary" onClick={handleLogout}>
                  Sair
                </Button>
              </>
            ) : (
              <Link to="/login" className="site-header__link">
                Entrar
              </Link>
            )}
          </>
        )}
      </div>
    </header>
  );
}
