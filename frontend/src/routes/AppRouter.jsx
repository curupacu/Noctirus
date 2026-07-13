import { BrowserRouter, Routes, Route } from "react-router-dom";
import { BottomNav } from "../components/BottomNav/BottomNav";
import { Header } from "../components/Header/Header";
import { AdminAdvogadosPage } from "../features/admin/AdminAdvogadosPage";
import { AdvogadoPublicoPage } from "../features/advogados/AdvogadoPublicoPage";
import { AdvogadosListPage } from "../features/advogados/AdvogadosListPage";
import { CadastroPage } from "../features/auth/CadastroPage";
import { LoginPage } from "../features/auth/LoginPage";
import { RotaProtegida } from "../features/auth/RotaProtegida";
import { PainelPage } from "../features/painel/PainelPage";
import { PerfilPage } from "../features/perfil/PerfilPage";
import { MinhasTriagensPage } from "../features/triagem/MinhasTriagensPage";
import { ResultadoPage } from "../features/triagem/ResultadoPage";
import { TriagemPage } from "../features/triagem/TriagemPage";
import { HomePage } from "./HomePage";

export function AppRouter() {
  return (
    <BrowserRouter>
      <Header />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/cadastro" element={<CadastroPage />} />
        <Route path="/advogados" element={<AdvogadosListPage />} />
        <Route path="/advogados/:uid" element={<AdvogadoPublicoPage />} />
        <Route
          path="/painel"
          element={
            <RotaProtegida>
              <PainelPage />
            </RotaProtegida>
          }
        />
        <Route
          path="/perfil"
          element={
            <RotaProtegida>
              <PerfilPage />
            </RotaProtegida>
          }
        />
        <Route
          path="/triagem"
          element={
            <RotaProtegida papeis={["cliente"]}>
              <TriagemPage />
            </RotaProtegida>
          }
        />
        <Route
          path="/triagem/:id"
          element={
            <RotaProtegida papeis={["cliente"]}>
              <ResultadoPage />
            </RotaProtegida>
          }
        />
        <Route
          path="/minhas-triagens"
          element={
            <RotaProtegida papeis={["cliente"]}>
              <MinhasTriagensPage />
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
      <BottomNav />
    </BrowserRouter>
  );
}
