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
  if (papeis && !papeis.includes(role)) {
    return <Navigate to={rotaInicial(role)} replace />;
  }

  return children;
}
