import { Link, useParams, useSearchParams } from "react-router-dom";
import { Avatar } from "../../components/Avatar/Avatar";
import { Loading } from "../../components/Loading/Loading";
import { api } from "../../lib/api";
import { useCarregar } from "../../lib/useCarregar";
import { useTitulo } from "../../lib/useTitulo";
import { useAuth } from "../auth/AuthContext";
import { FeedbackForm } from "./FeedbackForm";

const LABEL_AREA = {
  civel: "Cível",
  trabalhista: "Trabalhista",
};

function ListaOuVazio({ titulo, itens }) {
  return (
    <section>
      <h3>{titulo}</h3>
      {itens && itens.length > 0 ? (
        <ul className="list-plain">
          {itens.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      ) : (
        <p className="text-muted">Nada cadastrado ainda.</p>
      )}
    </section>
  );
}

export function AdvogadoPublicoPage() {
  const { uid } = useParams();
  const { role } = useAuth();
  const [searchParams] = useSearchParams();
  const triagemId = searchParams.get("triagemId");
  const { dado, erro } = useCarregar(async () => {
    const [advogado, curriculo, perguntas] = await Promise.all([
      api.get(`/advogados/${uid}`),
      api.get(`/curriculos/${uid}`).catch(() => null),
      api.get("/triagem/perguntas"),
    ]);
    return { advogado, curriculo, catalogoCategorias: perguntas.categorias };
  }, [uid]);

  useTitulo(
    dado?.advogado
      ? `${dado.advogado.nome} — ${dado.advogado.localizacao?.cidade || "?"}/${dado.advogado.localizacao?.uf || "?"}`
      : "Advogado",
  );

  if (erro) return <p role="alert">{erro}</p>;
  if (!dado) return <Loading>Carregando...</Loading>;

  const { advogado, curriculo, catalogoCategorias } = dado;

  const suspenso = advogado.status === "suspenso";
  const whatsapp = !suspenso && advogado.contatos?.whatsapp;
  const email = !suspenso && advogado.contatos?.email;
  const rotulosEspecialidades = (advogado.especialidades || []).map((valor) => {
    const todas = Object.values(catalogoCategorias || {}).flat();
    return todas.find((c) => c.valor === valor)?.label || valor;
  });

  return (
    <main>
      <section className="advogado-hero">
        <Avatar nome={advogado.nome} foto={advogado.foto} seed={uid} className="avatar-placeholder--hero" />
        <h1>{advogado.nome}</h1>
        <p className="advogado-hero__local">
          {advogado.localizacao?.cidade || "?"}/{advogado.localizacao?.uf || "?"}
        </p>
        {advogado.bio && <p className="advogado-bio">{advogado.bio}</p>}
      </section>

      <div className="actions">
        {suspenso && <span className="badge badge--danger">Suspenso da plataforma</span>}
        <span className={`badge${advogado.verificado ? " badge--seal" : ""}`}>
          {advogado.verificado && (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M20 6 9 17l-5-5" />
            </svg>
          )}
          {advogado.verificado ? "OAB verificada" : "OAB em análise"}
        </span>
        <span className="badge">
          OAB {advogado.oab?.numero}/{advogado.oab?.uf}
        </span>
        <span className="badge">
          {advogado.areasAtuacao?.map((a) => LABEL_AREA[a] || a).join(" · ") || "área não informada"}
        </span>
        {advogado.vezesSugerido > 0 && (
          <span className="badge">
            Em {advogado.vezesSugerido} {advogado.vezesSugerido === 1 ? "triagem" : "triagens"}
          </span>
        )}
      </div>

      {rotulosEspecialidades.length > 0 && (
        <>
          <div className="section-heading">
            <h2>Especialidades</h2>
          </div>
          {/* Página de perfil completo — diferente do AdvogadoCard (lista/preview), aqui
              mostra todas as especialidades em vez de truncar em 3 + "+N": não tem pra
              onde esse "+N" expandir numa página que já é a própria página de detalhe. */}
          <ul className="chip-list">
            {rotulosEspecialidades.map((rotulo, i) => (
              <li key={rotulo} className={`chip${i === 0 ? " chip--destaque" : ""}`}>
                {rotulo}
              </li>
            ))}
          </ul>
        </>
      )}

      {suspenso && (
        <p className="text-muted">Este advogado está suspenso e não pode ser contatado pela plataforma.</p>
      )}
      {!suspenso && (whatsapp || email) && (
        <div className="actions">
          <Link
            to={`/advogados/${uid}/contato${triagemId ? `?triagemId=${triagemId}` : ""}`}
            className="button button--primary"
          >
            Contatar advogado <span className="button__arrow">→</span>
          </Link>
        </div>
      )}
      {!suspenso && !whatsapp && !email && <p className="text-muted">Nenhum contato cadastrado.</p>}

      {role === "cliente" && (
        <>
          <div className="section-heading">
            <h2>Feedback</h2>
          </div>
          <FeedbackForm uid={uid} />
        </>
      )}

      <div className="section-heading">
        <h2>Currículo</h2>
      </div>
      <ListaOuVazio titulo="Formação" itens={curriculo?.formacao} />
      <ListaOuVazio titulo="Especializações" itens={curriculo?.especializacoes} />
      <ListaOuVazio titulo="Cursos" itens={curriculo?.cursos} />
      <ListaOuVazio titulo="Experiências" itens={curriculo?.experiencias} />

      <p className="text-muted resultado-proximos-passos">
        <Link to={`/denunciar?alvoId=${uid}&alvoNome=${encodeURIComponent(advogado.nome || "")}`}>
          Denunciar este advogado
        </Link>
      </p>
    </main>
  );
}
