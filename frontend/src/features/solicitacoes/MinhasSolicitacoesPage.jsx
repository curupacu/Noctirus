import { Link } from "react-router-dom";
import { Avatar } from "../../components/Avatar/Avatar";
import { Loading } from "../../components/Loading/Loading";
import { api } from "../../lib/api";
import {
  formatarData,
  LABEL_AREA,
  LABEL_SITUACAO_CLIENTE,
  rotulosEspecialidades,
} from "../../lib/solicitacoes";
import { useCarregar } from "../../lib/useCarregar";
import { useTitulo } from "../../lib/useTitulo";
import { ContatosLiberados } from "../advogados/ContatoAdvogadoPage";

async function buscar() {
  const [solicitacoes, perguntas] = await Promise.all([
    api.get("/solicitacoes/minhas"),
    api.get("/triagem/perguntas"),
  ]);
  return { solicitacoes, rotulos: rotulosEspecialidades(perguntas.categorias) };
}

// RF014: o cliente acompanha os pedidos de contato — advogado, data e situação. Nos aceitos
// aparecem o WhatsApp/e-mail do advogado (RF010).
export function MinhasSolicitacoesPage() {
  useTitulo("Minhas solicitações");
  const { dado, erro } = useCarregar(buscar);

  if (erro) return <p role="alert">{erro}</p>;
  if (!dado) return <Loading>Carregando...</Loading>;
  const { solicitacoes, rotulos } = dado;

  return (
    <main>
      <h1>Minhas solicitações</h1>
      <p className="text-muted">
        Os advogados que você pediu pra falar. Quando um aceita, o contato dele aparece aqui.
      </p>

      {solicitacoes.length === 0 && (
        <div className="card stack">
          <p className="text-muted" style={{ margin: 0 }}>
            Você ainda não pediu contato a nenhum advogado. Faça uma triagem e escolha um advogado
            compatível com o seu caso.
          </p>
          <Link to="/triagem" className="button button--primary">
            Fazer triagem
          </Link>
        </div>
      )}

      <ul className="list-plain">
        {solicitacoes.map((s) => (
          <li key={s.id} className="card stack">
            <Link to={`/advogados/${s.advogadoId}`} className="media">
              <Avatar nome={s.advogadoNome} foto={s.advogadoFoto} seed={s.advogadoId} />
              <span className="stack" style={{ gap: 2 }}>
                <strong>{s.advogadoNome || "Advogado"}</strong>
                <span className="text-muted">
                  {LABEL_AREA[s.area] || s.area}
                  {s.especialidade && rotulos[s.especialidade] ? ` · ${rotulos[s.especialidade]}` : ""}
                </span>
              </span>
            </Link>
            <p style={{ margin: 0 }}>
              <span className={`badge${s.situacao === "aceita" ? " badge--seal" : ""}`}>
                {LABEL_SITUACAO_CLIENTE[s.situacao]}
              </span>{" "}
              <span className="text-muted">Pedido em {formatarData(s.createdAt)}</span>
            </p>
            {s.situacao === "aceita" && <ContatosLiberados contatos={s.contatos} />}
            {s.situacao === "recusada" && s.triagemId && (
              <Link to={`/triagem/${s.triagemId}`} className="button button--secondary">
                Ver outros advogados pro mesmo caso
              </Link>
            )}
          </li>
        ))}
      </ul>
    </main>
  );
}
