import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { AdvogadoCard } from "../../components/AdvogadoCard/AdvogadoCard";
import { OwlMark } from "../../components/OwlMark/OwlMark";
import { api } from "../../lib/api";

const LABEL_AREA = {
  civel: "Cível",
  trabalhista: "Trabalhista",
  indefinido: "Não identificada",
};

export function ResultadoPage() {
  const { id } = useParams();
  const location = useLocation();
  const [resultado, setResultado] = useState(location.state?.resultado || null);
  const [erro, setErro] = useState(null);
  const [catalogoCategorias, setCatalogoCategorias] = useState(null);
  const [categorias, setCategorias] = useState(resultado?.categorias || []);
  const [advogados, setAdvogados] = useState(resultado?.advogados || null);

  useEffect(() => {
    if (resultado) return;
    api
      .get(`/triagem/${id}`)
      .then((dados) => {
        setResultado(dados);
        setCategorias(dados.categorias || []);
        setAdvogados(dados.advogados || []);
      })
      .catch((err) => setErro(err.message));
  }, [id, resultado]);

  useEffect(() => {
    api.get("/triagem/perguntas").then((dados) => setCatalogoCategorias(dados.categorias));
  }, []);

  // Marcar/desmarcar categorias reordena a lista de advogados abaixo, priorizando quem
  // tem `especialidades` compatíveis com o que o cliente ajustou — senão os pills ficavam
  // clicáveis sem nenhum efeito visível.
  useEffect(() => {
    if (!resultado || resultado.areaClassificada === "indefinido") return;
    const params = new URLSearchParams({ area: resultado.areaClassificada });
    if (categorias.length) params.set("categorias", categorias.join(","));
    api.get(`/advogados?${params.toString()}`).then(setAdvogados);
  }, [categorias, resultado]);

  if (erro) return <p role="alert">{erro}</p>;
  if (!resultado) return <p className="loading">Carregando...</p>;

  const opcoesDaArea = catalogoCategorias?.[resultado.areaClassificada] || [];

  function alternarCategoria(valor) {
    setCategorias((atual) => (atual.includes(valor) ? atual.filter((c) => c !== valor) : [...atual, valor]));
  }

  return (
    <main>
      <span className="eyebrow">Triagem concluída</span>
      <h1>
        Resultado da <em className="accent">triagem</em>
      </h1>

      <section className="hero-block">
        <OwlMark className="hero-block__owl-mark" />
        <span className="badge badge--gold">
          {resultado.origem === "ia" ? "Classificado por IA" : "Classificado por regras"}
        </span>
        <p>
          <strong>Área:</strong> {LABEL_AREA[resultado.areaClassificada] || resultado.areaClassificada}
        </p>
        <p>
          <strong>Recomendação:</strong> {resultado.tipoAdvogadoSugerido}
        </p>
        {resultado.justificativa && <p>{resultado.justificativa}</p>}
      </section>

      {opcoesDaArea.length > 0 && (
        <section className="card">
          <h2>Categorias identificadas no seu caso</h2>
          <p className="text-muted">Toque pra marcar ou desmarcar o que se aplica ao seu caso.</p>

          <div className="pill-toggle">
            {opcoesDaArea.map((c) => {
              const selecionada = categorias.includes(c.valor);
              return (
                <button
                  key={c.valor}
                  type="button"
                  className={`pill-toggle__item${selecionada ? " pill-toggle__item--active" : ""}`}
                  aria-pressed={selecionada}
                  onClick={() => alternarCategoria(c.valor)}
                >
                  {c.label}
                </button>
              );
            })}
          </div>
        </section>
      )}

      <div className="section-heading">
        <h2>Advogados compatíveis</h2>
      </div>
      {advogados?.length === 0 && <p className="text-muted">Nenhum advogado compatível encontrado ainda.</p>}
      {advogados?.length > 0 && (
        <ul className="advogados-lista">
          {advogados.map((adv) => (
            <li key={adv.uid}>
              <AdvogadoCard advogado={adv} />
            </li>
          ))}
        </ul>
      )}

      <ul className="list-plain resultado-proximos-passos">
        <li>
          <Link to="/triagem" className="list-row">
            <span className="list-row__title">Fazer nova triagem</span>
            <span className="advogado-row__chevron" aria-hidden="true">›</span>
          </Link>
        </li>
        <li>
          <Link to="/minhas-triagens" className="list-row">
            <span className="list-row__title">Minhas triagens</span>
            <span className="advogado-row__chevron" aria-hidden="true">›</span>
          </Link>
        </li>
      </ul>
    </main>
  );
}
