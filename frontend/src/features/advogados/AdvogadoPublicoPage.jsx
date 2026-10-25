import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Avatar } from "../../components/Avatar/Avatar";
import { EsqueletoPerfil } from "../../components/Esqueleto/Esqueleto";
import { SeloOab } from "../../components/SeloOab/SeloOab";
import { useAuth } from "../auth/AuthContext";
import { api } from "../../lib/api";
import { useCarregar } from "../../lib/useCarregar";
import { useTitulo } from "../../lib/useTitulo";
import "./AdvogadoPublicoPage.css";
import { LABEL_AREA_CURTO } from "../../lib/areas";

const LABEL_AREA = LABEL_AREA_CURTO;

// Bloco do currículo — só aparece se tiver item (antes eram 4 "Nada cadastrado ainda.").
function BlocoCurriculo({ titulo, itens }) {
  if (!itens || itens.length === 0) return null;
  return (
    <div className="perfil-adv__bloco">
      <h3>{titulo}</h3>
      <ul>
        {itens.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

export function AdvogadoPublicoPage() {
  const { uid } = useParams();
  const { user, role } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const triagemId = searchParams.get("triagemId");
  const { dado, erro } = useCarregar(async () => {
    const [advogado, curriculo, perguntas] = await Promise.all([
      api.get(`/advogados/${uid}`),
      api.get(`/curriculos/${uid}`).catch(() => null),
      api.get("/triagem/perguntas"),
    ]);
    return { advogado, curriculo, catalogoCategorias: perguntas.categorias };
  }, [uid], { chave: `advogado:${uid}` });

  useTitulo(
    dado?.advogado
      ? `${dado.advogado.nome}, ${dado.advogado.localizacao?.cidade || "?"}/${dado.advogado.localizacao?.uf || "?"}`
      : "Advogado",
  );

  if (erro) return <p role="alert">{erro}</p>;
  if (!dado) return <EsqueletoPerfil />;

  const { advogado, curriculo, catalogoCategorias } = dado;

  const rotulosEspecialidades = (advogado.especialidades || []).map((valor) => {
    const todas = Object.values(catalogoCategorias || {}).flat();
    return todas.find((c) => c.valor === valor)?.label || valor;
  });

  const temCurriculo = ["formacao", "especializacoes", "cursos", "experiencias"].some(
    (chave) => (curriculo?.[chave] || []).length > 0,
  );
  const linkContato = `/advogados/${uid}/contato${triagemId ? `?triagemId=${triagemId}` : ""}`;

  // Layout de "página de detalhe" (referência do time: tela Detail do app de café) —
  // cartão de identidade no topo, conteúdo em blocos e a ação principal numa barra fixa
  // embaixo, sempre à mão (antes o "Pedir contato" ficava perdido no meio da página).
  return (
    <main className="perfil-adv">
      <button type="button" className="perfil-adv__voltar" onClick={() => navigate(-1)}>
        ← Voltar
      </button>

      <div className="perfil-adv__grade">
        <section className="perfil-adv__cartao">
          <Avatar nome={advogado.nome} foto={advogado.foto} seed={uid} className="perfil-adv__foto" />
          <h1>{advogado.nome}</h1>
          <p className="perfil-adv__local">
            {advogado.areasAtuacao?.map((a) => LABEL_AREA[a] || a).join(" · ") || "Área não informada"} ·{" "}
            {advogado.localizacao?.cidade || "?"}/{advogado.localizacao?.uf || "?"}
          </p>
          <div className="perfil-adv__selos">
            <SeloOab advogado={advogado} />
            <span className="badge">
              OAB {advogado.oab?.numero}/{advogado.oab?.uf}
            </span>
          </div>
        </section>

        <div className="perfil-adv__conteudo">
          {advogado.bio && (
            <section className="card">
              <h2>Sobre</h2>
              <p className="perfil-adv__bio">{advogado.bio}</p>
            </section>
          )}

          {rotulosEspecialidades.length > 0 && (
            <section className="card">
              <h2>Especialidades</h2>
              {/* Página de detalhe: mostra todas, sem truncar em 3 + "+N" como o card. */}
              <ul className="chip-list">
                {rotulosEspecialidades.map((rotulo, i) => (
                  <li key={rotulo} className={`chip${i === 0 ? " chip--destaque" : ""}`}>
                    {rotulo}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="card">
            <h2>Currículo</h2>
            {temCurriculo ? (
              <div className="perfil-adv__curriculo">
                <BlocoCurriculo titulo="Formação" itens={curriculo?.formacao} />
                <BlocoCurriculo titulo="Especializações" itens={curriculo?.especializacoes} />
                <BlocoCurriculo titulo="Cursos" itens={curriculo?.cursos} />
                <BlocoCurriculo titulo="Experiências" itens={curriculo?.experiencias} />
              </div>
            ) : (
              <p className="text-muted" style={{ margin: 0 }}>
                Este advogado ainda não preencheu o currículo.
              </p>
            )}
          </section>
        </div>
      </div>

      {/* O WhatsApp/e-mail não aparecem no perfil: o cliente pede contato e eles só são
          liberados quando o advogado aceita (RF010). */}
      {role === "cliente" && (
        <div className="perfil-adv__barra">
          <span>
            <strong>Gostou do perfil?</strong>
            <span>Ele recebe seu caso e responde por aqui.</span>
          </span>
          <Link to={linkContato} className="button button--primary">
            Pedir contato <span className="button__arrow">→</span>
          </Link>
        </div>
      )}
      {!user && (
        <div className="perfil-adv__barra">
          <span>
            <strong>Quer falar com este advogado?</strong>
            <span>Crie sua conta grátis e conte seu caso.</span>
          </span>
          <Link to="/cadastro" className="button button--primary">
            Criar conta grátis
          </Link>
        </div>
      )}
    </main>
  );
}
