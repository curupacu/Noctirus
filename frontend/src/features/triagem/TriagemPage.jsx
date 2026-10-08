import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../components/Button/Button";
import { ChoiceCard } from "../../components/ChoiceCard/ChoiceCard";
import { Loading } from "../../components/Loading/Loading";
import { ProgressSteps } from "../../components/ProgressSteps/ProgressSteps";
import { api } from "../../lib/api";
import { useTitulo } from "../../lib/useTitulo";

const STEPS = ["Conte o caso", "Detalhes", "Advogados"];

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

// Uma pergunta aberta (RF005): o cliente responde com as próprias palavras. O exemplo da
// pergunta aparece dentro do campo, e o contador avisa quando ainda falta texto.
function PerguntaAberta({ pergunta, valor, onChange }) {
  const tamanho = valor.trim().length;
  const falta = Math.max(0, pergunta.minimo - tamanho);
  const longa = pergunta.maximo > 500;

  return (
    <div className="input-group step-enter">
      <label className="input-label" htmlFor={`p-${pergunta.id}`}>
        {pergunta.pergunta}
      </label>
      <textarea
        id={`p-${pergunta.id}`}
        className="input"
        rows={longa ? 5 : 2}
        placeholder={pergunta.ajuda}
        value={valor}
        maxLength={pergunta.maximo}
        onChange={(e) => onChange(e.target.value)}
      />
      {tamanho > 0 && falta > 0 && (
        <p className="char-counter text-muted">Escreva mais um pouco ({falta} caracteres)</p>
      )}
    </div>
  );
}

function completas(perguntas, respostas) {
  return perguntas.every((p) => (respostas[p.id] || "").trim().length >= p.minimo);
}

// Triagem em duas etapas (RF005–RF007). Etapa 1: perguntas comuns a todo caso → o sistema
// identifica a área (POST /triagem/area). Etapa 2: perguntas da área → identifica a
// especialidade, grava a triagem e mostra os advogados (POST /triagem/classificar).
export function TriagemPage() {
  useTitulo("Nova triagem");
  const navigate = useNavigate();
  const [perguntas, setPerguntas] = useState(null);
  const [etapa, setEtapa] = useState(1);
  const [etapa1, setEtapa1] = useState({});
  const [etapa2, setEtapa2] = useState({});
  // Área sugerida pela etapa 1 ("indefinido" quando não deu pra identificar) e área que vale
  // pra etapa 2 — o cliente pode trocar se a sugestão não fizer sentido pra ele.
  const [areaSugerida, setAreaSugerida] = useState(null);
  const [area, setArea] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    api.get("/triagem/perguntas").then(setPerguntas).catch((err) => setErro(err.message));
  }, []);

  async function identificarArea(e) {
    e.preventDefault();
    setErro(null);
    setEnviando(true);
    try {
      const resultado = await api.post("/triagem/area", { etapa1 });
      setAreaSugerida(resultado.area);
      setArea(resultado.area === "indefinido" ? null : resultado.area);
      setEtapa(2);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setErro(err.message);
    } finally {
      setEnviando(false);
    }
  }

  async function enviar(e) {
    e.preventDefault();
    setErro(null);
    setEnviando(true);
    try {
      const resultado = await api.post("/triagem/classificar", {
        etapa1,
        area,
        etapa2,
      });
      navigate(`/triagem/${resultado.id}`, { state: { resultado } });
    } catch (err) {
      setErro(err.message);
      setEnviando(false);
    }
  }

  function trocarArea(nova) {
    setArea(nova);
    setEtapa2({});
  }

  if (!perguntas && !erro) return <Loading>Carregando...</Loading>;
  if (!perguntas) return <p role="alert">{erro}</p>;

  const perguntasEtapa2 = area ? perguntas.etapa2[area] : [];
  const outraArea = area === "civel" ? "trabalhista" : "civel";

  return (
    <main>
      <span className="eyebrow">
        Passo {etapa} de {STEPS.length}
      </span>
      <h1>Triagem</h1>
      <p className="text-muted">
        {etapa === 1
          ? "Conte o que está acontecendo com suas palavras. Não precisa saber nada de Direito."
          : "Agora algumas perguntas sobre o seu tipo de caso, pra achar o advogado certo."}
      </p>

      <ProgressSteps steps={STEPS} currentIndex={etapa - 1} />

      {etapa === 1 && (
        <form className="card stack" onSubmit={identificarArea}>
          {perguntas.etapa1.map((p) => (
            <PerguntaAberta
              key={p.id}
              pergunta={p}
              valor={etapa1[p.id] || ""}
              onChange={(valor) => setEtapa1((atual) => ({ ...atual, [p.id]: valor }))}
            />
          ))}

          <div className="form-cta-sticky">
            <Button type="submit" disabled={enviando || !completas(perguntas.etapa1, etapa1)}>
              {enviando ? "Entendendo seu caso..." : "Continuar"}
            </Button>
            {erro && <p role="alert">{erro}</p>}
          </div>
        </form>
      )}

      {etapa === 2 && (
        <form className="card stack" onSubmit={enviar}>
          {areaSugerida !== "indefinido" && area && (
            <div className="stack step-enter" style={{ gap: "var(--space-xs)" }}>
              <p style={{ margin: 0 }}>
                Pelo que você contou, seu caso é da área <strong>{AREAS[area].label}</strong>.
              </p>
              <p className="text-muted" style={{ margin: 0 }}>
                {area === areaSugerida ? "Não parece certo? " : "Você trocou a área sugerida. "}
                <button type="button" className="link-button" onClick={() => trocarArea(outraArea)}>
                  Mudar pra {AREAS[outraArea].label}
                </button>
              </p>
            </div>
          )}

          {areaSugerida === "indefinido" && (
            <div className="input-group step-enter">
              <label className="input-label">
                Não conseguimos identificar a área só com isso. Seu problema é mais parecido com:
              </label>
              <div className="choice-grid">
                {Object.entries(AREAS).map(([valor, { label, descricao }]) => (
                  <ChoiceCard
                    key={valor}
                    type="radio"
                    name="area"
                    label={label}
                    description={descricao}
                    checked={area === valor}
                    onChange={() => trocarArea(valor)}
                  />
                ))}
              </div>
            </div>
          )}

          {perguntasEtapa2.map((p) => (
            <PerguntaAberta
              key={`${area}-${p.id}`}
              pergunta={p}
              valor={etapa2[p.id] || ""}
              onChange={(valor) => setEtapa2((atual) => ({ ...atual, [p.id]: valor }))}
            />
          ))}

          <div className="form-cta-sticky">
            <Button type="submit" disabled={enviando || !area || !completas(perguntasEtapa2, etapa2)}>
              {enviando ? "Procurando advogados..." : "Ver advogados"}
            </Button>
            <Button type="button" variant="secondary" disabled={enviando} onClick={() => setEtapa(1)}>
              Voltar
            </Button>
            {erro && <p role="alert">{erro}</p>}
          </div>
        </form>
      )}
    </main>
  );
}
