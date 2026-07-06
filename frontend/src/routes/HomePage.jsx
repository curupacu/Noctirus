import { Link } from "react-router-dom";
import { Button } from "../components/Button/Button";
import { Input } from "../components/Input/Input";

export function HomePage() {
  return (
    <main className="showcase">
      <h1>Nocturis</h1>
      <p>Design system inicial — tokens, botão e input.</p>

      <nav>
        <Link to="/login">Entrar</Link> · <Link to="/cadastro">Criar conta</Link>
      </nav>

      <section className="showcase-group">
        <Button variant="primary">Falar com advogado</Button>
        <Button variant="secondary">Ver mais</Button>
      </section>

      <section className="showcase-group">
        <Input label="Nome" id="nome" placeholder="Seu nome" />
        <Input label="E-mail" id="email" type="email" placeholder="voce@exemplo.com" />
      </section>
    </main>
  );
}
