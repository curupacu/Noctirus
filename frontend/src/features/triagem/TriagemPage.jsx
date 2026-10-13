import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../components/Button/Button";
import { ChoiceCard } from "../../components/ChoiceCard/ChoiceCard";
import { Loading } from "../../components/Loading/Loading";
import { api } from "../../lib/api";
import { useTitulo } from "../../lib/useTitulo";
import "./TriagemPage.css";

const AREAS = {
  trabalhista: {
    label: "Trabalhista",
    descricao: "Emprego, demissão, salário, direitos de quem trabalha ou contrata",
  },
  civel: {
    label: "Cível",
    descricao: "Compras, contratos, dívidas, aluguel, família, herança, acidentes",
  },
};

// Frases da tela de espera enquanto a IA classifica — trocam sozinhas pra pessoa ver que
// algo está acontecendo (o servidor pode levar alguns segundos, mais ainda se estava dormindo).
const FRASES_ANALISE = [
  "Lendo suas respostas...",
  "Identificando o assunto do seu caso...",
  "Procurando advogados que atendem isso perto de você...",
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
    const timer = setInterval(() => setIndice((i) => Math.min(i + 1, FRASES_ANALISE.length - 1)), 1800);
    return () => clearInterval(timer);
  }, []);
  return (
    <div className="triagem-analisando" role="status" aria-live="polite">
      <div className="triagem-analisando__cartao">
        <Loading />
        <h2>Analisando seu caso</h2>
        <p>{FRASES_ANALISE[indice]}</p>
      </div>
    </div>
  );
}

// Triagem em duas etapas (RF005–RF007), uma pergunta por tela (redesign de outubro/2026,
// mesmo padrão do cadastro). Etapa 1: perguntas comuns → POST /triagem/area identifica a
// área. Tela de confirmação da área (o cliente pode trocar). Etapa 2: perguntas da área →
// POST /triagem/classificar identifica a especialidade, grava e mostra os advogados.
export function TriagemPage() {
  useTitulo("Nova triagem");
  const navigate = useNavigate();
  const [perguntas, setPerguntas] = useState(null);
  const [passo, setPasso] = useState(0);
  const [etapa1, setEtapa1] = useState({});
  const [etapa2, setEtapa2] = useState({});
  // Área sugerida pela etapa 1 ("indefinido" quando não deu pra identificar) e a área que
  // vale pra etapa 2 — o cliente pode trocar se a sugestão não fizer sentido pra ele.
  const [areaSugerida, setAreaSugerida] = useState(null);
  const [area, setArea] = useState(null);
  const [identificando, setIdentificando] = useState(false);
  const [analisando, setAnalisando] = useState(false);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    api.get("/triagem/perguntas").then(setPerguntas).catch((err) => setErro(err.message));
  }, []);

  if (!perguntas && !erro) return <Loading>Carregando...</Loading>;
  if (!perguntas) return <p role="alert">{erro}</p>;

  // Lista de telas: perguntas da etapa 1, confirmação da área, perguntas da etapa 2. Antes
  // de saber a área, conta 3 perguntas de etapa 2 pra barra de progresso não "pular".
  const perguntasEtapa2 = area ? perguntas.etapa2[area] : [];
  const telas = [
    ...perguntas.etapa1.map((p) => ({ tipo: "pergunta", etapa: 1, p })),
    { tipo: "area" },
    ...perguntasEtapa2.map((p) => ({ tipo: "pergunta", etapa: 2, p })),
  ];
  const totalTelas = perguntas.etapa1.length + 1 + (perguntasEtapa2.length || 3);
  const tela = telas[passo];
  const ultima = passo === telas.length - 1 && tela.tipo === "pergunta" && tela.etapa === 2;

  const respostas = tela.tipo === "pergunta" ? (tela.etapa === 1 ? etapa1 : etapa2) : null;
  const valor = tela.tipo === "pergunta" ? respostas[tela.p.id] || "" : "";
  const tamanho = valor.trim().length;
  const falta = tela.tipo === "pergunta" ? Math.max(0, tela.p.minimo - tamanho) : 0;
  const podeSeguir = tela.tipo === "area" ? Boolean(area) : falta === 0;

  function responder(texto) {
    const setar = tela.etapa === 1 ? setEtapa1 : setEtapa2;
    setar((atual) => ({ ...atual, [tela.p.id]: texto }));
  }

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
      setAreaSugerida(resultado.area);
      // Só troca a área se ainda não tinha uma (voltar e avançar não apaga a escolha).
      if (!area) setArea(resultado.area === "indefinido" ? null : resultado.area);
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
    try {
      const resultado = await api.post("/triagem/classificar", { etapa1, area, etapa2 });
      navigate(`/triagem/${resultado.id}`, { state: { resultado } });
    } catch (err) {
      setErro(err.message || "Não foi possível analisar agora. Tente de novo.");
      setAnalisando(false);
    }
  }

  function avancar(e) {
    e.preventDefault();
    if (!podeSeguir) return;
    const proxima = telas[passo + 1];
    if (proxima?.tipo === "area") identificarArea();
    else if (ultima) enviar();
    else irPara(passo + 1);
  }

  function trocarArea(nova) {
    if (nova === area) return;
    setArea(nova);
    setEtapa2({});
  }

  function voltar() {
    if (passo === 0) navigate(-1);
    else irPara(passo - 1);
  }

  const progresso = Math.round(((passo + 1) / totalTelas) * 100);
  const ocupado = identificando || analisando;

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
          {passo + 1}/{totalTelas}
        </span>
      </div>

      <form className="triagem__passo" key={passo} onSubmit={avancar}>
        {tela.tipo === "pergunta" && (
          <>
            <span className="triagem__etiqueta">
              {tela.etapa === 1 ? "Sobre o que aconteceu" : `Detalhes · ${AREAS[area].label}`}
            </span>
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
              rows={tela.p.maximo > 500 ? 7 : 3}
              placeholder={tela.p.ajuda}
              value={valor}
              maxLength={tela.p.maximo}
              onChange={(e) => responder(e.target.value)}
              autoFocus
            />
            <p className="triagem__contador" aria-live="polite">
              {tamanho > 0 && falta > 0 ? `Escreva mais um pouco (faltam ${falta} caracteres)` : " "}
            </p>
          </>
        )}

        {tela.tipo === "area" && (
          <>
            <span className="triagem__etiqueta">Área do seu caso</span>
            <h1 className="triagem__pergunta">
              {areaSugerida && areaSugerida !== "indefinido"
                ? `Pelo que você contou, seu caso parece ${AREAS[areaSugerida].label.toLowerCase()}.`
                : "Seu problema é mais parecido com qual destes?"}
            </h1>
            <p className="triagem__dica">
              {areaSugerida && areaSugerida !== "indefinido"
                ? "Se não fizer sentido pra você, é só escolher a outra opção."
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

        {erro && (
          <p role="alert" className="triagem__erro">
            {erro}
          </p>
        )}

        <div className="triagem__acoes">
          <Button type="submit" disabled={!podeSeguir || ocupado}>
            {identificando
              ? "Entendendo seu caso..."
              : ultima
                ? "Ver advogados"
                : erro
                  ? "Tentar de novo"
                  : "Continuar"}
          </Button>
        </div>
      </form>

      {analisando && <TelaAnalisando />}
    </main>
  );
}
