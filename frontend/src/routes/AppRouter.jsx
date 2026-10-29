import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Routes, Route } from "react-router-dom";
import { EsqueletoPagina } from "../components/Esqueleto/Esqueleto";
import { AtualizacaoDisponivel } from "../components/AtualizacaoDisponivel/AtualizacaoDisponivel";
import { AvisoServidor } from "../components/AvisoServidor/AvisoServidor";
import { BottomNav } from "../components/BottomNav/BottomNav";
import { Header } from "../components/Header/Header";
import { RotaProtegida } from "../features/auth/RotaProtegida";
import { HomePage } from "./HomePage";

// Cada tela vira um pedaço separado, baixado só quando é aberta — antes o site inteiro
// (painel, quadro de casos, admin...) vinha junto já na Home (Lighthouse, 14/10/2026).
const AdminAdvogadosPage = lazy(() => import("../features/admin/AdminAdvogadosPage").then((m) => ({ default: m.AdminAdvogadosPage })));
const AdvogadoPublicoPage = lazy(() => import("../features/advogados/AdvogadoPublicoPage").then((m) => ({ default: m.AdvogadoPublicoPage })));
const ContatoAdvogadoPage = lazy(() => import("../features/advogados/ContatoAdvogadoPage").then((m) => ({ default: m.ContatoAdvogadoPage })));
const CadastroPage = lazy(() => import("../features/auth/CadastroPage").then((m) => ({ default: m.CadastroPage })));
const LoginPage = lazy(() => import("../features/auth/LoginPage").then((m) => ({ default: m.LoginPage })));
const RecuperarSenhaPage = lazy(() => import("../features/auth/RecuperarSenhaPage").then((m) => ({ default: m.RecuperarSenhaPage })));
const CartaoPage = lazy(() => import("../features/cartao/CartaoPage").then((m) => ({ default: m.CartaoPage })));
const ConfiguracoesPage = lazy(() => import("../features/conta/ConfiguracoesPage").then((m) => ({ default: m.ConfiguracoesPage })));
const PainelPage = lazy(() => import("../features/painel/PainelPage").then((m) => ({ default: m.PainelPage })));
const MinhasSolicitacoesPage = lazy(() => import("../features/solicitacoes/MinhasSolicitacoesPage").then((m) => ({ default: m.MinhasSolicitacoesPage })));
const QuadroCasosPage = lazy(() => import("../features/casos/QuadroCasosPage").then((m) => ({ default: m.QuadroCasosPage })));
const EditarPerfilPage = lazy(() => import("../features/perfil/EditarPerfilPage").then((m) => ({ default: m.EditarPerfilPage })));
const PerfilPage = lazy(() => import("../features/perfil/PerfilPage").then((m) => ({ default: m.PerfilPage })));
const MinhasTriagensPage = lazy(() => import("../features/triagem/MinhasTriagensPage").then((m) => ({ default: m.MinhasTriagensPage })));
const ResultadoPage = lazy(() => import("../features/triagem/ResultadoPage").then((m) => ({ default: m.ResultadoPage })));
const TriagemPage = lazy(() => import("../features/triagem/TriagemPage").then((m) => ({ default: m.TriagemPage })));
const NaoEncontradaPage = lazy(() => import("./NaoEncontradaPage").then((m) => ({ default: m.NaoEncontradaPage })));
const PrivacidadePage = lazy(() => import("./PrivacidadePage").then((m) => ({ default: m.PrivacidadePage })));
const TermosPage = lazy(() => import("./TermosPage").then((m) => ({ default: m.TermosPage })));

export function AppRouter() {
  return (
    <BrowserRouter>
      <Header />
      <Suspense fallback={<EsqueletoPagina />}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/cadastro" element={<CadastroPage />} />
        <Route path="/recuperar-senha" element={<RecuperarSenhaPage />} />
        <Route path="/privacidade" element={<PrivacidadePage />} />
        <Route path="/termos" element={<TermosPage />} />
        {/* A lista com todos os advogados saiu (25/10/2026): o cliente chega neles pela
            triagem e pelo painel. Link antigo volta para o início. */}
        <Route path="/advogados" element={<Navigate to="/" replace />} />
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
          path="/configuracoes"
          element={
            <RotaProtegida papeis={["cliente", "advogado", "admin"]}>
              <ConfiguracoesPage />
            </RotaProtegida>
          }
        />
        {/* "Meus dados" virou uma parte das Configurações (28/10/2026). */}
        <Route path="/meus-dados" element={<Navigate to="/configuracoes#dados" replace />} />
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
      </Suspense>
      <BottomNav />
      <AtualizacaoDisponivel />
      <AvisoServidor />
    </BrowserRouter>
  );
}
