import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { Avatar } from "../../components/Avatar/Avatar";
import { Button } from "../../components/Button/Button";
import { ChoiceCard } from "../../components/ChoiceCard/ChoiceCard";
import { Loading } from "../../components/Loading/Loading";
import { api } from "../../lib/api";
import { textoLocalizacao } from "../../lib/localizacao";
import {
  formatarData,
  LABEL_AREA,
  LABEL_SITUACAO_CLIENTE,
  linkWhatsapp,
  rotulosEspecialidades,
} from "../../lib/solicitacoes";
import { useCarregar } from "../../lib/useCarregar";
import { useTitulo } from "../../lib/useTitulo";

// Contatos do advogado — só aparecem quando o pedido foi aceito (RF010).
export function ContatosLiberados({ contatos }) {
  const whatsapp = linkWhatsapp(contatos?.whatsapp);
  const email = contatos?.email;
  if (!whatsapp && !email) {
    return <p className="text-muted">O advogado ainda não cadastrou WhatsApp nem e-mail.</p>;
  }
  return (
    <div className="actions">
      {whatsapp && (
        <a className="button button--primary" href={whatsapp} target="_blank" rel="noreferrer">
          Chamar no WhatsApp
        </a>
      )}
      {email && (
        <a
          className="button button--secondary"
          href={`mailto:${email}?subject=${encodeURIComponent("Contato via Nocturis")}`}
        >
          Enviar e-mail
        </a>
      )}
    </div>
  );
}

// Pedir contato a um advogado (RF010): o cliente escolhe qual triagem vai junto, vê
// exatamente o que vai ser enviado e precisa autorizar. O WhatsApp/e-mail do advogado só
// aparece depois que ele aceitar — aqui ou em "Minhas solicitações".
export function ContatoAdvogadoPage() {
  const { uid } = useParams();
  const [searchParams] = useSearchParams();
  const { dado, erro } = useCarregar(async () => {
    const [advogado, triagens, solicitacoes, perguntas] = await Promise.all([
      api.get(`/advogados/${uid}`),
      api.get("/triagem/historico"),
      api.get("/solicitacoes/minhas"),
      api.get("/triagem/perguntas"),
    ]);
    return { advogado, triagens, solicitacoes, rotulos: rotulosEspecialidades(perguntas.categorias) };
  }, [uid]);
  const [triagemId, setTriagemId] = useState(searchParams.get("triagemId"));
  const [autoriza, setAutoriza] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erroEnvio, setErroEnvio] = useState(null);
  const [enviada, setEnviada] = useState(null);

  useTitulo(dado?.advogado ? `Pedir contato — ${dado.advogado.nome}` : "Pedir contato");

  // Sem triagem escolhida pela URL, já marca a mais recente que tem área identificada.
  useEffect(() => {
    if (!dado || triagemId) return;
    const primeira = dado.triagens.find((t) => t.areaClassificada !== "indefinido");
    if (primeira) setTriagemId(primeira.id);
  }, [dado, triagemId]);

  async function enviar(e) {
    e.preventDefault();
    setErroEnvio(null);
    setEnviando(true);
    try {
      const solicitacao = await api.post("/solicitacoes", {
        advogadoId: uid,
        triagemId,
        autorizaCompartilhar: autoriza,
      });
      setEnviada(solicitacao);
    } catch (err) {
      setErroEnvio(err.message);
    } finally {
      setEnviando(false);
    }
  }

  if (erro) return <p role="alert">{erro}</p>;
  if (!dado) return <Loading>Carregando...</Loading>;

  const { advogado, triagens, solicitacoes, rotulos } = dado;
  const existente = solicitacoes.find(
    (s) => s.advogadoId === uid && (s.situacao === "pendente" || s.situacao === "aceita"),
  );
  const triagensValidas = triagens.filter((t) => t.areaClassificada !== "indefinido");
  const escolhida = triagensValidas.find((t) => t.id === triagemId);

  return (
    <main>
      <span className="eyebrow">Pedir contato</span>
      <div className="media">
        <Avatar nome={advogado.nome} foto={advogado.foto} seed={uid} className="avatar-placeholder--grande" />
        <span className="stack" style={{ gap: 2 }}>
          <h1 style={{ margin: 0 }}>{advogado.nome}</h1>
          <span className="text-muted">{textoLocalizacao(advogado.localizacao)}</span>
        </span>
      </div>

      {enviada && (
        <div className="card stack" role="status">
          <strong>Pedido enviado!</strong>
          <p className="text-muted" style={{ margin: 0 }}>
            {advogado.nome} recebeu seu pedido e as respostas da triagem. Você vai ser avisado aqui e
            por e-mail quando ele responder — se aceitar, o WhatsApp e o e-mail dele aparecem pra você.
          </p>
          <Link to="/minhas-solicitacoes" className="button button--secondary">
            Ver minhas solicitações
          </Link>
        </div>
      )}

      {!enviada && existente && (
        <div className="card stack">
          <strong>{LABEL_SITUACAO_CLIENTE[existente.situacao]}</strong>
          <p className="text-muted" style={{ margin: 0 }}>
            Você pediu contato em {formatarData(existente.createdAt)}.
            {existente.situacao === "pendente" && " Assim que o advogado responder, você é avisado."}
          </p>
          {existente.situacao === "aceita" && <ContatosLiberados contatos={existente.contatos} />}
        </div>
      )}

      {!enviada && !existente && triagensValidas.length === 0 && (
        <div className="card stack">
          <strong>Faça uma triagem antes de pedir contato</strong>
          <p className="text-muted" style={{ margin: 0 }}>
            O pedido leva as respostas da sua triagem, pra o advogado entender o caso antes de responder.
          </p>
          <Link to="/triagem" className="button button--primary">
            Fazer triagem
          </Link>
        </div>
      )}

      {!enviada && !existente && triagensValidas.length > 0 && (
        <form className="card stack" onSubmit={enviar}>
          {triagensValidas.length > 1 && (
            <div className="input-group">
              <label className="input-label">Qual caso você quer levar pra esse advogado?</label>
              <div className="choice-grid">
                {triagensValidas.slice(0, 5).map((t) => (
                  <ChoiceCard
                    key={t.id}
                    type="radio"
                    name="triagem"
                    label={`${LABEL_AREA[t.areaClassificada]} — ${rotulos[t.especialidade || t.categorias?.[0]] || "assunto geral"}`}
                    description={`Triagem de ${formatarData(t.createdAt)}`}
                    checked={triagemId === t.id}
                    onChange={() => setTriagemId(t.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {escolhida && (
            <div className="stack" style={{ gap: "var(--space-xs)" }}>
              <span className="input-label">O que o advogado vai receber</span>
              <p className="text-muted" style={{ margin: 0, whiteSpace: "pre-line" }}>
                {escolhida.descricao}
              </p>
            </div>
          )}

          <ChoiceCard
            type="checkbox"
            label="Autorizo enviar as respostas da minha triagem pra este advogado"
            description="Sem isso o pedido não é enviado. Seu nome só aparece pro advogado se ele aceitar."
            checked={autoriza}
            onChange={() => setAutoriza((v) => !v)}
          />

          <Button type="submit" disabled={enviando || !autoriza || !escolhida}>
            {enviando ? "Enviando..." : "Enviar pedido de contato"}
          </Button>
          {erroEnvio && <p role="alert">{erroEnvio}</p>}
        </form>
      )}

      <p className="text-muted resultado-proximos-passos">
        <Link to={`/advogados/${uid}`}>Voltar pro perfil</Link>
      </p>
    </main>
  );
}
