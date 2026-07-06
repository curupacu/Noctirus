import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AdminAdvogadosPage } from "../features/admin/AdminAdvogadosPage";
import { CadastroPage } from "../features/auth/CadastroPage";
import { LoginPage } from "../features/auth/LoginPage";
import { RotaProtegida } from "../features/auth/RotaProtegida";
import { PerfilPage } from "../features/perfil/PerfilPage";
import { HomePage } from "./HomePage";

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/cadastro" element={<CadastroPage />} />
        <Route
          path="/perfil"
          element={
            <RotaProtegida>
              <PerfilPage />
            </RotaProtegida>
          }
        />
        <Route
          path="/admin/advogados"
          element={
            <RotaProtegida papeis={["admin"]}>
              <AdminAdvogadosPage />
            </RotaProtegida>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
