import { useEffect, useState } from "react";
import { Button } from "../../components/Button/Button";
import { Loading } from "../../components/Loading/Loading";
import { api } from "../../lib/api";
import { formatarData, LABEL_AREA, rotulosEspecialidades } from "../../lib/solicitacoes";
import { useCarregar } from "../../lib/useCarregar";
import { useTitulo } from "../../lib/useTitulo";
import "./QuadroCasosPage.css";

const COLUNAS = [
  { etapa: "pendente", titulo: "Pendentes", vazio: "Nenhum pedido esperando resposta." },
  { etapa: "em_andamento", titulo: "Em andamento", vazio: "Aceite um pedido pra ele vir pra cá." },
  { etapa: "concluido", titulo: "Concluídos", vazio: "Arraste pra cá os casos que terminaram." },
];

const PRIORIDADES = [
  { valor: "alta", label: "Alta" },
  { valor: "media", label: "Média" },
  { valor: "baixa", label: "Baixa" },
];
const PESO_PRIORIDADE = { alta: 0, media: 1, baixa: 2 };

async function buscar() {
  const [casos, perguntas] = await Promise.all([api.get("/solicitacoes/recebidas"), api.get("/triagem/perguntas")]);
  return { casos, rotulos: rotulosEspecialidades(perguntas.categorias) };
}

function tituloCaso(caso, rotulos) {
  const assunto = rotulos[caso.especialidade] || LABEL_AREA[caso.area] || "Caso";
  return `${LABEL_AREA[caso.area] || ""}${caso.especialidade && rotulos[caso.especialidade] ? ` — ${assunto}` : ""}`;
}

function CartaoCaso({ caso, rotulos, onAbrir, onResponder, ocupado }) {
  const pendente = caso.etapaCaso === "pendente";
  return (
    <li
      className={`quadro-cartao quadro-cartao--${caso.prioridade}`}
      draggable={!pendente || undefined}
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", caso.id);
        e.dataTransfer.effectAllowed = "move";
      }}
    >
      <button type="button" className="quadro-cartao__abrir" onClick={() => onAbrir(caso.id)}>
        <span className="quadro-cartao__prioridade">Prioridade {PRIORIDADES.find((p) => p.valor === caso.prioridade)?.label.toLowerCase()}</span>
        <strong className="quadro-cartao__titulo">{pendente ? "Pedido novo" : caso.clienteNome || "Cliente"}</strong>
        <span className="quadro-cartao__meta">{tituloCaso(caso, rotulos)}</span>
        <span className="quadro-cartao__meta">Pedido em {formatarData(caso.createdAt)}</span>
        {caso.anotacoes && <span className="quadro-cartao__nota">Tem anotação</span>}
      </button>
      {pendente && (
        <div className="quadro-cartao__acoes">
          <Button disabled={ocupado} onClick={() => onResponder(caso.id, "aceitar")}>
            Aceitar
          </Button>
          <Button variant="secondary" disabled={ocupado} onClick={() => onResponder(caso.id, "recusar")}>
            Recusar
          </Button>
        </div>
      )}
    </li>
  );
}

