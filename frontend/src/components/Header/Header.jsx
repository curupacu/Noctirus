import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../features/auth/AuthContext";
import { rotaInicial } from "../../features/auth/rotaInicial";

export function Header() {
  const { user, role, loading, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate("/");
  }

  return (
    <header
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "0.5rem",
        padding: "1rem",
        borderBottom: "2px solid #333",
        marginBottom: "1.5rem",
      }}
    >
      <Link to="/">Nocturis</Link>

      <Link to="/advogados">Advogados</Link>

      {loading ? null : user ? (
        <nav style={{ display: "flex", gap: "1rem", alignItems: "center", flexWrap: "wrap" }}>
          <span>
            Logado como <strong>{user.email}</strong> ({role || "sem papel definido"})
          </span>
          <Link to={rotaInicial(role)}>Início</Link>
          <Link to="/perfil">Meu perfil</Link>
          <button type="button" onClick={handleLogout}>
            Sair
          </button>
        </nav>
      ) : (
        <nav style={{ display: "flex", gap: "1rem" }}>
          <Link to="/login">Entrar</Link>
          <Link to="/cadastro">Criar conta</Link>
        </nav>
      )}
    </header>
  );
}
