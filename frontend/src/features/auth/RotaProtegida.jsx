import { Navigate, useLocation } from "react-router-dom";
import { EsqueletoPagina } from "../../components/Esqueleto/Esqueleto";
import { useAuth } from "./AuthContext";
import { rotaInicial } from "./rotaInicial";

export function RotaProtegida({ children, papeis }) {
  const { user, role, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <EsqueletoPagina />;
  }
  if (!user) {
    // Leva junto de onde veio, pro login explicar e voltar pra lá depois de entrar.
    return <Navigate to="/login" replace state={{ voltarPara: location.pathname }} />;
  }
  // Tela de outro papel (ex.: admin abrindo /triagem): manda pra tela inicial dele em vez
  // de mostrar um "sem permissão" solto no canto da página.
  // Conta Google que não terminou o cadastro (sem papel): volta pra completar.
  if (papeis && !role) {
    return <Navigate to="/cadastro" replace state={{ viaGoogle: true }} />;
  }
  if (papeis && !papeis.includes(role)) {
    return <Navigate to={rotaInicial(role)} replace />;
  }

  return children;
}
