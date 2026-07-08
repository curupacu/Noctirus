import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../components/Button/Button";
import { api } from "../../lib/api";

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

  if (!arvore && !erro) return <p>Carregando...</p>;

  const perguntaSegundaEtapa = arvore && arvore.segundaEtapa[respostas.situacao];

  return (
    <main>
      <h1>Triagem</h1>
      <p>
        Responda as perguntas e descreva seu caso com suas próprias palavras. Você pode fazer
        uma nova triagem sempre que tiver outro problema.
      </p>

      <form onSubmit={enviar}>
        {arvore && (
          <div>
            <label htmlFor={arvore.principal.id}>{arvore.principal.pergunta}</label>
            <br />
            <select
              id={arvore.principal.id}
              value={respostas.situacao || ""}
              onChange={(e) => escolherSituacao(e.target.value)}
            >
              <option value="">Selecione...</option>
              {arvore.principal.opcoes.map((opcao) => (
                <option key={opcao.valor} value={opcao.valor}>
                  {opcao.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {perguntaSegundaEtapa && (
          <div>
            <label htmlFor={perguntaSegundaEtapa.id}>{perguntaSegundaEtapa.pergunta}</label>
            <br />
            <select
              id={perguntaSegundaEtapa.id}
              value={respostas[perguntaSegundaEtapa.id] || ""}
              onChange={(e) => responderSegundaEtapa(perguntaSegundaEtapa.id, e.target.value)}
            >
              <option value="">Selecione...</option>
              {perguntaSegundaEtapa.opcoes.map((opcao) => (
                <option key={opcao.valor} value={opcao.valor}>
                  {opcao.label}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label htmlFor="descricao">Descreva seu caso</label>
          <br />
          <textarea
            id="descricao"
            rows={5}
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
          />
        </div>

        <Button type="submit" disabled={enviando}>
          {enviando ? "Classificando..." : "Enviar"}
        </Button>
        {erro && <p role="alert">{erro}</p>}
      </form>
    </main>
  );
}
