import { Link, Navigate } from "react-router-dom";
import { AreaIcon } from "../../components/AreaIcon/AreaIcon";
import { Avatar } from "../../components/Avatar/Avatar";
import { Loading } from "../../components/Loading/Loading";
import { api } from "../../lib/api";
import { textoLocalizacao } from "../../lib/localizacao";
import { oabAprovada } from "../../lib/situacaoOab";
import { LABEL_AREA, LABEL_SITUACAO_CLIENTE, rotulosEspecialidades } from "../../lib/solicitacoes";
import { useCarregar } from "../../lib/useCarregar";
import { useTitulo } from "../../lib/useTitulo";
import { useAuth } from "../auth/AuthContext";
import { rotaInicial } from "../auth/rotaInicial";
import "./PainelPage.css";

// Foto de banco de imagem (Unsplash, mesma da seção de serviços da Home).
const FOTO_DESTAQUE =
  "https://images.unsplash.com/photo-1631217875019-8cb2649c3478?auto=format&fit=crop&w=720&h=560&q=75";

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
      <Avatar nome={advogado.nome} foto={advogado.foto} seed={advogado.uid} className="prateleira__foto" />
      <strong className="prateleira__nome">{advogado.nome}</strong>
      <span className="prateleira__meta">{textoLocalizacao(advogado.localizacao)}</span>
      {oabAprovada(advogado) && <span className="prateleira__selo">OAB verificada</span>}
    </Link>
  );
}

function Prateleira({ titulo, verTodos, classeTrilho = "", children }) {
  return (
    <section className="prateleira">
      <div className="section-heading">
        <h2>{titulo}</h2>
        {verTodos}
      </div>
      <ul className={`prateleira__trilho ${classeTrilho}`}>{children}</ul>
    </section>
  );
}

// Painel do cliente: o que fazer agora (triagem / acompanhar pedidos) e advogados
// compatíveis em prateleiras deslizantes. Critérios só objetivos — assunto do caso e
// cidade —, nunca popularidade.
export function PainelPage() {
  useTitulo("Painel");
  const { role } = useAuth();
  // Painel é só do cliente — advogado/admin que caírem aqui (link antigo, URL digitada)
  // vão pra própria tela inicial em vez de levar "Sem permissão" das rotas de cliente.
  if (role && role !== "cliente") return <Navigate to={rotaInicial(role)} replace />;
  return <PainelCliente />;
}

function PainelCliente() {
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

  const qtd = ultima?.advogados.length || 0;

  return (
    <main className="painel">
      <p className="painel__ola">Olá, {primeiroNome}</p>
      <h1 className="painel__titulo">{ultima ? "Seu caso, sem complicação" : "Por onde a gente começa?"}</h1>

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

      {/* Cartão de destaque: a coisa principal da tela, com texto curto e UMA ação. */}
      <section className="destaque">
        <img className="destaque__foto" src={FOTO_DESTAQUE} alt="" loading="lazy" />
        <div className="destaque__corpo">
          {ultima ? (
            <>
              <span className="destaque__etiqueta">
                {LABEL_AREA[ultima.areaClassificada]}
                {especialidadeUltima ? ` · ${especialidadeUltima}` : ""}
              </span>
              <h2 className="destaque__titulo">
                {qtd > 0
                  ? `${qtd} advogado${qtd === 1 ? "" : "s"} pro seu caso`
                  : "Ainda procurando advogado pra você"}
              </h2>
              <p className="destaque__texto">
                {qtd > 0
                  ? "Veja quem atende esse assunto perto de você e peça contato."
                  : "Ninguém da sua região atende esse assunto ainda. Veja o resultado completo."}
              </p>
              <div className="destaque__acoes">
                <Link to={`/triagem/${ultima.id}`} className="button button--primary">
                  Ver advogados <span className="button__arrow">→</span>
                </Link>
                <Link to="/triagem" className="destaque__link">
                  Contar outro caso
                </Link>
              </div>
            </>
          ) : (
            <>
              <span className="destaque__etiqueta">Triagem gratuita · 2 minutos</span>
              <h2 className="destaque__titulo">Conte o que aconteceu. A gente acha o advogado certo.</h2>
              <p className="destaque__texto">Responda algumas perguntas simples, com suas palavras.</p>
              <div className="destaque__acoes">
                <Link to="/triagem" className="button button--primary">
                  Começar triagem <span className="button__arrow">→</span>
                </Link>
              </div>
            </>
          )}
        </div>
      </section>

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

      {solicitacoes.length > 0 && (
        <Prateleira
          titulo="Seus pedidos de contato"
          verTodos={<Link to="/minhas-solicitacoes">Ver todos</Link>}
          classeTrilho="prateleira__trilho--pedidos"
        >
          {solicitacoes.slice(0, 8).map((s) => (
            <li key={s.id}>
              <Link to="/minhas-solicitacoes" className="pedido-mini">
                <Avatar nome={s.advogadoNome} foto={s.advogadoFoto} seed={s.advogadoId} />
                <span className="pedido-mini__info">
                  <strong>{s.advogadoNome || "Advogado"}</strong>
                  <span className={`etiqueta${s.situacao === "aceita" ? " etiqueta--ok" : ""}`}>
                    {LABEL_SITUACAO_CLIENTE[s.situacao]}
                  </span>
                </span>
              </Link>
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
        <ul className="list-plain list-plain--grade">
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

    </main>
  );
}
