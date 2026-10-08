import { BrowserRouter, Navigate, Routes, Route } from "react-router-dom";
import { AtualizacaoDisponivel } from "../components/AtualizacaoDisponivel/AtualizacaoDisponivel";
import { BottomNav } from "../components/BottomNav/BottomNav";
import { Header } from "../components/Header/Header";
import { AdminAdvogadosPage } from "../features/admin/AdminAdvogadosPage";
import { AdvogadoPublicoPage } from "../features/advogados/AdvogadoPublicoPage";
import { AdvogadosListPage } from "../features/advogados/AdvogadosListPage";
import { ContatoAdvogadoPage } from "../features/advogados/ContatoAdvogadoPage";
import { CadastroPage } from "../features/auth/CadastroPage";
import { LoginPage } from "../features/auth/LoginPage";
import { RecuperarSenhaPage } from "../features/auth/RecuperarSenhaPage";
import { RotaProtegida } from "../features/auth/RotaProtegida";
import { CartaoPage } from "../features/cartao/CartaoPage";
import { MeusDadosPage } from "../features/conta/MeusDadosPage";
import { PainelPage } from "../features/painel/PainelPage";
import { MinhasSolicitacoesPage } from "../features/solicitacoes/MinhasSolicitacoesPage";
import { QuadroCasosPage } from "../features/casos/QuadroCasosPage";
import { EditarPerfilPage } from "../features/perfil/EditarPerfilPage";
import { PerfilPage } from "../features/perfil/PerfilPage";
import { MinhasTriagensPage } from "../features/triagem/MinhasTriagensPage";
import { ResultadoPage } from "../features/triagem/ResultadoPage";
import { TriagemPage } from "../features/triagem/TriagemPage";
import { HomePage } from "./HomePage";
import { NaoEncontradaPage } from "./NaoEncontradaPage";
import { PrivacidadePage } from "./PrivacidadePage";

export function AppRouter() {
  return (
    <BrowserRouter>
      <Header />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/cadastro" element={<CadastroPage />} />
        <Route path="/recuperar-senha" element={<RecuperarSenhaPage />} />
        <Route path="/privacidade" element={<PrivacidadePage />} />
        <Route path="/advogados" element={<AdvogadosListPage />} />
        <Route path="/advogados/:uid" element={<AdvogadoPublicoPage />} />
        <Route
          path="/advogados/:uid/contato"
          element={
            <RotaProtegida papeis={["cliente"]}>
              <ContatoAdvogadoPage />
            </RotaProtegida>
          }
        />
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
          path="/perfil/editar"
          element={
            <RotaProtegida papeis={["advogado"]}>
              <EditarPerfilPage />
            </RotaProtegida>
          }
        />
        <Route
          path="/cartao"
          element={
            <RotaProtegida papeis={["advogado"]}>
              <CartaoPage />
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
          path="/minhas-solicitacoes"
          element={
            <RotaProtegida papeis={["cliente"]}>
              <MinhasSolicitacoesPage />
            </RotaProtegida>
          }
        />
        <Route
          path="/casos"
          element={
            <RotaProtegida papeis={["advogado"]}>
              <QuadroCasosPage />
            </RotaProtegida>
          }
        />
        {/* Notificações antigas apontam pra /solicitacoes (antes do quadro de casos). */}
        <Route path="/solicitacoes" element={<Navigate to="/casos" replace />}
        />
        <Route
          path="/meus-dados"
          element={
            <RotaProtegida papeis={["cliente", "advogado"]}>
              <MeusDadosPage />
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
        <Route path="*" element={<NaoEncontradaPage />} />
      </Routes>
      <BottomNav />
      <AtualizacaoDisponivel />
    </BrowserRouter>
  );
}
