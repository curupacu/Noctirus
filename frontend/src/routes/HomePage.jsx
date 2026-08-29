import { Link } from "react-router-dom";
import { Button } from "../components/Button/Button";
import { Logo } from "../components/Logo/Logo";
import { OwlMark } from "../components/OwlMark/OwlMark";
import { useTitulo } from "../lib/useTitulo";

const FAQ = [
  {
    pergunta: "A Nocturis é gratuita?",
    resposta:
      "Sim, pra quem busca um advogado. Você descreve seu caso, faz a triagem e vê advogados compatíveis sem pagar nada e sem precisar criar conta.",
  },
  {
    pergunta: "Como funciona a triagem por IA?",
    resposta:
      "Você descreve seu problema com suas próprias palavras. A IA identifica se é uma questão cível ou trabalhista e sugere advogados com a especialidade certa na sua região.",
  },
  {
    pergunta: "Meus dados estão seguros?",
    resposta:
      "Sim. Só guardamos o que é necessário pra te atender e nunca vendemos seus dados a ninguém. Você pode baixar ou apagar tudo quando quiser, direto no seu perfil.",
  },
  {
    pergunta: "Como eu falo com o advogado?",
    resposta:
      "Direto: a Nocturis te dá o WhatsApp ou e-mail do advogado e vocês combinam por lá, sem intermediário nem taxa por contato.",
  },
  {
    pergunta: "Preciso criar conta pra ver os advogados?",
    resposta:
      "Não. Dá pra ver a lista de advogados sem cadastro — só crie conta se quiser fazer a triagem guiada ou salvar seus contatos.",
  },
];

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

      <section className="faq" aria-labelledby="faq-heading">
        <h2 id="faq-heading" className="faq__heading">
          Perguntas frequentes
        </h2>
        {FAQ.map(({ pergunta, resposta }) => (
          <details key={pergunta} className="faq__item">
            <summary>{pergunta}</summary>
            <p>{resposta}</p>
          </details>
        ))}
      </section>
    </main>
  );
}
