import { Link } from "react-router-dom";
import { AreaIcon } from "../../components/AreaIcon/AreaIcon";
import { Avatar } from "../../components/Avatar/Avatar";
import { Button } from "../../components/Button/Button";
import { Loading } from "../../components/Loading/Loading";
import { OwlIllustration } from "../../components/OwlIllustration/OwlIllustration";
import { api } from "../../lib/api";
import { useCarregar } from "../../lib/useCarregar";

const LABEL_AREA = {
  civel: "Cível",
  trabalhista: "Trabalhista",
  indefinido: "Não identificada",
};

async function buscarPainel() {
  const [usuario, triagens, contatos] = await Promise.all([
    api.get("/users/me"),
    api.get("/triagem/historico"),
    api.get("/contatos/meus"),
  ]);
  return { usuario, triagens, contatos };
}

export function PainelPage() {
  const { dado, erro } = useCarregar(buscarPainel);

  if (erro) return <p role="alert">{erro}</p>;
  if (!dado) return <Loading>Carregando...</Loading>;

  const { usuario, triagens, contatos } = dado;
  const primeiroNome = (usuario.nome || usuario.email || "").split(" ")[0];
  const ultimasTriagens = (triagens || []).slice(0, 3);
  const ultimosContatos = (contatos || []).slice(0, 3);

  return (
    <main>
      <h1>
        Olá, <em className="accent">{primeiroNome}</em>
      </h1>
      <p className="text-muted">
        Este é o seu painel. Daqui você faz uma nova triagem ou acompanha as que já fez.
      </p>

      <section className="hero-block hero-block--dark hero-cta">
        <OwlIllustration className="hero-block__owl-mark" />
        <span className="eyebrow">Novo caso?</span>
        <h2>
          Fale com o advogado <em className="accent">certo</em>
        </h2>
        <p>
          Responda algumas perguntas e descreva seu caso — a gente indica a área certa e
          advogados compatíveis.
        </p>
        <Link to="/triagem">
          <Button>
            Fazer triagem <span className="button__arrow">→</span>
          </Button>
        </Link>
      </section>

      <div className="section-heading">
        <h2>Suas últimas triagens</h2>
        {ultimasTriagens.length > 0 && <Link to="/minhas-triagens">Ver todas</Link>}
      </div>

      {ultimasTriagens.length === 0 && (
        <p className="text-muted">Você ainda não fez nenhuma triagem.</p>
      )}

      {ultimasTriagens.length > 0 && (
        <ul className="list-plain">
          {ultimasTriagens.map((t) => (
            <li key={t.id}>
              <Link to={`/triagem/${t.id}`} className="list-row">
                <AreaIcon area={t.areaClassificada} />
                <span className="list-row__info">
                  <span className="list-row__title">
                    {LABEL_AREA[t.areaClassificada] || t.areaClassificada}
                  </span>
                  <span className="list-row__meta">
                    {t.tipoAdvogadoSugerido} · {(t.advogadosSugeridos || []).length} advogado
                    {(t.advogadosSugeridos || []).length === 1 ? "" : "s"} ·{" "}
                    {new Date(t.createdAt).toLocaleDateString("pt-BR")}
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

      {ultimosContatos.length > 0 && (
        <>
          <div className="section-heading">
            <h2>Advogados que você contatou</h2>
            <Link to="/meus-contatos">Ver todos</Link>
          </div>
          <ul className="list-plain">
            {ultimosContatos.map((c) => (
              <li key={c.advogadoId}>
                <Link to={`/advogados/${c.advogadoId}`} className="list-row">
                  <Avatar nome={c.advogadoNome} foto={c.advogadoFoto} seed={c.advogadoId} />
                  <span className="list-row__info">
                    <span className="list-row__title">{c.advogadoNome || "Advogado"}</span>
                    <span className="list-row__meta">{c.status || "Sem etiqueta ainda"}</span>
                  </span>
                  <span className="advogado-row__chevron" aria-hidden="true">
                    ›
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}

      <div className="section-heading">
        <h2>Minha conta</h2>
      </div>
      <Link to="/perfil" className="list-row">
        <Avatar nome={usuario.nome} seed={usuario.uid || usuario.email} />
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
