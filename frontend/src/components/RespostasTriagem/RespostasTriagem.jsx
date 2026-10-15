import "./RespostasTriagem.css";

// Todos os textos de pergunta das duas etapas, a partir de GET /triagem/perguntas.
export function textosDasPerguntas(perguntas) {
  return [...(perguntas?.etapa1 || []), ...Object.values(perguntas?.etapa2 || {}).flat()].map(
    (p) => p.pergunta,
  );
}

// A descrição vem montada como "Pergunta? resposta" por linha (montarDescricao no
// backend) — separa cada linha em pergunta + resposta, em vez de um bloco corrido. Usa os
// textos conhecidos porque algumas perguntas têm dois "?" ("Você ainda trabalha lá? Se
// saiu, como foi a saída?").
export function RespostasTriagem({ descricao, textosPerguntas = [] }) {
  const linhas = String(descricao || "")
    .split("\n")
    .filter((l) => l.trim());
  return (
    <dl className="respostas-triagem">
      {linhas.map((linha, i) => {
        const conhecida = textosPerguntas.find((t) => linha.startsWith(t));
        const corte = conhecida ? conhecida.length : linha.indexOf("? ") + 1;
        const pergunta = corte > 0 ? linha.slice(0, corte) : null;
        const resposta = corte > 0 ? linha.slice(corte).trim() : linha;
        return (
          <div key={i}>
            {pergunta && <dt>{pergunta}</dt>}
            <dd>{resposta || "Não respondeu"}</dd>
          </div>
        );
      })}
    </dl>
  );
}
