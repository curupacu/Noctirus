import { BrowserRouter, Routes, Route } from "react-router-dom";
import { BottomNav } from "../components/BottomNav/BottomNav";
import { Header } from "../components/Header/Header";
import { AdminAdvogadosPage } from "../features/admin/AdminAdvogadosPage";
import { AdminDenunciasPage } from "../features/admin/AdminDenunciasPage";
import { AdminUsuariosPage } from "../features/admin/AdminUsuariosPage";
import { AdvogadoPublicoPage } from "../features/advogados/AdvogadoPublicoPage";
import { AdvogadosListPage } from "../features/advogados/AdvogadosListPage";
import { CadastroPage } from "../features/auth/CadastroPage";
import { LoginPage } from "../features/auth/LoginPage";
import { RotaProtegida } from "../features/auth/RotaProtegida";
import { DenunciarPage } from "../features/denuncias/DenunciarPage";
import { MinhasDenunciasPage } from "../features/denuncias/MinhasDenunciasPage";
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
          path="/denunciar"
          element={
            <RotaProtegida papeis={["cliente", "advogado"]}>
              <DenunciarPage />
            </RotaProtegida>
          }
        />
        <Route
          path="/minhas-denuncias"
          element={
            <RotaProtegida papeis={["cliente", "advogado"]}>
              <MinhasDenunciasPage />
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
        <Route
          path="/admin/usuarios"
          element={
            <RotaProtegida papeis={["admin"]}>
              <AdminUsuariosPage />
            </RotaProtegida>
          }
        />
        <Route
          path="/admin/denuncias"
          element={
            <RotaProtegida papeis={["admin"]}>
              <AdminDenunciasPage />
            </RotaProtegida>
          }
        />
      </Routes>
      <BottomNav />
    </BrowserRouter>
  );
}
