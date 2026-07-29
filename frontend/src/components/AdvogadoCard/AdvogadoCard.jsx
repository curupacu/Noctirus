import { Link } from "react-router-dom";
import { corDoAvatar } from "../../lib/avatarColor";

const LABEL_AREA = { civel: "Cível", trabalhista: "Trabalhista" };

// Card de advogado reaproveitado na listagem pública e no resultado da triagem — antes
// cada tela tinha sua própria marcação quase idêntica, com risco de uma ficar pra trás
// num redesign futuro (ver docs/DESIGN.md, "aplique a mudança em todas as páginas").
export function AdvogadoCard({ advogado }) {
  return (
    <Link to={`/advogados/${advogado.uid}`} className="advogado-row">
      <span
        className="avatar-placeholder avatar-placeholder--tinted"
        style={{ background: corDoAvatar(advogado.uid || advogado.nome) }}
      >
        {(advogado.nome || "?").charAt(0).toUpperCase()}
      </span>
      <span className="advogado-row__info">
        <span className="advogado-row__nome">
          {advogado.nome || advogado.uid}
          {advogado.verificado && <span className="badge badge--success">OAB verificada</span>}
          {advogado.especialidadesCompativeis > 0 && <span className="badge">Atua no assunto</span>}
        </span>
        {advogado.bio && <span className="advogado-row__bio">{advogado.bio}</span>}
        <span className="advogado-row__meta">
          {advogado.areasAtuacao?.map((a) => LABEL_AREA[a] || a).join(" · ") || "Área não informada"} —{" "}
          {advogado.localizacao?.cidade}/{advogado.localizacao?.uf}
        </span>
      </span>
      <span className="advogado-row__chevron" aria-hidden="true">
        ›
      </span>
    </Link>
  );
}
