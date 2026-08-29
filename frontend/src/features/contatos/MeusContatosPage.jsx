import { Link } from "react-router-dom";
import { Avatar } from "../../components/Avatar/Avatar";
import { Loading } from "../../components/Loading/Loading";
import { api } from "../../lib/api";
import { useCarregar } from "../../lib/useCarregar";
import { useTitulo } from "../../lib/useTitulo";

// Mesma lista de STATUS_CONTATO_CLIENTE do backend (backend/src/routes/contatos.js) —
// duplicado de propósito, é só rótulo de UI, não vale um endpoint só pra isso.
const STATUS_OPCOES = ["Chamei no WhatsApp", "Mandei e-mail", "Aguardando resposta", "Já conversamos"];

export function MeusContatosPage() {
  useTitulo("Meus contatos");
  const { dado: contatos, setDado: setContatos, erro, setErro } = useCarregar(() => api.get("/contatos/meus"));

  async function marcarStatus(advogadoId, status) {
    const anterior = contatos;
    setContatos((atual) =>
      atual.map((c) => (c.advogadoId === advogadoId ? { ...c, status } : c)),
    );
    try {
      await api.patch(`/contatos/meus/${advogadoId}`, { status });
    } catch (err) {
      setContatos(anterior);
      setErro(err.message);
    }
  }

  async function remover(advogadoId) {
    if (!window.confirm("Tirar este advogado da sua lista de contatos?")) return;
    const anterior = contatos;
    setContatos((atual) => atual.filter((c) => c.advogadoId !== advogadoId));
    try {
      await api.delete(`/contatos/meus/${advogadoId}`);
    } catch (err) {
      setContatos(anterior);
      setErro(err.message);
    }
  }

  return (
    <main>
      {contatos && contatos.length > 0 && (
        <span className="eyebrow">
          {contatos.length} advogado{contatos.length === 1 ? "" : "s"} contatado
          {contatos.length === 1 ? "" : "s"}
        </span>
      )}
      <h1>Meus contatos</h1>
      <p className="text-muted">
        Advogados que você chamou no WhatsApp ou por e-mail — organize por aqui, avalie o
        atendimento ou tire alguém da lista.
      </p>

      {erro && <p role="alert">{erro}</p>}
      {!contatos && !erro && <Loading>Carregando...</Loading>}
      {contatos && contatos.length === 0 && (
        <p className="text-muted">
          Você ainda não contatou nenhum advogado. Assim que clicar em "Falar no WhatsApp" ou
          "Enviar e-mail" no perfil de alguém, ele aparece aqui.
        </p>
      )}

      {contatos && contatos.length > 0 && (
        <ul className="list-plain">
          {contatos.map((c) => (
            <li key={c.advogadoId} className="card stack">
              <Link to={`/advogados/${c.advogadoId}`} className="media">
                <Avatar nome={c.advogadoNome} foto={c.advogadoFoto} seed={c.advogadoId} />
                <span className="stack" style={{ gap: 2 }}>
                  <strong>{c.advogadoNome || "Advogado"}</strong>
                  {c.advogadoSuspenso && <span className="badge badge--danger">Suspenso da plataforma</span>}
                </span>
              </Link>

              <div className="pill-toggle">
                {STATUS_OPCOES.map((opcao) => (
                  <button
                    key={opcao}
                    type="button"
                    className={`pill-toggle__item${c.status === opcao ? " pill-toggle__item--active" : ""}`}
                    aria-pressed={c.status === opcao}
                    onClick={() => marcarStatus(c.advogadoId, c.status === opcao ? null : opcao)}
                  >
                    {opcao}
                  </button>
                ))}
              </div>

              <div className="actions">
                <Link to={`/advogados/${c.advogadoId}`} className="button button--secondary">
                  Avaliar atendimento
                </Link>
                <button type="button" className="button button--secondary" onClick={() => remover(c.advogadoId)}>
                  Remover
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
