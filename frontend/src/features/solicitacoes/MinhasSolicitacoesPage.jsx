import { useState } from "react";
import { Link } from "react-router-dom";
import { Avatar } from "../../components/Avatar/Avatar";
import { EsqueletoPagina } from "../../components/Esqueleto/Esqueleto";
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
import "../painel/PainelPage.css";
import { ModalAceite } from "../../components/AceiteDestaque/AceiteDestaque";

async function buscar() {
  const [solicitacoes, perguntas] = await Promise.all([
    api.get("/solicitacoes/minhas"),
    api.get("/triagem/perguntas"),
  ]);
  return { solicitacoes, rotulos: rotulosEspecialidades(perguntas.categorias) };
}

const ABAS = [
  { situacao: "pendente", label: "Aguardando" },
  { situacao: "aceita", label: "Aceitos" },
  { situacao: "recusada", label: "Recusados" },
];

// RF014: o cliente acompanha os pedidos de contato — advogado, data e situação. Nos aceitos
// aparecem o WhatsApp/e-mail do advogado (RF010).
export function MinhasSolicitacoesPage() {
  useTitulo("Meus pedidos de contato");
  const { dado, erro } = useCarregar(buscar);
  const [aba, setAba] = useState(null);

  if (erro) return <p role="alert">{erro}</p>;
  if (!dado) return <EsqueletoPagina />;
  const { solicitacoes, rotulos } = dado;
  const contagem = Object.fromEntries(
    ABAS.map(({ situacao }) => [situacao, solicitacoes.filter((s) => s.situacao === situacao).length]),
  );
  // Abre na aba "Aceitos" se tiver algum (é onde está o contato liberado); senão "Aguardando".
  const abaAtual = aba || (contagem.aceita > 0 ? "aceita" : "pendente");
  const daAba = solicitacoes.filter((s) => s.situacao === abaAtual);

  return (
    <main>
      <h1>Meus pedidos de contato</h1>
      <ModalAceite solicitacoes={solicitacoes} />
      <p className="text-muted">
        Os advogados que você pediu para falar. Quando um aceita, o contato dele aparece aqui.
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

      {solicitacoes.length > 0 && (
        <nav className="pill-toggle" aria-label="Situação dos pedidos" style={{ marginBottom: "var(--space-lg)" }}>
          {ABAS.map(({ situacao, label }) => (
            <button
              key={situacao}
              type="button"
              className={`pill-toggle__item${abaAtual === situacao ? " pill-toggle__item--active" : ""}`}
              aria-pressed={abaAtual === situacao}
              onClick={() => setAba(situacao)}
            >
              {label} ({contagem[situacao]})
            </button>
          ))}
        </nav>
      )}

      {solicitacoes.length > 0 && daAba.length === 0 && (
        <p className="text-muted">Nenhum pedido nesta situação.</p>
      )}

      {/* Mesmo cartão dos pedidos do painel (28/10/2026), com os contatos liberados embaixo. */}
      <ul className="list-plain pedidos-lista">
        {daAba.map((s) => (
          <li key={s.id} className={`pedido-mini pedido-mini--${s.situacao} pedido-cheio`}>
            <Link to={`/advogados/${s.advogadoId}`} className="pedido-mini__topo">
              <Avatar nome={s.advogadoNome} foto={s.advogadoFoto} seed={s.advogadoId} />
              <span className="pedido-mini__info">
                <strong>{s.advogadoNome || "Advogado"}</strong>
                <span className="pedido-mini__caso">
                  {LABEL_AREA[s.area] || s.area}
                  {s.especialidade && rotulos[s.especialidade] ? ` · ${rotulos[s.especialidade]}` : ""}
                </span>
              </span>
            </Link>
            <span className="pedido-mini__rodape">
              <span className="pedido-mini__situacao">
                <span className="pedido-mini__ponto" aria-hidden="true" />
                {LABEL_SITUACAO_CLIENTE[s.situacao]}
              </span>
              <span className="pedido-mini__data">Pedido em {formatarData(s.createdAt)}</span>
            </span>
            {s.situacao === "aceita" && <ContatosLiberados contatos={s.contatos} />}
            {s.situacao === "recusada" && s.triagemId && (
              <Link to={`/triagem/${s.triagemId}`} className="button button--secondary">
                Ver outros advogados para o mesmo caso
              </Link>
            )}
          </li>
        ))}
      </ul>
    </main>
  );
}
