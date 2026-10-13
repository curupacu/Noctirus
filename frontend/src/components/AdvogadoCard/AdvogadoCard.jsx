import { Link } from "react-router-dom";
import { oabAprovada } from "../../lib/situacaoOab";
import { Avatar } from "../Avatar/Avatar";
import { SeloOab } from "../SeloOab/SeloOab";
import "./AdvogadoCard.css";

const LABEL_AREA = { civel: "Cível", trabalhista: "Trabalhista" };

function IconeLocal() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 21s-7-6.2-7-11a7 7 0 1 1 14 0c0 4.8-7 11-7 11Z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

function IconeCheck() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

// Card de advogado da listagem pública e do resultado da triagem. Redesign de 13/10/2026
// (achado do usuário: "foto com um textinho pequeno e um tanto de bolinha, dá preguiça de
// ler"): foto maior, nome grande com o selo da OAB em destaque, bio legível e as
// especialidades numa frase só ("Atende: ...") em vez de vários chips.
// `catalogoEspecialidades` é um mapa valor->label vindo de /triagem/perguntas.
export function AdvogadoCard({ advogado, catalogoEspecialidades = {}, triagemId }) {
  const especialidades = (advogado.especialidades || [])
    .map((valor) => catalogoEspecialidades[valor])
    .filter(Boolean);
  const visiveis = especialidades.slice(0, 2);
  const restantes = especialidades.length - visiveis.length;
  const destino = triagemId
    ? `/advogados/${advogado.uid}?triagemId=${triagemId}`
    : `/advogados/${advogado.uid}`;
  const areas = advogado.areasAtuacao?.map((a) => LABEL_AREA[a] || a).join(" e ");

  return (
    <Link to={destino} className="adv-card">
      <Avatar nome={advogado.nome} foto={advogado.foto} seed={advogado.uid} className="adv-card__foto" />

      <span className="adv-card__corpo">
        <span className="adv-card__nome">{advogado.nome || "Advogado"}</span>
        {oabAprovada(advogado) && (
          <span className="adv-card__selo">
            <SeloOab advogado={advogado} />
          </span>
        )}
        <span className="adv-card__meta">
          <IconeLocal />
          {advogado.localizacao?.cidade}/{advogado.localizacao?.uf}
          {areas ? ` · ${areas}` : ""}
        </span>

        {(advogado.mesmaCidade || advogado.especialidadesCompativeis > 0) && (
          <span className="adv-card__combina">
            {advogado.especialidadesCompativeis > 0 && (
              <span>
                <IconeCheck /> Atua no assunto do seu caso
              </span>
            )}
            {advogado.mesmaCidade && (
              <span>
                <IconeCheck /> Na sua cidade
              </span>
            )}
          </span>
        )}

        {advogado.bio && <span className="adv-card__bio">{advogado.bio}</span>}

        {visiveis.length > 0 && (
          <span className="adv-card__atende">
            <strong>Atende:</strong> {visiveis.join(", ")}
            {restantes > 0 ? ` e mais ${restantes}` : ""}
          </span>
        )}

        <span className="adv-card__cta">
          Ver perfil <span aria-hidden="true">→</span>
        </span>
      </span>
    </Link>
  );
}
