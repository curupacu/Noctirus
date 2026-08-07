import { Link, useLocation, useNavigate } from "react-router-dom";
import logoIcone from "../../assets/logosvg_sócoruja.svg";
import { useAuth } from "../../features/auth/AuthContext";
import { rotaInicial } from "../../features/auth/rotaInicial";
import { useTheme } from "../../lib/theme";
import { Button } from "../Button/Button";
import { ThemeToggle } from "../ThemeToggle/ThemeToggle";
import "./Header.css";

// "/" entrou na lista junto — a Home virou vitrine de marca sempre escura (própria Logo
// completa já aparece nela) e não deve herdar o Header no tema do resto do app nem
// duplicar o ícone da coruja no topo.
const TELAS_SEM_CABECALHO = ["/", "/login", "/cadastro"];

export function Header() {
  const { user, role, loading, logout } = useAuth();
  const { tema, alternarTema } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  async function handleLogout() {
    await logout();
    navigate("/");
  }

  if (TELAS_SEM_CABECALHO.includes(location.pathname)) return null;

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
