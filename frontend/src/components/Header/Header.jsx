import { Link, useLocation, useNavigate } from "react-router-dom";
import logoIcone from "../../assets/logosvg_sócoruja.svg";
import { useAuth } from "../../features/auth/AuthContext";
import { rotaInicial } from "../../features/auth/rotaInicial";
import { TELAS_VITRINE } from "../../lib/telasVitrine";
import { useTheme } from "../../lib/theme";
import { useNotificacoes } from "../../lib/useNotificacoes";
import { Button } from "../Button/Button";
import { NotificationBell } from "../NotificationBell/NotificationBell";
import { ThemeToggle } from "../ThemeToggle/ThemeToggle";
import "./Header.css";

export function Header() {
  const { user, role, loading, logout } = useAuth();
  const { tema, alternarTema } = useTheme();
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

      <div className="site-header__actions">
        <ThemeToggle tema={tema} onToggle={alternarTema} />

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