// Painel com o detalhe de um caso: respostas da triagem, prioridade, anotações e as ações
// de mover/arquivar. No celular ocupa a tela; no computador abre do lado.
function DetalheCaso({ caso, rotulos, onFechar, onMudar, onResponder, ocupado }) {
  const [anotacoes, setAnotacoes] = useState(caso.anotacoes);
  const [salvo, setSalvo] = useState(false);
  const pendente = caso.etapaCaso === "pendente";

  useEffect(() => {
    setAnotacoes(caso.anotacoes);
    setSalvo(false);
  }, [caso.id, caso.anotacoes]);

  useEffect(() => {
    const fechar = (e) => e.key === "Escape" && onFechar();
    window.addEventListener("keydown", fechar);
    return () => window.removeEventListener("keydown", fechar);
  }, [onFechar]);

  async function salvarAnotacoes(e) {
    e.preventDefault();
    await onMudar(caso.id, { anotacoes });
    setSalvo(true);
  }

  return (
    <div className="quadro-detalhe" role="dialog" aria-modal="true" aria-labelledby="detalhe-titulo">
      <button type="button" className="quadro-detalhe__fundo" aria-label="Fechar" onClick={onFechar} />
      <section className="quadro-detalhe__painel">
        <div className="quadro-detalhe__topo">
          <div>
            <span className="eyebrow">{COLUNAS.find((c) => c.etapa === caso.etapaCaso)?.titulo}</span>
            <h2 id="detalhe-titulo" style={{ margin: 0 }}>
              {pendente ? "Pedido novo" : caso.clienteNome || "Cliente"}
            </h2>
            <p className="text-muted" style={{ margin: 0 }}>
              {tituloCaso(caso, rotulos)} · pedido em {formatarData(caso.createdAt)}
            </p>
          </div>
          <button type="button" className="quadro-detalhe__fechar" onClick={onFechar} aria-label="Fechar">
            ×
          </button>
        </div>

        <h3>Respostas da triagem</h3>
        <p className="quadro-detalhe__respostas">{caso.descricao}</p>

        {pendente ? (
          <>
            <p className="text-muted">
              O nome do cliente aparece quando você aceitar — e ele recebe seu WhatsApp e e-mail.
            </p>
            <div className="actions">
              <Button disabled={ocupado} onClick={() => onResponder(caso.id, "aceitar")}>
                Aceitar e liberar meu contato
              </Button>
              <Button variant="secondary" disabled={ocupado} onClick={() => onResponder(caso.id, "recusar")}>
                Recusar
              </Button>
            </div>
          </>
        ) : (
          <>
            <h3>Prioridade</h3>
            <div className="pill-toggle">
              {PRIORIDADES.map((p) => (
                <button
                  key={p.valor}
                  type="button"
                  className={`pill-toggle__item${caso.prioridade === p.valor ? " pill-toggle__item--active" : ""}`}
                  aria-pressed={caso.prioridade === p.valor}
                  disabled={ocupado}
                  onClick={() => onMudar(caso.id, { prioridade: p.valor })}
                >
                  {p.label}
                </button>
              ))}
            </div>

            <form className="stack" onSubmit={salvarAnotacoes}>
              <label className="input-label" htmlFor="anotacoes">
                Anotações <span className="text-muted">(só você vê)</span>
              </label>
              <textarea
                id="anotacoes"
                className="input"
                rows={5}
                maxLength={2000}
                value={anotacoes}
                onChange={(e) => {
                  setAnotacoes(e.target.value);
                  setSalvo(false);
                }}
                placeholder="Ex.: pedir holerites e carteira de trabalho; audiência dia 20."
              />
              <div className="actions">
                <Button type="submit" variant="secondary" disabled={ocupado || anotacoes === caso.anotacoes}>
                  Salvar anotações
                </Button>
                {salvo && <span className="text-muted">Salvo.</span>}
              </div>
            </form>

            <h3>Mover</h3>
            <div className="actions">
              {caso.etapaCaso !== "em_andamento" && (
                <Button variant="secondary" disabled={ocupado} onClick={() => onMudar(caso.id, { etapa: "em_andamento" })}>
                  Voltar pra em andamento
                </Button>
              )}
              {caso.etapaCaso !== "concluido" && (
                <Button disabled={ocupado} onClick={() => onMudar(caso.id, { etapa: "concluido" })}>
                  Marcar como concluído
                </Button>
              )}
              <Button
                variant="secondary"
                disabled={ocupado}
                onClick={async () => {
                  await onMudar(caso.id, { arquivado: true });
                  onFechar();
                }}
              >
                Arquivar (tirar do quadro)
              </Button>
            </div>
          </>
        )}
      </section>
    </div>
  );
}

