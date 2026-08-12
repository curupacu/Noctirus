import { Link } from "react-router-dom";
import { Avatar } from "../Avatar/Avatar";

const LABEL_AREA = { civel: "Cível", trabalhista: "Trabalhista" };

// Card de advogado reaproveitado na listagem pública e no resultado da triagem — antes
// cada tela tinha sua própria marcação quase idêntica, com risco de uma ficar pra trás
// num redesign futuro (ver docs/DESIGN.md, "aplique a mudança em todas as páginas").
//
// Virou um card maior (era uma linha fina) — achado do usuário, 11/08: a linha só com
// nome/cidade não dava vontade de clicar, todo advogado parecia igual. Agora mostra bio
// (2 linhas) e as especialidades como chips, reaproveitando os mesmos `.chip`/
// `.chip--destaque`/`.chip--overflow` já usados no perfil público do advogado.
// `catalogoEspecialidades` é um mapa valor->label (a página que usa o card já busca o
// catálogo de categorias em /triagem/perguntas pra outra coisa; aqui só reaproveita).
export function AdvogadoCard({ advogado, catalogoEspecialidades = {} }) {
  const especialidades = (advogado.especialidades || [])
    .map((valor) => catalogoEspecialidades[valor])
    .filter(Boolean);
  const especialidadesVisiveis = especialidades.slice(0, 3);
  const especialidadesRestantes = especialidades.length - especialidadesVisiveis.length;

  return (
    <Link to={`/advogados/${advogado.uid}`} className="advogado-card">
      <span className="advogado-card__top">
        <Avatar
          nome={advogado.nome}
          foto={advogado.foto}
          seed={advogado.uid}
          className="advogado-card__avatar avatar-placeholder--grande"
        />
        <span className="advogado-card__heading">
          <span className="advogado-card__nome">{advogado.nome || advogado.uid}</span>
          <span className="advogado-card__meta">
            {advogado.areasAtuacao?.map((a) => LABEL_AREA[a] || a).join(" · ") || "Área não informada"} —{" "}
            {advogado.localizacao?.cidade}/{advogado.localizacao?.uf}
          </span>
          <span className="advogado-card__badges">
            {advogado.verificado && (
              <span className="badge badge--seal">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
                OAB verificada
              </span>
            )}
            {advogado.especialidadesCompativeis > 0 && <span className="badge">Atua no assunto</span>}
            {advogado.vezesSugerido > 0 && (
              <span className="badge">
                Em {advogado.vezesSugerido} {advogado.vezesSugerido === 1 ? "triagem" : "triagens"}
              </span>
            )}
          </span>
        </span>
        <span className="advogado-row__chevron" aria-hidden="true">
          ›
        </span>
      </span>

      {advogado.bio && <p className="advogado-card__bio">{advogado.bio}</p>}

      {especialidadesVisiveis.length > 0 && (
        <span className="chip-list">
          {especialidadesVisiveis.map((label, i) => (
            <span key={label} className={`chip${i === 0 ? " chip--destaque" : ""}`}>
              {label}
            </span>
          ))}
          {especialidadesRestantes > 0 && (
            <span className="chip chip--overflow">+{especialidadesRestantes}</span>
          )}
        </span>
      )}
    </Link>
  );
}
