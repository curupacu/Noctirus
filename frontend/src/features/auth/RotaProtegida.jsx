import { Navigate } from "react-router-dom";
import { Loading } from "../../components/Loading/Loading";
import { useAuth } from "./AuthContext";
import { rotaInicial } from "./rotaInicial";

export function RotaProtegida({ children, papeis }) {
  const { user, role, loading } = useAuth();

  if (loading) {
    return <Loading>Carregando...</Loading>;
  }
  if (!user) {
    return <Navigate to="/login" replace />;
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
