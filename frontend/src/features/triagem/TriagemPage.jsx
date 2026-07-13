import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../components/Button/Button";
import { ChoiceCard } from "../../components/ChoiceCard/ChoiceCard";
import { ProgressSteps } from "../../components/ProgressSteps/ProgressSteps";
import { api } from "../../lib/api";

const STEPS = ["Situação", "Detalhes", "Descrição"];

export function TriagemPage() {
  const [arvore, setArvore] = useState(null);
  const [respostas, setRespostas] = useState({});
  const [descricao, setDescricao] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/triagem/perguntas").then(setArvore).catch((err) => setErro(err.message));
  }, []);

  function escolherSituacao(valor) {
    // Muda a área muda qual é a segunda pergunta — descarta a resposta anterior dela.
    setRespostas({ situacao: valor });
  }

  function responderSegundaEtapa(perguntaId, valor) {
    setRespostas((r) => ({ ...r, [perguntaId]: valor }));
  }

  async function enviar(e) {
    e.preventDefault();
    setErro(null);

    if (descricao.trim().length < 10) {
      setErro("Descreva o problema com pelo menos 10 caracteres.");
      return;
    }

    setEnviando(true);
    try {
      const resultado = await api.post("/triagem/classificar", { respostas, descricao });
      navigate(`/triagem/${resultado.id}`, { state: { resultado } });
    } catch (err) {
      setErro(err.message);
    } finally {
      setEnviando(false);
    }
  }

  if (!arvore && !erro) return <p className="loading">Carregando...</p>;

  const perguntaSegundaEtapa = arvore && arvore.segundaEtapa[respostas.situacao];

  const currentIndex = !respostas.situacao
    ? 0
    : perguntaSegundaEtapa && !respostas[perguntaSegundaEtapa.id]
      ? 1
      : 2;

  return (
    <main>
      <h1>Triagem</h1>
      <p className="text-muted">
        Responda as perguntas e descreva seu caso com suas próprias palavras. Você pode fazer
        uma nova triagem sempre que tiver outro problema.
      </p>

      <ProgressSteps steps={STEPS} currentIndex={currentIndex} />

      <form className="card stack" onSubmit={enviar}>
        {arvore && (
          <div className="input-group">
            <label className="input-label">{arvore.principal.pergunta}</label>
            <div className="choice-grid">
              {arvore.principal.opcoes.map((opcao) => (
                <ChoiceCard
                  key={opcao.valor}
                  type="radio"
                  name={arvore.principal.id}
                  label={opcao.label}
                  checked={respostas.situacao === opcao.valor}
                  onChange={() => escolherSituacao(opcao.valor)}
                />
              ))}
            </div>
          </div>
        )}

        {perguntaSegundaEtapa && (
          <div className="input-group">
            <label className="input-label">{perguntaSegundaEtapa.pergunta}</label>
            <div className="choice-grid">
              {perguntaSegundaEtapa.opcoes.map((opcao) => (
                <ChoiceCard
                  key={opcao.valor}
                  type="radio"
                  name={perguntaSegundaEtapa.id}
                  label={opcao.label}
                  checked={respostas[perguntaSegundaEtapa.id] === opcao.valor}
                  onChange={() => responderSegundaEtapa(perguntaSegundaEtapa.id, opcao.valor)}
                />
              ))}
            </div>
          </div>
        )}

        <div className="input-group">
          <label className="input-label" htmlFor="descricao">
            Descreva seu caso
          </label>
          <textarea
            id="descricao"
            className="input"
            rows={6}
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
          />
        </div>

        <div className="form-cta-sticky">
          <Button type="submit" disabled={enviando}>
            {enviando ? "Classificando..." : "Enviar"}
          </Button>
          {erro && <p role="alert">{erro}</p>}
        </div>
      </form>
    </main>
  );
}
