import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import logoIcone from "../../assets/logosvg_sócoruja.svg";
import { useAuth } from "../../features/auth/AuthContext";
import { rotaInicial } from "../../features/auth/rotaInicial";
import { api } from "../../lib/api";
import { TELAS_VITRINE } from "../../lib/telasVitrine";
import { useCarregar } from "../../lib/useCarregar";
import { useNotificacoes } from "../../lib/useNotificacoes";
import { Avatar } from "../Avatar/Avatar";
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

  // Foto e nome de verdade no canto do cabeçalho (antes era a primeira letra do e-mail, que
  // pra conta "advogado.teste@..." mostrava "A" pro Marcos). Do advogado, a foto é a do
  // perfil público. Fica na memória das telas (useCarregar), então não busca de novo a cada troca.
  const { dado: perfil } = useCarregar(
    async () => {
      if (!user) return null;
      const usuario = await api.get("/users/me");
      let foto = usuario.foto || null;
      if (role === "advogado") {
        foto = (await api.get(`/advogados/${user.uid}`).catch(() => null))?.foto || foto;
      }
      return { nome: usuario.nome, foto };
    },
    [user?.uid, role],
    { chave: `cabecalho:${user?.uid}:${role}` },
  );

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
                <Link
                  to={role === "advogado" ? "/perfil/editar" : "/perfil"}
                  className="site-header__perfil"
                  aria-label="Meu perfil"
                  title={perfil?.nome || "Meu perfil"}
                >
                  <Avatar
                    nome={perfil?.nome || user.email}
                    foto={perfil?.foto}
                    seed={user.uid}
                    className="site-header__avatar"
                  />
                </Link>
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
