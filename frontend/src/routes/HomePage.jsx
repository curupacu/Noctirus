import { Link } from "react-router-dom";
import { Button } from "../components/Button/Button";

export function HomePage() {
  return (
    <main className="splash">
      <div>
        <p className="splash__eyebrow">Nocturis</p>
        <h1 className="splash__headline">Encontre o advogado certo pro seu caso.</h1>
        <p className="splash__subtitle">
          Descreva sua situação com suas palavras — a gente indica a área certa e advogados
          compatíveis, cível ou trabalhista.
        </p>
      </div>

      <div className="splash__actions">
        <Link to="/cadastro">
          <Button>Criar conta</Button>
        </Link>
        <Link to="/login">
          <Button variant="light">Entrar</Button>
        </Link>
      </div>

      <Link to="/advogados" className="splash__secondary">
        Ver advogados sem criar conta
      </Link>
    </main>
  );
}
