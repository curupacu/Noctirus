import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../components/Button/Button";
import { ChoiceCard } from "../../components/ChoiceCard/ChoiceCard";
import { Loading } from "../../components/Loading/Loading";
import { api } from "../../lib/api";
import { AREAS } from "../../lib/areas";
import { useTitulo } from "../../lib/useTitulo";
import "../auth/entrada.css";
import "./TriagemPage.css";

// Frases da tela de espera enquanto o resultado é montado — trocam sozinhas pra pessoa ver
// que algo está acontecendo (o servidor pode levar alguns segundos se estava dormindo).
const FRASES_ANALISE = [
  "Organizando o que você contou...",
  "Procurando advogados que atendem esse assunto...",
  "Separando os mais próximos de você...",
];

function SetaVoltar() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M19 12H5M11 18l-6-6 6-6" />
    </svg>
  );
}

function TelaAnalisando() {
  const [indice, setIndice] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setIndice((i) => Math.min(i + 1, FRASES_ANALISE.length - 1)), 1600);
    return () => clearInterval(timer);
  }, []);
  return (
    <div className="triagem-analisando" role="status" aria-live="polite">
      <div className="triagem-analisando__cartao">
        <Loading />
        <h2>Montando seu resultado</h2>
        <p>{FRASES_ANALISE[indice]}</p>
      </div>
    </div>
  );
}

