import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../components/Button/Button";
import { api } from "../../lib/api";

export function TriagemPage() {
  const [perguntas, setPerguntas] = useState(null);
  const [respostas, setRespostas] = useState({});
  const [descricao, setDescricao] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    api
      .get("/triagem/perguntas")
      .then((dados) => setPerguntas(dados.perguntas))
      .catch((err) => setErro(err.message));
  }, []);

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

  if (!perguntas && !erro) return <p>Carregando...</p>;

  return (
    <main>
      <h1>Triagem</h1>
      <p>
        Responda as perguntas e descreva seu caso com suas próprias palavras. Você pode fazer
        uma nova triagem sempre que tiver outro problema.
      </p>

      <form onSubmit={enviar}>
        {perguntas?.map((pergunta) => (
          <div key={pergunta.id}>
            <label htmlFor={pergunta.id}>{pergunta.pergunta}</label>
            <br />
            <select
              id={pergunta.id}
              value={respostas[pergunta.id] || ""}
              onChange={(e) =>
                setRespostas((r) => ({ ...r, [pergunta.id]: e.target.value }))
              }
            >
              <option value="">Selecione...</option>
              {pergunta.opcoes.map((opcao) => (
                <option key={opcao.valor} value={opcao.valor}>
                  {opcao.label}
                </option>
              ))}
            </select>
          </div>
        ))}

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
