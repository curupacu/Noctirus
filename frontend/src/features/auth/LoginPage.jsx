import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../../components/Button/Button";
import { Input } from "../../components/Input/Input";
import { useAuth } from "./AuthContext";
import { rotaInicial } from "./rotaInicial";

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState(null);
  const [enviando, setEnviando] = useState(false);

  async function handleSubmit(e) {
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

  return (
    <main>
      <h1>Entrar</h1>

      <form className="card stack" onSubmit={handleSubmit}>
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

      <p>
        Não tem conta? <Link to="/cadastro">Criar conta</Link>
      </p>
    </main>
  );
}
