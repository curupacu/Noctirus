import { Link, useParams, useSearchParams } from "react-router-dom";
import { Avatar } from "../../components/Avatar/Avatar";
import { Loading } from "../../components/Loading/Loading";
import { SeloOab } from "../../components/SeloOab/SeloOab";
import { useAuth } from "../auth/AuthContext";
import { api } from "../../lib/api";
import { useCarregar } from "../../lib/useCarregar";
import { useTitulo } from "../../lib/useTitulo";

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
  const { user, role } = useAuth();
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
        <SeloOab advogado={advogado} />
        <span className="badge">
          OAB {advogado.oab?.numero}/{advogado.oab?.uf}
        </span>
        <span className="badge">
          {advogado.areasAtuacao?.map((a) => LABEL_AREA[a] || a).join(" · ") || "área não informada"}
        </span>
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

      {/* O WhatsApp/e-mail não aparecem no perfil: o cliente pede contato e eles só são
          liberados quando o advogado aceita (RF010). */}
      {role === "cliente" && (
        <div className="actions">
          <Link
            to={`/advogados/${uid}/contato${triagemId ? `?triagemId=${triagemId}` : ""}`}
            className="button button--primary"
          >
            Pedir contato <span className="button__arrow">→</span>
          </Link>
        </div>
      )}
      {!user && (
        <div className="card stack">
          <p className="text-muted" style={{ margin: 0 }}>
            Pra pedir contato, crie sua conta grátis e faça a triagem do seu caso — o advogado
            recebe suas respostas e, se aceitar, você recebe o WhatsApp e o e-mail dele.
          </p>
          <div className="actions">
            <Link to="/cadastro" className="button button--primary">
              Criar conta grátis
            </Link>
            <Link to="/login" className="button button--secondary">
              Entrar
            </Link>
          </div>
        </div>
      )}

      <div className="section-heading">
        <h2>Currículo</h2>
      </div>
      <ListaOuVazio titulo="Formação" itens={curriculo?.formacao} />
      <ListaOuVazio titulo="Especializações" itens={curriculo?.especializacoes} />
      <ListaOuVazio titulo="Cursos" itens={curriculo?.cursos} />
      <ListaOuVazio titulo="Experiências" itens={curriculo?.experiencias} />
    </main>
  );
}
