import { useState } from "react";
import { Link } from "react-router-dom";
import { LinhasFundo } from "../../components/LinhasFundo/LinhasFundo";
import { Logo } from "../../components/Logo/Logo";
import "./entrada.css";

function SetaVoltar() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M19 12H5M11 18l-6-6 6-6" />
    </svg>
  );
}

// Moldura das telas de entrada (login, cadastro, recuperar senha). `voltar` pode ser um
// caminho (vira link) ou uma função (vira botão — usado entre as etapas do cadastro);
// `progresso` (0 a 1) mostra a barra do topo do cadastro.
export function EntradaLayout({ voltar = "/", rotuloVoltar = "Voltar", progresso = null, children }) {
  return (
    <main className="entrada">
      <aside className="entrada__painel" aria-hidden="true">
        <LinhasFundo />
        <Logo className="entrada__painel-logo" />
        <div>
          <p className="entrada__painel-frase">Encontre o advogado certo pro seu caso.</p>
          <span className="entrada__painel-risco" />
          <p className="entrada__painel-texto">
            Conte o que aconteceu com suas palavras. A gente identifica se o caso é cível ou
            trabalhista e mostra quem atende esse assunto perto de você.
          </p>
        </div>
        <span className="entrada__painel-rodape">A Nocturis não presta serviços jurídicos.</span>
      </aside>

      <div className="entrada__coluna">
        <div className="entrada__topo">
          {typeof voltar === "function" ? (
            <button type="button" className="entrada__voltar" onClick={voltar} aria-label={rotuloVoltar}>
              <SetaVoltar />
            </button>
          ) : (
            <Link to={voltar} className="entrada__voltar" aria-label={rotuloVoltar}>
              <SetaVoltar />
            </Link>
          )}
          {progresso !== null && (
            <div
              className="entrada__progresso"
              role="progressbar"
              aria-label="Progresso do cadastro"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(progresso * 100)}
            >
              <span style={{ width: `${Math.round(progresso * 100)}%` }} />
            </div>
          )}
        </div>
        {children}
      </div>
    </main>
  );
}

export function LogoEntrada() {
  return <Logo className="entrada__logo" />;
}

function Olho({ aberto }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
      {!aberto && <path d="M4 4l16 16" />}
    </svg>
  );
}

// Senha com o olho de mostrar/esconder (como na referência).
export function CampoSenha({ label, id, ...props }) {
  const [visivel, setVisivel] = useState(false);
  return (
    <div className="input-group campo-senha">
      <label className="input-label" htmlFor={id}>
        {label}
      </label>
      <input id={id} className="input" type={visivel ? "text" : "password"} {...props} />
      <button
        type="button"
        className="campo-senha__olho"
        onClick={() => setVisivel((v) => !v)}
        aria-label={visivel ? "Esconder senha" : "Mostrar senha"}
        aria-pressed={visivel}
      >
        <Olho aberto={visivel} />
      </button>
    </div>
  );
}
