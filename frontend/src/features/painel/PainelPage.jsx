import { Link } from "react-router-dom";
import { AreaIcon } from "../../components/AreaIcon/AreaIcon";
import { Avatar } from "../../components/Avatar/Avatar";
import { Button } from "../../components/Button/Button";
import { Loading } from "../../components/Loading/Loading";
import { OwlIllustration } from "../../components/OwlIllustration/OwlIllustration";
import { api } from "../../lib/api";
import { textoLocalizacao } from "../../lib/localizacao";
import { oabAprovada } from "../../lib/situacaoOab";
import { LABEL_AREA, LABEL_SITUACAO_CLIENTE, rotulosEspecialidades } from "../../lib/solicitacoes";
import { useCarregar } from "../../lib/useCarregar";
import { useTitulo } from "../../lib/useTitulo";
import "./PainelPage.css";

function normalizarCidade(cidade) {
  return String(cidade || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toLowerCase();
}

// Ordem neutra que muda todo dia (e é diferente pra cada cliente): ninguém fica fixo no
// topo por popularidade — a vitrine não pode virar ranking entre advogados (Código de Ética
// da OAB: publicidade informativa, sem comparação) e todo mundo, inclusive quem está
// começando, aparece. Hash simples de texto → número.
function ordemDoDia(lista, semente) {
  const hash = (texto) => [...texto].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);
  return [...lista].sort((a, b) => hash(semente + a.uid) - hash(semente + b.uid));
}

async function buscarPainel() {
  const [usuario, triagens, solicitacoes, perguntas] = await Promise.all([
    api.get("/users/me"),
    api.get("/triagem/historico"),
    api.get("/solicitacoes/minhas"),
    api.get("/triagem/perguntas"),
  ]);

  const ultima = triagens.find((t) => t.areaClassificada !== "indefinido") || null;
  const uf = usuario.localizacao?.uf;
  const [resultadoUltima, daRegiao] = await Promise.all([
    ultima ? api.get(`/triagem/${ultima.id}`).catch(() => null) : null,
    uf ? api.get(`/advogados?uf=${encodeURIComponent(uf)}`).catch(() => []) : [],
  ]);

  return {
    usuario,
    triagens,
    solicitacoes,
    ultima: ultima && resultadoUltima ? { ...ultima, advogados: resultadoUltima.advogados || [] } : null,
    daRegiao,
    rotulos: rotulosEspecialidades(perguntas.categorias),
  };
}

function CartaoAdvogadoMini({ advogado, triagemId }) {
  const destino = triagemId ? `/advogados/${advogado.uid}?triagemId=${triagemId}` : `/advogados/${advogado.uid}`;
  return (
    <Link to={destino} className="prateleira__item">
      <Avatar nome={advogado.nome} foto={advogado.foto} seed={advogado.uid} className="avatar-placeholder--grande" />
      <strong className="prateleira__nome">{advogado.nome}</strong>
      <span className="prateleira__meta">{textoLocalizacao(advogado.localizacao)}</span>
      {oabAprovada(advogado) && <span className="prateleira__selo">OAB verificada</span>}
    </Link>
  );
}

function Prateleira({ titulo, verTodos, children }) {
  return (
    <section className="prateleira">
      <div className="section-heading">
        <h2>{titulo}</h2>
        {verTodos}
      </div>
      <ul className="prateleira__trilho">{children}</ul>
    </section>
  );
}

