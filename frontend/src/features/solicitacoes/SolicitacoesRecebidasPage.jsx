import { useState } from "react";
import { Button } from "../../components/Button/Button";
import { Loading } from "../../components/Loading/Loading";
import { api } from "../../lib/api";
import {
  formatarData,
  LABEL_AREA,
  LABEL_SITUACAO_ADVOGADO,
  rotulosEspecialidades,
} from "../../lib/solicitacoes";
import { useCarregar } from "../../lib/useCarregar";
import { useTitulo } from "../../lib/useTitulo";

const ABAS = [
  { situacao: "pendente", label: "Pendentes" },
  { situacao: "aceita", label: "Aceitos" },
  { situacao: "recusada", label: "Recusados" },
];

async function buscar() {
  const [solicitacoes, perguntas] = await Promise.all([
    api.get("/solicitacoes/recebidas"),
    api.get("/triagem/perguntas"),
  ]);
  return { solicitacoes, rotulos: rotulosEspecialidades(perguntas.categorias) };
}

// Pedidos de contato que o advogado recebeu (RF013): lê as respostas da triagem que o
// cliente autorizou e aceita ou recusa. Ao aceitar, o cliente recebe o WhatsApp/e-mail do
// advogado e o nome do cliente aparece aqui. O quadro de casos (RF012) vem no Sprint 6.
export function SolicitacoesRecebidasPage() {
  useTitulo("Pedidos de contato");
  const { dado, erro, setErro, recarregar } = useCarregar(buscar);
  const [aba, setAba] = useState("pendente");
  const [respondendo, setRespondendo] = useState(null);

  async function responder(id, acao) {
    if (acao === "recusar" && !window.confirm("Recusar este pedido? O cliente vai ser avisado.")) return;
    setErro(null);
    setRespondendo(id);
    try {
      await api.patch(`/solicitacoes/${id}`, { acao });
      await recarregar();
    } catch (err) {
      setErro(err.message);
    } finally {
      setRespondendo(null);
    }
  }

  if (!dado && !erro) return <Loading>Carregando...</Loading>;
  const solicitacoes = dado?.solicitacoes || [];
  const rotulos = dado?.rotulos || {};
  const daAba = solicitacoes.filter((s) => s.situacao === aba);

  return (
    <main>
      <h1>Pedidos de contato</h1>
      <p className="text-muted">
        Clientes que fizeram a triagem e escolheram você. Leia o caso e responda — se aceitar, o
        cliente recebe seu WhatsApp e e-mail pra combinar o atendimento.
      </p>

      <nav className="pill-toggle" aria-label="Situação dos pedidos">
        {ABAS.map(({ situacao, label }) => (
          <button
            key={situacao}
            type="button"
            className={`pill-toggle__item${aba === situacao ? " pill-toggle__item--active" : ""}`}
            aria-pressed={aba === situacao}
            onClick={() => setAba(situacao)}
          >
            {label} ({solicitacoes.filter((s) => s.situacao === situacao).length})
          </button>
        ))}
      </nav>

      {erro && <p role="alert">{erro}</p>}
      {daAba.length === 0 && (
        <p className="text-muted">
          {aba === "pendente" ? "Nenhum pedido esperando resposta." : "Nada por aqui ainda."}
        </p>
      )}

      <ul className="list-plain">
        {daAba.map((s) => (
          <li key={s.id} className="card stack">
            <div className="stack" style={{ gap: 2 }}>
              <strong>
                {s.clienteNome || "Cliente"} · {LABEL_AREA[s.area] || s.area}
                {s.especialidade && rotulos[s.especialidade] ? ` — ${rotulos[s.especialidade]}` : ""}
              </strong>
              <span className="text-muted">
                {LABEL_SITUACAO_ADVOGADO[s.situacao]} · pedido em {formatarData(s.createdAt)}
              </span>
            </div>
            <details open={s.situacao === "pendente"}>
              <summary className="text-muted">Respostas da triagem</summary>
              <p style={{ whiteSpace: "pre-line", marginBottom: 0 }}>{s.descricao}</p>
            </details>
            {s.situacao === "pendente" && (
              <div className="actions">
                <Button disabled={respondendo === s.id} onClick={() => responder(s.id, "aceitar")}>
                  Aceitar e liberar meu contato
                </Button>
                <Button
                  variant="secondary"
                  disabled={respondendo === s.id}
                  onClick={() => responder(s.id, "recusar")}
                >
                  Recusar
                </Button>
              </div>
            )}
            {s.situacao === "aceita" && (
              <p className="text-muted" style={{ margin: 0 }}>
                O cliente já recebeu seu WhatsApp e e-mail e deve te chamar por lá.
              </p>
            )}
          </li>
        ))}
      </ul>
    </main>
  );
}
