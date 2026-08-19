import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { AdvogadoCard } from "../../components/AdvogadoCard/AdvogadoCard";
import { Loading } from "../../components/Loading/Loading";
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

  // Pequena pausa (com a coruja de loading) antes de revelar a lista de advogados —
  // mesmo com a resposta pronta na hora, um instante de "procurando" faz o resultado
  // parecer conquistado, não só carregado (referência: reveal de match do Tinder).
  // Só acontece uma vez por triagem — marcar/desmarcar categoria não deve re-revelar.
  const [revelando, setRevelando] = useState(true);
  const jaRevelou = useRef(false);

  const temResultado = Boolean(resultado);

  useEffect(() => {
    // Depende do booleano `temResultado`, não da referência de `resultado` — o efeito de
    // busca abaixo pode chamar `setResultado` mais de uma vez com objetos diferentes (em
    // StrictMode/dev, o efeito de fetch roda em dobro), o que trocaria a referência de
    // novo e cancelaria o timer no cleanup antes de disparar. Uma vez `true`, o booleano
    // nunca mais muda, então esse efeito só roda de verdade uma vez.
    if (!temResultado || jaRevelou.current) return;
    jaRevelou.current = true;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setRevelando(false);
      return;
    }
    const timer = setTimeout(() => setRevelando(false), 900);
    return () => clearTimeout(timer);
  }, [temResultado]);

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
  if (!resultado) return <Loading>Carregando...</Loading>;

  const opcoesDaArea = catalogoCategorias?.[resultado.areaClassificada] || [];
  const catalogoEspecialidades = Object.fromEntries(
    Object.values(catalogoCategorias || {})
      .flat()
      .map((c) => [c.valor, c.label]),
  );

  function alternarCategoria(valor) {
    setCategorias((atual) => (atual.includes(valor) ? atual.filter((c) => c !== valor) : [...atual, valor]));
  }

  return (
    <main>
      <span className="eyebrow">Triagem concluída</span>
      <h1>
        Resultado da <em className="accent">triagem</em>
      </h1>

      <section className="hero-block hero-reveal">
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
      {advogados && revelando && <Loading>Revelando advogados compatíveis...</Loading>}
      {advogados && !revelando && advogados.length === 0 && (
        <p className="text-muted">Nenhum advogado compatível encontrado ainda.</p>
      )}
      {advogados && !revelando && advogados.length > 0 && (
        <>
          <span className="eyebrow">
            Sua triagem apareceu para {advogados.length} advogado{advogados.length === 1 ? "" : "s"}{" "}
            compatíve{advogados.length === 1 ? "l" : "is"}
          </span>
          <ul className="advogados-lista">
            {advogados.map((adv, i) => (
              <li key={adv.uid} className="step-enter" style={{ animationDelay: `${Math.min(i * 40, 400)}ms` }}>
                <AdvogadoCard advogado={adv} catalogoEspecialidades={catalogoEspecialidades} triagemId={id} />
              </li>
            ))}
          </ul>
        </>
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
