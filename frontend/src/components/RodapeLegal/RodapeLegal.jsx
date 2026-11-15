import { Link } from "react-router-dom";
import "./RodapeLegal.css";

// Rodapé curto das páginas públicas de texto (Termos e Privacidade): antes elas não tinham
// rodapé nem caminho entre uma e outra além do link no meio do texto.
export function RodapeLegal() {
  return (
    <footer className="rodape-legal">
      <nav aria-label="Páginas da Nocturis">
        <Link to="/">Início</Link>
        <Link to="/termos">Termos de uso</Link>
        <Link to="/privacidade">Política de privacidade</Link>
      </nav>
      <p>© 2026 Nocturis · Projeto acadêmico (TCC) desenvolvido pela Aggrem. Não presta serviços jurídicos.</p>
    </footer>
  );
}
