import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BotaoGoogle } from "../../components/BotaoGoogle/BotaoGoogle";
import { Button } from "../../components/Button/Button";
import { Input } from "../../components/Input/Input";
import { useTitulo } from "../../lib/useTitulo";
import { useAuth } from "./AuthContext";
import { CampoSenha, EntradaLayout, LogoEntrada } from "./EntradaLayout";
import { rotaInicial } from "./rotaInicial";

export function LoginPage() {
  useTitulo("Entrar");
  const { login, loginComGoogle } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState(null);
  const [enviando, setEnviando] = useState(false);

  async function entrar(e) {
    e.preventDefault();
    setErro(null);
    setEnviando(true);
    try {
      const roleLogado = await login(email, senha);
      navigate(rotaInicial(roleLogado));
    } catch {
      setErro("E-mail ou senha inválidos");
    } finally {
      setEnviando(false);
    }
  }

  // Conta Google sem role (primeira vez por aqui) — manda completar o cadastro em vez de
  // travar num erro; o Firebase já criou a conta sozinho, não tem "não encontrado" com
  // provider federado. viaGoogle no state evita pedir pra logar de novo lá na CadastroPage.
  async function entrarComGoogle() {
    setErro(null);
    setEnviando(true);
    try {
      const { role: roleLogado } = await loginComGoogle();
      if (roleLogado) {
        navigate(rotaInicial(roleLogado));
      } else {
        navigate("/cadastro", { state: { viaGoogle: true } });
      }
    } catch {
      setErro("Não foi possível entrar com o Google");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <EntradaLayout voltar="/" rotuloVoltar="Voltar para o início">
      <LogoEntrada />
      <h1 className="entrada__titulo">Que bom te ver de novo</h1>
      <p className="entrada__sub">Entre pra acompanhar sua triagem e seus pedidos de contato.</p>

      <BotaoGoogle onClick={entrarComGoogle} disabled={enviando}>
        Continuar com Google
      </BotaoGoogle>

      <p className="entrada__ou">ou entre com e-mail</p>

      <form className="entrada__form" onSubmit={entrar}>
        <Input
          label="E-mail"
          id="email"
          type="email"
          autoComplete="email"
          placeholder="seu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <CampoSenha
          label="Senha"
          id="senha"
          autoComplete="current-password"
          placeholder="Sua senha"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          required
        />
        <Link to="/recuperar-senha" state={{ email }} className="entrada__esqueci">
          Esqueci minha senha
        </Link>

        {erro && <p role="alert">{erro}</p>}

        <Button type="submit" disabled={enviando}>
          {enviando ? "Entrando..." : "Entrar"}
        </Button>
      </form>

      <p className="entrada__rodape">
        Ainda não tem conta?{" "}
        <Link to="/cadastro" className="entrada__link">
          Criar conta grátis
        </Link>
      </p>
    </EntradaLayout>
  );
}
