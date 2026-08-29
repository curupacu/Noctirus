import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Avatar } from "../../components/Avatar/Avatar";
import { Loading } from "../../components/Loading/Loading";
import { api } from "../../lib/api";
import { useTitulo } from "../../lib/useTitulo";

const LABEL_REMETENTE = { cliente: "Cliente", advogado: "Você" };

// Lista de conversas do advogado — não existia nenhuma tela onde ele visse que foi
// contatado (pedido do usuário, 18/08). Cada linha é a última mensagem trocada com um
// cliente; abrir leva pro chatzinho de verdade (ConversaPage).
export function ConversasPage() {
  useTitulo("Conversas");
  const [conversas, setConversas] = useState(null);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    api.get("/conversas/minhas").then(setConversas).catch((err) => setErro(err.message));
  }, []);

  return (
    <main>
      {conversas && conversas.length > 0 && (
        <span className="eyebrow">
          {conversas.length} conversa{conversas.length === 1 ? "" : "s"}
        </span>
      )}
      <h1>Minhas conversas</h1>

      {erro && <p role="alert">{erro}</p>}
      {!conversas && !erro && <Loading>Carregando...</Loading>}
      {conversas && conversas.length === 0 && (
        <p className="text-muted">
          Ninguém te mandou mensagem ainda. Quando um cliente te contatar pela Nocturis, a
          conversa aparece aqui.
        </p>
      )}

      {conversas && conversas.length > 0 && (
        <ul className="list-plain">
          {conversas.map((c) => (
            <li key={c.comUid}>
              <Link
                to={`/conversas/${c.comUid}`}
                state={{ nome: c.nome, foto: c.foto }}
                className="list-row"
              >
                <Avatar nome={c.nome} foto={c.foto} seed={c.comUid} />
                <span className="list-row__info">
                  <span className="list-row__title">{c.nome || "Cliente"}</span>
                  <span className="list-row__meta">
                    {LABEL_REMETENTE[c.ultimoRemetente]}: {c.ultimaMensagem}
                  </span>
                </span>
                <span className="advogado-row__chevron" aria-hidden="true">
                  ›
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