// Painel do cliente: o que fazer agora (triagem / acompanhar pedidos) e advogados
// compatíveis em prateleiras deslizantes. Critérios só objetivos — assunto do caso e
// cidade —, nunca popularidade.
export function PainelPage() {
  useTitulo("Painel");
  const { dado, erro } = useCarregar(buscarPainel);

  if (erro) return <p role="alert">{erro}</p>;
  if (!dado) return <Loading>Carregando...</Loading>;

  const { usuario, triagens, solicitacoes, ultima, daRegiao, rotulos } = dado;
  const primeiroNome = (usuario.nome || usuario.email || "").split(" ")[0];
  const ultimasTriagens = triagens.slice(0, 3);
  const especialidadeUltima = ultima && rotulos[ultima.especialidade || ultima.categorias?.[0]];

  const hoje = new Date().toISOString().slice(0, 10);
  const cidadeCliente = normalizarCidade(usuario.localizacao?.cidade);
  const daMinhaCidade = ordemDoDia(
    daRegiao.filter((a) => normalizarCidade(a.localizacao?.cidade) === cidadeCliente),
    hoje + usuario.uid,
  );
  const doMeuEstado = ordemDoDia(
    daRegiao.filter((a) => normalizarCidade(a.localizacao?.cidade) !== cidadeCliente),
    hoje + usuario.uid,
  );
  const pertoDeMim = [...daMinhaCidade, ...doMeuEstado].slice(0, 10);

  return (
    <main>
      <h1>
        Olá, <em className="accent">{primeiroNome}</em>
      </h1>

      {/* Conta criada antes da cidade/UF virar obrigatória (outubro/2026) — sem isso o
          resultado da triagem não tem como mostrar advogados perto da pessoa. */}
      {!usuario.localizacao?.cidade && (
        <div className="card stack">
          <strong>Falta informar sua cidade</strong>
          <p className="text-muted" style={{ margin: 0 }}>
            Com ela, mostramos primeiro os advogados que atendem perto de você.
          </p>
          <Link to="/perfil" className="button button--secondary">
            Informar minha cidade
          </Link>
        </div>
      )}

      <section className="hero-block hero-block--dark hero-cta">
        <OwlIllustration className="hero-block__owl-mark" />
        {ultima ? (
          <>
            <span className="eyebrow">Sua última triagem</span>
            <h2>
              {LABEL_AREA[ultima.areaClassificada]}
              {especialidadeUltima ? ` — ${especialidadeUltima}` : ""}
            </h2>
            <p>
              {ultima.advogados.length > 0
                ? `${ultima.advogados.length} advogado${ultima.advogados.length === 1 ? "" : "s"} compatíve${ultima.advogados.length === 1 ? "l" : "is"} com o seu caso.`
                : "Ainda não achamos advogado compatível na sua região."}
            </p>
            <div className="actions">
              <Link to={`/triagem/${ultima.id}`}>
                <Button>
                  Ver resultado <span className="button__arrow">→</span>
                </Button>
              </Link>
              <Link to="/triagem">
                <Button variant="secondary">Novo caso</Button>
              </Link>
            </div>
          </>
        ) : (
          <>
            <span className="eyebrow">Comece por aqui</span>
            <h2>
              Fale com o advogado <em className="accent">certo</em>
            </h2>
            <p>Conte o que aconteceu com suas palavras — a gente identifica a área e mostra quem atende.</p>
            <Link to="/triagem">
              <Button>
                Fazer triagem <span className="button__arrow">→</span>
              </Button>
            </Link>
          </>
        )}
      </section>

      {solicitacoes.length > 0 && (
        <Prateleira
          titulo="Suas solicitações"
          verTodos={<Link to="/minhas-solicitacoes">Ver todas</Link>}
        >
          {solicitacoes.slice(0, 8).map((s) => (
            <li key={s.id}>
              <Link to="/minhas-solicitacoes" className="prateleira__item">
                <Avatar nome={s.advogadoNome} foto={s.advogadoFoto} seed={s.advogadoId} />
                <strong className="prateleira__nome">{s.advogadoNome || "Advogado"}</strong>
                <span className={`badge${s.situacao === "aceita" ? " badge--seal" : ""}`}>
                  {LABEL_SITUACAO_CLIENTE[s.situacao]}
                </span>
              </Link>
            </li>
          ))}
        </Prateleira>
      )}

      {ultima && ultima.advogados.length > 0 && (
        <Prateleira
          titulo={`Pro seu caso${especialidadeUltima ? `: ${especialidadeUltima}` : ""}`}
          verTodos={<Link to={`/triagem/${ultima.id}`}>Ver todos</Link>}
        >
          {ultima.advogados.slice(0, 10).map((a) => (
            <li key={a.uid}>
              <CartaoAdvogadoMini advogado={a} triagemId={ultima.id} />
            </li>
          ))}
        </Prateleira>
      )}

      {pertoDeMim.length > 0 && (
        <Prateleira
          titulo={`Advogados perto de você (${usuario.localizacao.uf})`}
          verTodos={<Link to="/advogados">Ver todos</Link>}
        >
          {pertoDeMim.map((a) => (
            <li key={a.uid}>
              <CartaoAdvogadoMini advogado={a} />
            </li>
          ))}
        </Prateleira>
      )}

      <div className="section-heading">
        <h2>Suas triagens</h2>
        {ultimasTriagens.length > 0 && <Link to="/minhas-triagens">Ver todas</Link>}
      </div>

      {ultimasTriagens.length === 0 && <p className="text-muted">Você ainda não fez nenhuma triagem.</p>}

      {ultimasTriagens.length > 0 && (
        <ul className="list-plain">
          {ultimasTriagens.map((t) => (
            <li key={t.id}>
              <Link to={`/triagem/${t.id}`} className="list-row">
                <AreaIcon area={t.areaClassificada} />
                <span className="list-row__info">
                  <span className="list-row__title">
                    {LABEL_AREA[t.areaClassificada] || t.areaClassificada}
                    {rotulos[t.especialidade] ? ` — ${rotulos[t.especialidade]}` : ""}
                  </span>
                  <span className="list-row__meta">{new Date(t.createdAt).toLocaleDateString("pt-BR")}</span>
                </span>
                <span className="advogado-row__chevron" aria-hidden="true">
                  ›
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <div className="section-heading">
        <h2>Minha conta</h2>
      </div>
      <Link to="/perfil" className="list-row">
        <Avatar nome={usuario.nome} foto={usuario.foto} seed={usuario.uid || usuario.email} />
        <span className="list-row__info">
          <span className="list-row__title">{usuario.nome}</span>
          <span className="list-row__meta">{usuario.email}</span>
        </span>
        <span className="advogado-row__chevron" aria-hidden="true">
          ›
        </span>
      </Link>
    </main>
  );
}
