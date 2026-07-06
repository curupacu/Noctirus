import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

export function RotaProtegida({ children, papeis }) {
  const { user, role, loading } = useAuth();

  if (loading) {
    return <p>Carregando...</p>;
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (papeis && !papeis.includes(role)) {
    return <p>Você não tem permissão para acessar esta página.</p>;
  }

  return children;
}
