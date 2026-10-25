import { useEffect, useRef, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { Avatar } from "../../components/Avatar/Avatar";
import { EsqueletoPainel } from "../../components/Esqueleto/Esqueleto";
import { api } from "../../lib/api";
import { textoLocalizacao } from "../../lib/localizacao";
import { oabAprovada } from "../../lib/situacaoOab";
import { LABEL_AREA, LABEL_SITUACAO_CLIENTE, rotulosEspecialidades } from "../../lib/solicitacoes";
import { useCarregar } from "../../lib/useCarregar";
import { useTitulo } from "../../lib/useTitulo";
import { useAuth } from "../auth/AuthContext";
import { rotaInicial } from "../auth/rotaInicial";
import "./PainelPage.css";
import { AvisoAceite, ModalAceite } from "../../components/AceiteDestaque/AceiteDestaque";
import { AvisosCelular } from "../../components/AvisosCelular/AvisosCelular";
import { CartaoTriagem } from "../../components/CartaoTriagem/CartaoTriagem";

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

function Seta({ direcao }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={direcao === "voltar" ? "M15 18l-6-6 6-6" : "M9 18l6-6-6-6"} />
    </svg>
  );
}

// Vitrine que desliza. No celular passa com o dedo; no computador ganha setas (25/10/2026:
// sem elas o último cartão ficava cortado e não tinha como ver o resto com o mouse).
function Prateleira({ titulo, verTodos, classeTrilho = "", children }) {
  const trilho = useRef(null);
  const [pode, setPode] = useState({ voltar: false, avancar: false });

  useEffect(() => {
    const el = trilho.current;
    if (!el) return undefined;
    const medir = () =>
      setPode({ voltar: el.scrollLeft > 4, avancar: el.scrollLeft + el.clientWidth < el.scrollWidth - 4 });
    medir();
    el.addEventListener("scroll", medir, { passive: true });
    window.addEventListener("resize", medir);
    return () => {
      el.removeEventListener("scroll", medir);
      window.removeEventListener("resize", medir);
    };
  }, [children]);

  function rolar(sentido) {
    const el = trilho.current;
    el.scrollBy({ left: sentido * el.clientWidth * 0.8, behavior: "smooth" });
  }

  return (
    <section className="prateleira">
      <div className="section-heading">
        <h2>{titulo}</h2>
        <div className="prateleira__acoes">
          {verTodos}
          {(pode.voltar || pode.avancar) && (
            <span className="prateleira__setas">
              <button type="button" onClick={() => rolar(-1)} disabled={!pode.voltar} aria-label="Ver anteriores">
                <Seta direcao="voltar" />
              </button>
              <button type="button" onClick={() => rolar(1)} disabled={!pode.avancar} aria-label="Ver próximos">
                <Seta direcao="avancar" />
              </button>
            </span>
          )}
        </div>
      </div>
      <ul ref={trilho} className={`prateleira__trilho ${classeTrilho}`}>
        {children}
      </ul>
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
  if (!dado) return <EsqueletoPainel />;

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

      {/* Advogado aceitou: tela de destaque (uma vez) + cartão no topo do painel (com X). */}
      <ModalAceite solicitacoes={solicitacoes} />
      <AvisoAceite solicitacoes={solicitacoes} />
      <AvisosCelular papel="cliente" />

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
              <Link to="/minhas-solicitacoes" className={`pedido-mini pedido-mini--${s.situacao}`}>
                <span className="pedido-mini__topo">
                  <Avatar nome={s.advogadoNome} foto={s.advogadoFoto} seed={s.advogadoId} />
                  <span className="pedido-mini__info">
                    <strong>{s.advogadoNome || "Advogado"}</strong>
                    <span className="pedido-mini__caso">
                      {LABEL_AREA[s.area] || "Caso"}
                      {rotulos[s.especialidade] ? ` · ${rotulos[s.especialidade]}` : ""}
                    </span>
                  </span>
                </span>
                <span className="pedido-mini__rodape">
                  <span className="pedido-mini__situacao">
                    <span className="pedido-mini__ponto" aria-hidden="true" />
                    {LABEL_SITUACAO_CLIENTE[s.situacao]}
                  </span>
                  {s.createdAt && (
                    <span className="pedido-mini__data">{new Date(s.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}</span>
                  )}
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
        <ul className="lista-triagens">
          {ultimasTriagens.map((t) => (
            <li key={t.id}>
              <CartaoTriagem triagem={t} rotulos={rotulos} />
            </li>
          ))}
        </ul>
      )}

    </main>
  );
}
