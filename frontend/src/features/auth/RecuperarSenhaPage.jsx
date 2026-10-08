import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "../../components/Button/Button";
import { Input } from "../../components/Input/Input";
import { useTitulo } from "../../lib/useTitulo";
import { useAuth } from "./AuthContext";
import { EntradaLayout, LogoEntrada } from "./EntradaLayout";

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
    <EntradaLayout voltar="/login" rotuloVoltar="Voltar para o login">
      <LogoEntrada />
      <h1 className="entrada__titulo">{enviado ? "Confira seu e-mail" : "Esqueceu a senha?"}</h1>

      {enviado ? (
        <div className="entrada__form entrada__passo" role="status">
          <p className="entrada__sub" style={{ margin: 0 }}>
            Se existir uma conta com <strong>{email.trim()}</strong>, você vai receber em alguns minutos
            um link pra criar uma senha nova. Olhe também a caixa de spam.
          </p>
          <Link to="/login" className="button button--primary">
            Voltar pro login
          </Link>
          <Button variant="secondary" onClick={() => setEnviado(false)}>
            Não chegou? Enviar de novo
          </Button>
        </div>
      ) : (
        <>
          <p className="entrada__sub">
            Sem problema. Informe o e-mail da sua conta e enviamos um link pra você criar uma senha
            nova.
          </p>
          <form className="entrada__form" onSubmit={enviar}>
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
            {erro && <p role="alert">{erro}</p>}
            <Button type="submit" disabled={enviando}>
              {enviando ? "Enviando..." : "Enviar link"}
            </Button>
          </form>
        </>
      )}

      <p className="entrada__rodape">
        Lembrou a senha?{" "}
        <Link to="/login" className="entrada__link">
          Entrar
        </Link>
      </p>
    </EntradaLayout>
  );
}
