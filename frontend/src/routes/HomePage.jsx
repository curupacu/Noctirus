import { Link } from "react-router-dom";
import { Button } from "../components/Button/Button";
import { Logo } from "../components/Logo/Logo";
import { OwlMark } from "../components/OwlMark/OwlMark";
import { useTitulo } from "../lib/useTitulo";

export function HomePage() {
  useTitulo();

  return (
    <main className="splash">
      <OwlMark className="splash__owl-mark" />
      <div className="step-enter">
        <Logo className="splash__logo" />
        <h1 className="splash__headline">
          Encontre o advogado <em className="accent">certo</em> pro seu caso.
        </h1>
        <p className="splash__subtitle">
          Descreva sua situação com suas palavras — a gente indica a área certa e advogados
          compatíveis, cível ou trabalhista.
        </p>
      </div>

      <div className="splash__actions step-enter" style={{ animationDelay: "120ms" }}>
        <Link to="/cadastro">
          <Button>Criar conta</Button>
        </Link>
        <Link to="/login">
          <Button variant="light">
            Entrar <span className="button__arrow" aria-hidden="true">→</span>
          </Button>
        </Link>
      </div>

      <Link
        to="/advogados"
        className="splash__secondary step-enter"
        style={{ animationDelay: "200ms" }}
      >
        Ver advogados sem criar conta
      </Link>
    </main>
  );
}
