import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../features/auth/AuthContext";
import { rotaInicial } from "../../features/auth/rotaInicial";
import { Button } from "../Button/Button";
import "./Header.css";

export function Header() {
  const { user, role, loading, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate("/");
  }

  return (
    <header className="site-header">
      <Link to="/" className="site-header__brand">
        Nocturis
      </Link>

      <nav className="site-header__nav">
        <Link to="/advogados" className="site-header__link">
          Advogados
        </Link>

        {loading ? null : user ? (
          <>
            <Link to={rotaInicial(role)} className="site-header__link">
              Início
            </Link>
            {role === "cliente" && (
              <>
                <Link to="/triagem" className="site-header__link">
                  Fazer triagem
                </Link>
                <Link to="/minhas-triagens" className="site-header__link">
                  Minhas triagens
                </Link>
              </>
            )}
            <Link to="/perfil" className="site-header__link">
              Meu perfil
            </Link>
            <span className="site-header__user">{user.email}</span>
            <span className="badge">{role || "sem papel"}</span>
            <Button variant="secondary" onClick={handleLogout}>
              Sair
            </Button>
          </>
        ) : (
          <>
            <Link to="/login" className="site-header__link">
              Entrar
            </Link>
            <Link to="/cadastro" className="site-header__link">
              Criar conta
            </Link>
          </>
        )}
      </nav>
    </header>
  );
}
