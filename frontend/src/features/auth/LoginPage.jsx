import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BotaoGoogle } from "../../components/BotaoGoogle/BotaoGoogle";
import { Button } from "../../components/Button/Button";
import { Input } from "../../components/Input/Input";
import { Logo } from "../../components/Logo/Logo";
import { useTitulo } from "../../lib/useTitulo";
import { useAuth } from "./AuthContext";
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
    <main className="auth-screen">
      <Link to="/" className="auth-screen__close" aria-label="Voltar para o início">
        ×
      </Link>

      <div className="auth-screen__inner">
        <Logo className="auth-screen__logo step-enter" />
        <div className="auth-screen__header step-enter" style={{ animationDelay: "80ms" }}>
          <h1>Entrar</h1>
          <p>Bem-vindo(a) de volta.</p>
        </div>

        <div className="auth-screen__form step-enter" style={{ animationDelay: "120ms" }}>
          <BotaoGoogle onClick={entrarComGoogle} disabled={enviando} style={{ width: "100%" }}>
            Entrar com Google
          </BotaoGoogle>
        </div>

        <p
          className="text-muted step-enter"
          style={{ animationDelay: "140ms", textAlign: "center", margin: "16px 0" }}
        >
          ou
        </p>

        <form
          className="auth-screen__form step-enter"
          style={{ animationDelay: "160ms" }}
          onSubmit={entrar}
        >
          <Input
            label="E-mail"
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            label="Senha"
            id="senha"
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            required
          />

          {erro && <p role="alert">{erro}</p>}

          <Button type="submit" disabled={enviando}>
            {enviando ? "Entrando..." : "Entrar"}
          </Button>
        </form>

        <p className="auth-screen__footer step-enter" style={{ animationDelay: "220ms" }}>
          Não tem conta? <Link to="/cadastro">Criar conta</Link>
        </p>
      </div>
    </main>
  );
}