// Triagem curta (redesenho de 13/10/2026, depois de um teste com uma pessoa de fora do time
// que achou as perguntas repetitivas). Quatro telas: o que aconteceu → quando → a área que a
// IA identificou (o cliente pode trocar) → os assuntos em chips, já marcados pela IA, mais um
// detalhe opcional. Etapa 1 = POST /triagem/area (RF006, já sugere as especialidades);
// etapa 2 = POST /triagem/classificar com o que o cliente confirmou (RF007).
export function TriagemPage() {
  useTitulo("Nova triagem");
  const navigate = useNavigate();
  const [perguntas, setPerguntas] = useState(null);
  const [passo, setPasso] = useState(0);
  const [etapa1, setEtapa1] = useState({});
  const [detalhes, setDetalhes] = useState("");
  const [classificacao, setClassificacao] = useState(null); // resposta da etapa 1
  const [area, setArea] = useState(null);
  const [assuntos, setAssuntos] = useState([]);
  const [identificando, setIdentificando] = useState(false);
  const [analisando, setAnalisando] = useState(false);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    api.get("/triagem/perguntas").then(setPerguntas).catch((err) => setErro(err.message));
  }, []);

  if (!perguntas && !erro) return <Loading>Carregando...</Loading>;
  if (!perguntas) return <p role="alert">{erro}</p>;

  const telas = [...perguntas.etapa1.map((p) => ({ tipo: "pergunta", p })), { tipo: "area" }, { tipo: "assuntos" }];
  const tela = telas[passo];
  const ultima = passo === telas.length - 1;
  const catalogo = area ? perguntas.categorias[area] || [] : [];
  const sugeridas = classificacao && area === classificacao.area ? classificacao.categorias : [];

  const valor = tela.tipo === "pergunta" ? etapa1[tela.p.id] || "" : "";
  const falta = tela.tipo === "pergunta" ? Math.max(0, tela.p.minimo - valor.trim().length) : 0;
  const podeSeguir =
    tela.tipo === "pergunta" ? falta === 0 : tela.tipo === "area" ? Boolean(area) : assuntos.length > 0;

  function irPara(novo) {
    setErro(null);
    setPasso(novo);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function identificarArea() {
    setIdentificando(true);
    setErro(null);
    try {
      const resultado = await api.post("/triagem/area", { etapa1 });
      setClassificacao(resultado);
      // Só muda a área/assuntos se ainda não tinha escolha (voltar e avançar não apaga nada).
      if (!area) {
        const nova = resultado.area === "indefinido" ? null : resultado.area;
        setArea(nova);
        setAssuntos(nova ? resultado.categorias : []);
      }
      irPara(passo + 1);
    } catch (err) {
      setErro(err.message || "Não foi possível continuar agora. Tente de novo.");
    } finally {
      setIdentificando(false);
    }
  }

  async function enviar() {
    setErro(null);
    setAnalisando(true);
    // Os sugeridos pela IA vão primeiro (o primeiro vira a especialidade principal).
    const ordenados = [...sugeridas.filter((c) => assuntos.includes(c)), ...assuntos.filter((c) => !sugeridas.includes(c))];
    try {
      const resultado = await api.post("/triagem/classificar", {
        etapa1,
        area,
        categorias: ordenados,
        etapa2: detalhes.trim() ? { detalhes: detalhes.trim() } : {},
        origem: classificacao?.origem === "ia" ? "ia" : "regras",
        ...(classificacao?.justificativa ? { justificativa: classificacao.justificativa.slice(0, 600) } : {}),
      });
      navigate(`/triagem/${resultado.id}`, { state: { resultado } });
    } catch (err) {
      setErro(err.message || "Não foi possível montar o resultado agora. Tente de novo.");
      setAnalisando(false);
    }
  }

  function avancar(e) {
    e.preventDefault();
    if (!podeSeguir) return;
    if (telas[passo + 1]?.tipo === "area") identificarArea();
    else if (ultima) enviar();
    else irPara(passo + 1);
  }

  function trocarArea(nova) {
    if (nova === area) return;
    setArea(nova);
    setAssuntos(classificacao && nova === classificacao.area ? classificacao.categorias : []);
  }

  function alternarAssunto(valorAssunto) {
    setAssuntos((atual) =>
      atual.includes(valorAssunto) ? atual.filter((c) => c !== valorAssunto) : [...atual, valorAssunto],
    );
  }

  function voltar() {
    if (passo === 0) navigate(-1);
    else irPara(passo - 1);
  }

  const progresso = Math.round(((passo + 1) / telas.length) * 100);
  const ocupado = identificando || analisando;
  const areaSugerida = classificacao?.area;
  // Sugeridos primeiro na lista de chips — é o que a pessoa mais provavelmente vai querer.
  const chips = [...catalogo.filter((c) => sugeridas.includes(c.valor)), ...catalogo.filter((c) => !sugeridas.includes(c.valor))];

  return (
    <main className="triagem">
      <div className="triagem__topo">
        <button type="button" className="triagem__voltar" onClick={voltar} aria-label="Voltar" disabled={ocupado}>
          <SetaVoltar />
        </button>
        <div
          className="triagem__progresso"
          role="progressbar"
          aria-label="Progresso da triagem"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progresso}
        >
          <span style={{ width: `${progresso}%` }} />
        </div>
        <span className="triagem__contagem">
          {passo + 1}/{telas.length}
        </span>
      </div>

      <form className="triagem__passo" key={passo} onSubmit={avancar}>
        {tela.tipo === "pergunta" && (
          <>
            <span className="triagem__etiqueta">Sobre o seu caso</span>
            <label className="triagem__pergunta" htmlFor={`p-${tela.p.id}`}>
              {tela.p.pergunta}
            </label>
            {passo === 0 && (
              <p className="triagem__dica">
                Não precisa saber nada de Direito. Escreva do seu jeito, como contaria pra um amigo.
              </p>
            )}
            <textarea
              id={`p-${tela.p.id}`}
              className="input triagem__campo"
              rows={tela.p.maximo > 500 ? 7 : 2}
              placeholder={tela.p.ajuda}
              value={valor}
              maxLength={tela.p.maximo}
              onChange={(e) => setEtapa1((atual) => ({ ...atual, [tela.p.id]: e.target.value }))}
              autoFocus
            />
            <p className="triagem__contador" aria-live="polite">
              {valor.trim().length > 0 && falta > 0 ? `Escreva mais um pouco (faltam ${falta} caracteres)` : " "}
            </p>
          </>
        )}

        {tela.tipo === "area" && (
          <>
            <span className="triagem__etiqueta">Área do seu caso</span>
            <h1 className="triagem__pergunta">
              {areaSugerida && areaSugerida !== "indefinido"
                ? `Pelo que você contou, é um caso ${
                    { civel: "cível", trabalhista: "trabalhista" }[areaSugerida]
                  }.`
                : "Seu problema é mais parecido com qual destes?"}
            </h1>
            <p className="triagem__dica">
              {areaSugerida && areaSugerida !== "indefinido"
                ? "Se não fizer sentido pra você, é só escolher outra opção."
                : "Não deu pra ter certeza só com o que você contou. Escolha a que chega mais perto."}
            </p>
            <div className="choice-grid">
              {Object.entries(AREAS).map(([valorArea, { label, descricao }]) => (
                <ChoiceCard
                  key={valorArea}
                  type="radio"
                  name="area"
                  label={label}
                  description={descricao}
                  checked={area === valorArea}
                  onChange={() => trocarArea(valorArea)}
                />
              ))}
            </div>
          </>
        )}

        {tela.tipo === "assuntos" && (
          <>
            <span className="triagem__etiqueta">{AREAS[area]?.label}</span>
            <h1 className="triagem__pergunta">
              {sugeridas.length > 0 ? "Confere se é isso:" : "Qual destes assuntos é o seu caso?"}
            </h1>
            <p className="triagem__dica">
              {sugeridas.length > 0
                ? "Já marcamos o que entendemos do que você contou. Desmarque o que não for, ou marque mais."
                : "Marque um ou mais. Isso ajuda a achar quem atende exatamente o seu caso."}
            </p>
            <ul className="chips">
              {chips.map((c) => (
                <li key={c.valor}>
                  <button
                    type="button"
                    className="chip-opcao"
                    aria-pressed={assuntos.includes(c.valor)}
                    onClick={() => alternarAssunto(c.valor)}
                  >
                    {c.label}
                  </button>
                </li>
              ))}
            </ul>

            <label className="triagem__subpergunta" htmlFor="detalhes">
              {perguntas.etapa2[area]?.[0]?.pergunta || "Quer acrescentar algo?"} <span>(opcional)</span>
            </label>
            <textarea
              id="detalhes"
              className="input triagem__campo"
              rows={3}
              maxLength={1000}
              placeholder={perguntas.etapa2[area]?.[0]?.ajuda}
              value={detalhes}
              onChange={(e) => setDetalhes(e.target.value)}
            />
          </>
        )}

        {erro && (
          <p role="alert" className="triagem__erro">
            {erro}
          </p>
        )}

        <div className="triagem__acoes">
          <Button type="submit" disabled={!podeSeguir || ocupado}>
            {identificando ? "Entendendo seu caso..." : ultima ? "Ver advogados" : erro ? "Tentar de novo" : "Continuar"}
          </Button>
        </div>
      </form>

      {analisando && <TelaAnalisando />}
    </main>
  );
}
