import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "../../components/Button/Button";
import { Loading } from "../../components/Loading/Loading";
import { api } from "../../lib/api";
import { useCarregar } from "../../lib/useCarregar";
import { AdminNav } from "./AdminNav";

const LABEL_STATUS = { aberta: "Aberta", em_analise: "Em análise", resolvida: "Resolvida" };

export function AdminDenunciasPage() {
  const { dado: denuncias, erro, setErro, recarregar } = useCarregar(() => api.get("/admin/denuncias"));
  const [decisoes, setDecisoes] = useState({});

  async function marcarEmAnalise(id) {
    setErro(null);
    try {
      await api.patch(`/admin/denuncias/${id}`, { status: "em_analise" });
      await recarregar();
    } catch (err) {
      setErro(err.message);
    }
  }

  // Resolve e já grava uma explicação pro autor ver em "Minhas denúncias" — antes o admin
  // marcava "resolvida" sem deixar claro pro cliente o que aconteceu com quem ele denunciou.
  async function resolver(d, { suspenderAlvo }) {
    setErro(null);
    const decisaoDigitada = decisoes[d.id]?.trim();
    const decisaoPadrao = suspenderAlvo
      ? `Denúncia procedente: ${d.alvoNome || "o profissional denunciado"} foi suspenso da plataforma.`
      : "Denúncia analisada: não foi necessário suspender ninguém.";

    try {
      if (suspenderAlvo) {
        await api.patch(`/admin/users/${d.alvoId}/suspender`, { suspenso: true });
      }
      await api.patch(`/admin/denuncias/${d.id}`, {
        status: "resolvida",
        decisao: decisaoDigitada || decisaoPadrao,
      });
      await recarregar();
    } catch (err) {
      setErro(err.message);
    }
  }

  if (erro) return <p role="alert">{erro}</p>;
  if (!denuncias) return <Loading>Carregando...</Loading>;

  return (
    <main>
      <span className="eyebrow">Administração</span>
      <h1>Denúncias</h1>
      <AdminNav />

      {denuncias.length === 0 && <p className="text-muted">Nenhuma denúncia registrada.</p>}

      <ul className="list-plain">
        {denuncias.map((d, i) => (
          <li
            key={d.id}
            className="card stack step-enter"
            style={{ animationDelay: `${Math.min(i * 40, 400)}ms` }}
          >
            <p>
              <span className={`badge${d.status === "resolvida" ? " badge--seal" : ""}`}>
                {d.status === "resolvida" && (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                )}
                {LABEL_STATUS[d.status] || d.status}
              </span>{" "}
              <span className="text-muted">{new Date(d.createdAt).toLocaleDateString("pt-BR")}</span>
            </p>
            <p>
              <strong>{d.autorNome || d.autorId}</strong> ({d.autorTipo}) denunciou{" "}
              {d.alvoId && d.alvoTipo === "advogado" ? (
                <Link to={`/advogados/${d.alvoId}`}>
                  <strong>{d.alvoNome || d.alvoId}</strong>
                </Link>
              ) : (
                <strong>{d.alvoNome || d.alvoId || "sem alvo específico"}</strong>
              )}
              {d.alvoStatus === "suspenso" && (
                <span className="badge badge--danger">alvo já suspenso</span>
              )}
            </p>
            <p>{d.descricao}</p>
            {d.provaUrl && (
              <p>
                <a href={d.provaUrl} target="_blank" rel="noreferrer">
                  Ver prova
                </a>
              </p>
            )}
            {d.status === "resolvida" && d.decisao && (
              <p className="text-muted">Decisão enviada ao autor: {d.decisao}</p>
            )}

            {d.status !== "resolvida" && (
              <>
                <div className="input-group">
                  <label className="input-label" htmlFor={`decisao-${d.id}`}>
                    Explicação pro autor (opcional — se deixar em branco, usamos um texto padrão)
                  </label>
                  <textarea
                    id={`decisao-${d.id}`}
                    className="input"
                    rows={2}
                    value={decisoes[d.id] ?? ""}
                    onChange={(e) => setDecisoes((atual) => ({ ...atual, [d.id]: e.target.value }))}
                  />
                </div>

                <div className="actions">
                  <Button variant="secondary" onClick={() => marcarEmAnalise(d.id)}>
                    Marcar em análise
                  </Button>
                  {d.alvoId && d.alvoStatus !== "suspenso" && (
                    <Button onClick={() => resolver(d, { suspenderAlvo: true })}>
                      Suspender denunciado e resolver
                    </Button>
                  )}
                  <Button variant="secondary" onClick={() => resolver(d, { suspenderAlvo: false })}>
                    Resolver sem suspender
                  </Button>
                </div>
              </>
            )}
          </li>
        ))}
      </ul>
    </main>
  );
}
