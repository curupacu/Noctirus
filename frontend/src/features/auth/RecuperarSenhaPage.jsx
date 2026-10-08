import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "../../components/Button/Button";
import { Input } from "../../components/Input/Input";
import { Logo } from "../../components/Logo/Logo";
import { useTitulo } from "../../lib/useTitulo";
import { useAuth } from "./AuthContext";

// "Esqueci minha senha": manda o link de redefinição por e-mail (Firebase Auth). A mensagem
// de sucesso é sempre a mesma, exista ou não conta com aquele e-mail — dizer "esse e-mail
// não está cadastrado" deixaria qualquer um descobrir quem usa a Nocturis.
export function RecuperarSenhaPage() {
  useTitulo("Recuperar senha");
  const { recuperarSenha } = useAuth();
  const location = useLocation();
  const [email, setEmail] = useState(location.state?.email || "");
  const [enviado, setEnviado] = useState(false);
  const [erro, setErro] = useState(null);
  const [enviando, setEnviando] = useState(false);

  async function enviar(e) {
    e.preventDefault();
    setErro(null);
    setEnviando(true);
    try {
      await recuperarSenha(email.trim());
      setEnviado(true);
    } catch (err) {
      if (err.code === "auth/invalid-email") setErro("Esse e-mail não parece válido.");
      else if (err.code === "auth/too-many-requests") setErro("Muitas tentativas. Espere alguns minutos e tente de novo.");
      // Conta inexistente cai aqui em projetos sem a proteção contra enumeração de e-mail —
      // responde igual ao sucesso, pelo mesmo motivo do comentário lá em cima.
      else if (err.code === "auth/user-not-found") setEnviado(true);
      else setErro("Não foi possível enviar agora. Tente de novo em instantes.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <main className="auth-screen">
      <Link to="/login" className="auth-screen__close" aria-label="Voltar para o login">
        ×
      </Link>

      <div className="auth-screen__inner">
        <Logo className="auth-screen__logo step-enter" />
        <div className="auth-screen__header step-enter" style={{ animationDelay: "80ms" }}>
          <h1>Recuperar senha</h1>
          <p>
            {enviado
              ? "Pronto! Confira seu e-mail."
              : "Informe o e-mail da sua conta e enviamos um link pra você criar uma senha nova."}
          </p>
        </div>

        {enviado ? (
          <div className="auth-screen__form step-enter" role="status">
            <p>
              Se existir uma conta com <strong>{email.trim()}</strong>, você vai receber em alguns minutos um
              e-mail com o link pra criar uma senha nova. Olhe também a caixa de spam.
            </p>
            <Link to="/login" className="button button--primary">
              Voltar pro login
            </Link>
            <button type="button" className="link-button" onClick={() => setEnviado(false)}>
              Não chegou? Enviar de novo
            </button>
          </div>
        ) : (
          <form className="auth-screen__form step-enter" style={{ animationDelay: "160ms" }} onSubmit={enviar}>
            <Input
              label="E-mail"
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            {erro && <p role="alert">{erro}</p>}
            <Button type="submit" disabled={enviando}>
              {enviando ? "Enviando..." : "Enviar link"}
            </Button>
          </form>
        )}

        <p className="auth-screen__footer step-enter" style={{ animationDelay: "220ms" }}>
          Lembrou? <Link to="/login">Entrar</Link>
        </p>
      </div>
    </main>
  );
}
