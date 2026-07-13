import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../features/auth/AuthContext";
import { rotaInicial } from "../../features/auth/rotaInicial";
import { Button } from "../Button/Button";
import "./Header.css";

const TELAS_SEM_CABECALHO = ["/login", "/cadastro"];

export function Header() {
  const { user, role, loading, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  async function handleLogout() {
    await logout();
    navigate("/");
  }

  if (TELAS_SEM_CABECALHO.includes(location.pathname)) return null;

  return (
    <header className="site-header">
      <Link to={user ? rotaInicial(role) : "/"} className="site-header__brand">
        Nocturis
      </Link>

      {!loading && (
        <div className="site-header__actions">
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
        </div>
      )}
    </header>
  );
}
