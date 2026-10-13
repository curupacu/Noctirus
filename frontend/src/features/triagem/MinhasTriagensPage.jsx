import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AreaIcon } from "../../components/AreaIcon/AreaIcon";
import { Loading } from "../../components/Loading/Loading";
import { api } from "../../lib/api";
import { rotulosEspecialidades } from "../../lib/solicitacoes";
import { useTitulo } from "../../lib/useTitulo";
import { LABEL_AREA } from "../../lib/areas";



export function MinhasTriagensPage() {
  useTitulo("Minhas triagens");
  const [triagens, setTriagens] = useState(null);
  const [erro, setErro] = useState(null);
  const [rotulos, setRotulos] = useState({});

  useEffect(() => {
    api.get("/triagem/historico").then(setTriagens).catch((err) => setErro(err.message));
    api
      .get("/triagem/perguntas")
      .then((p) => setRotulos(rotulosEspecialidades(p.categorias)))
      .catch(() => {});
  }, []);

  return (
    <main>
      <div className="section-heading">
        <h1 style={{ margin: 0 }}>Minhas triagens</h1>
        <Link to="/triagem">Nova triagem</Link>
      </div>

      {erro && <p role="alert">{erro}</p>}
      {!triagens && !erro && <Loading>Carregando...</Loading>}
      {triagens && triagens.length === 0 && <p>Você ainda não fez nenhuma triagem.</p>}

      {triagens && triagens.length > 0 && (
        <ul className="list-plain">
          {triagens.map((t) => (
            <li key={t.id}>
              <Link to={`/triagem/${t.id}`} className="list-row">
                <AreaIcon area={t.areaClassificada} />
                <span className="list-row__info">
                  {/* Assunto no título (antes repetia "Trabalhista / Advogado trabalhista
                      para..." em todas as linhas). */}
                  <span className="list-row__title">
                    {rotulos[t.especialidade || t.categorias?.[0]] ||
                      LABEL_AREA[t.areaClassificada] ||
                      t.areaClassificada}
                  </span>
                  <span className="list-row__meta">
                    {LABEL_AREA[t.areaClassificada] || t.areaClassificada} ·{" "}
                    {(t.advogadosSugeridos || []).length} advogado
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
    </main>
  );
}
