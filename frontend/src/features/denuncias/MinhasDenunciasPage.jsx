import { useEffect, useState } from "react";
import { Loading } from "../../components/Loading/Loading";
import { api } from "../../lib/api";

const LABEL_STATUS = { aberta: "Aberta", em_analise: "Em análise", resolvida: "Resolvida" };

export function MinhasDenunciasPage() {
  const [denuncias, setDenuncias] = useState(null);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    api.get("/denuncias/minhas").then(setDenuncias).catch((err) => setErro(err.message));
  }, []);

  return (
    <main>
      {denuncias && denuncias.length > 0 && (
        <span className="eyebrow">
          {denuncias.length} denúncia{denuncias.length === 1 ? "" : "s"} registrada
          {denuncias.length === 1 ? "" : "s"}
        </span>
      )}
      <h1>Minhas denúncias</h1>

      {erro && <p role="alert">{erro}</p>}
      {!denuncias && !erro && <Loading>Carregando...</Loading>}
      {denuncias && denuncias.length === 0 && <p>Você ainda não registrou nenhuma denúncia.</p>}

      {denuncias && denuncias.length > 0 && (
        <ul className="list-plain">
          {denuncias.map((d) => (
            <li key={d.id} className="card stack">
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
              <p>{d.descricao}</p>
              {d.status === "resolvida" && (
                <p className="text-muted">
                  {d.decisao || "Denúncia analisada pela nossa equipe."}
                </p>
              )}
              {d.status !== "resolvida" && (
                <p className="text-muted">Ainda em análise pela nossa equipe.</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