// Quadro de casos do advogado (RF012): pedidos e casos aceitos por etapa — pendente, em
// andamento e concluído —, com prioridade e anotações. No computador dá pra arrastar entre
// colunas; no celular cada coluna vira uma aba (arrastar no toque é ruim).
export function QuadroCasosPage() {
  useTitulo("Meus casos");
  const { dado, setDado, erro, setErro, recarregar } = useCarregar(buscar);
  const [abaCelular, setAbaCelular] = useState("pendente");
  const [abertoId, setAbertoId] = useState(null);
  const [ocupado, setOcupado] = useState(false);
  const [sobre, setSobre] = useState(null);

  async function responder(id, acao) {
    if (acao === "recusar" && !window.confirm("Recusar este pedido? O cliente vai ser avisado.")) return;
    setErro(null);
    setOcupado(true);
    try {
      await api.patch(`/solicitacoes/${id}`, { acao });
      await recarregar();
      if (acao === "recusar") setAbertoId(null);
    } catch (err) {
      setErro(err.message);
    } finally {
      setOcupado(false);
    }
  }

  // Atualiza na tela na hora (o quadro não "pisca") e manda pro backend; se falhar, recarrega.
  async function mudar(id, campos) {
    setErro(null);
    const local = {
      ...(campos.etapa ? { etapaCaso: campos.etapa } : {}),
      ...(campos.prioridade ? { prioridade: campos.prioridade } : {}),
      ...(campos.anotacoes !== undefined ? { anotacoes: campos.anotacoes.trim() } : {}),
      ...(campos.arquivado !== undefined ? { arquivado: campos.arquivado } : {}),
    };
    setDado((atual) => ({ ...atual, casos: atual.casos.map((c) => (c.id === id ? { ...c, ...local } : c)) }));
    setOcupado(true);
    try {
      await api.patch(`/solicitacoes/${id}/caso`, campos);
    } catch (err) {
      setErro(err.message);
      await recarregar();
    } finally {
      setOcupado(false);
    }
  }

  async function soltar(e, etapaDestino) {
    e.preventDefault();
    setSobre(null);
    const id = e.dataTransfer.getData("text/plain");
    const caso = dado?.casos.find((c) => c.id === id);
    if (!caso || caso.etapaCaso === etapaDestino || etapaDestino === "pendente") return;
    await mudar(id, { etapa: etapaDestino });
  }

  if (!dado && !erro) return <Loading>Carregando...</Loading>;
  const casos = dado?.casos || [];
  const rotulos = dado?.rotulos || {};
  const noQuadro = casos.filter((c) => c.situacao !== "recusada" && !c.arquivado);
  const arquivados = casos.filter((c) => c.situacao === "aceita" && c.arquivado);
  const recusados = casos.filter((c) => c.situacao === "recusada");
  const daColuna = (etapa) =>
    noQuadro
      .filter((c) => c.etapaCaso === etapa)
      .sort(
        (a, b) =>
          PESO_PRIORIDADE[a.prioridade] - PESO_PRIORIDADE[b.prioridade] || b.createdAt.localeCompare(a.createdAt),
      );
  const aberto = casos.find((c) => c.id === abertoId);

  return (
    <main className="quadro">
      <h1>Meus casos</h1>
      <p className="text-muted">
        Os pedidos que você recebeu e os casos que aceitou. Abra um cartão pra ler as respostas do
        cliente, mudar a prioridade e fazer anotações.
      </p>
      {erro && <p role="alert">{erro}</p>}

      <nav className="pill-toggle quadro__abas" aria-label="Colunas do quadro">
        {COLUNAS.map(({ etapa, titulo }) => (
          <button
            key={etapa}
            type="button"
            className={`pill-toggle__item${abaCelular === etapa ? " pill-toggle__item--active" : ""}`}
            aria-pressed={abaCelular === etapa}
            onClick={() => setAbaCelular(etapa)}
          >
            {titulo} ({daColuna(etapa).length})
          </button>
        ))}
      </nav>

      <div className="quadro__colunas">
        {COLUNAS.map(({ etapa, titulo, vazio }) => {
          const lista = daColuna(etapa);
          return (
            <section
              key={etapa}
              className={`quadro-coluna${abaCelular === etapa ? " quadro-coluna--aba-ativa" : ""}${sobre === etapa ? " quadro-coluna--sobre" : ""}`}
              aria-label={titulo}
              onDragOver={(e) => {
                if (etapa === "pendente") return;
                e.preventDefault();
                setSobre(etapa);
              }}
              onDragLeave={() => setSobre(null)}
              onDrop={(e) => soltar(e, etapa)}
            >
              <h2 className="quadro-coluna__titulo">
                {titulo} <span className="text-muted">{lista.length}</span>
              </h2>
              {lista.length === 0 && <p className="text-muted quadro-coluna__vazio">{vazio}</p>}
              <ul className="list-plain quadro-coluna__lista">
                {lista.map((caso) => (
                  <CartaoCaso
                    key={caso.id}
                    caso={caso}
                    rotulos={rotulos}
                    ocupado={ocupado}
                    onAbrir={setAbertoId}
                    onResponder={responder}
                  />
                ))}
              </ul>
            </section>
          );
        })}
      </div>

      {(arquivados.length > 0 || recusados.length > 0) && (
        <section className="quadro__fora">
          {arquivados.length > 0 && (
            <details>
              <summary>Arquivados ({arquivados.length})</summary>
              <ul className="list-plain">
                {arquivados.map((c) => (
                  <li key={c.id} className="list-row">
                    <span className="list-row__info">
                      <span className="list-row__title">{c.clienteNome || "Cliente"}</span>
                      <span className="list-row__meta">
                        {tituloCaso(c, rotulos)} · pedido em {formatarData(c.createdAt)}
                      </span>
                    </span>
                    <Button variant="secondary" disabled={ocupado} onClick={() => mudar(c.id, { arquivado: false })}>
                      Voltar pro quadro
                    </Button>
                  </li>
                ))}
              </ul>
            </details>
          )}
          {recusados.length > 0 && (
            <details>
              <summary>Pedidos recusados ({recusados.length})</summary>
              <ul className="list-plain">
                {recusados.map((c) => (
                  <li key={c.id} className="list-row">
                    <span className="list-row__info">
                      <span className="list-row__title">{tituloCaso(c, rotulos)}</span>
                      <span className="list-row__meta">Pedido em {formatarData(c.createdAt)}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </details>
          )}
        </section>
      )}

      {aberto && (
        <DetalheCaso
          caso={aberto}
          rotulos={rotulos}
          ocupado={ocupado}
          onFechar={() => setAbertoId(null)}
          onMudar={mudar}
          onResponder={responder}
        />
      )}
    </main>
  );
}
