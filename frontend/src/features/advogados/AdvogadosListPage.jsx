import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Input } from "../../components/Input/Input";
import { api } from "../../lib/api";

const AREAS = [
  { value: "", label: "Todas" },
  { value: "civel", label: "Cível" },
  { value: "trabalhista", label: "Trabalhista" },
];

const LABEL_AREA = { civel: "Cível", trabalhista: "Trabalhista" };

export function AdvogadosListPage() {
  const [area, setArea] = useState("");
  const [categorias, setCategorias] = useState([]);
  const [catalogoCategorias, setCatalogoCategorias] = useState(null);
  const [cidade, setCidade] = useState("");
  const [uf, setUf] = useState("");
  const [advogados, setAdvogados] = useState(null);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    api.get("/triagem/perguntas").then((dados) => setCatalogoCategorias(dados.categorias));
  }, []);

  // Assunto específico só faz sentido depois de escolher a área (as subcategorias são
  // diferentes por área) — trocar de área descarta a seleção anterior.
  useEffect(() => {
    setCategorias([]);
  }, [area]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (area) params.set("area", area);
    if (categorias.length) params.set("categorias", categorias.join(","));
    if (cidade.trim()) params.set("cidade", cidade.trim());
    if (uf.trim()) params.set("uf", uf.trim());
    const query = params.toString();

    const timer = setTimeout(() => {
      api
        .get(`/advogados${query ? `?${query}` : ""}`)
        .then(setAdvogados)
        .catch((err) => setErro(err.message));
    }, 300);

    return () => clearTimeout(timer);
  }, [area, categorias, cidade, uf]);

  const temFiltro = area || cidade || uf;
  const opcoesDaArea = (area && catalogoCategorias?.[area]) || [];

  function limpar() {
    setArea("");
    setCidade("");
    setUf("");
  }

  function alternarCategoria(valor) {
    setCategorias((atual) => (atual.includes(valor) ? atual.filter((c) => c !== valor) : [...atual, valor]));
  }

  return (
    <main>
      <h1>Advogados</h1>
      <p className="text-muted advogados-subtitulo">Busque por área ou cidade, sem precisar criar conta.</p>

      <div className="advogados-filtros">
        <div className="pill-toggle">
          {AREAS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={`pill-toggle__item${area === opt.value ? " pill-toggle__item--active" : ""}`}
              onClick={() => setArea(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {opcoesDaArea.length > 0 && (
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
        )}

        <div className="row">
          <Input label="Cidade" id="cidade" placeholder="Ex.: São Paulo" value={cidade} onChange={(e) => setCidade(e.target.value)} />
          <Input label="UF" id="uf" placeholder="Ex.: SP" value={uf} onChange={(e) => setUf(e.target.value)} maxLength={2} />
        </div>

        {temFiltro && (
          <button type="button" className="advogados-limpar" onClick={limpar}>
            Limpar filtros
          </button>
        )}
      </div>

      {erro && <p role="alert">{erro}</p>}
      {!advogados && !erro && <p className="loading">Carregando...</p>}

      {advogados && advogados.length === 0 && (
        <p className="text-muted">Nenhum advogado encontrado com esses filtros.</p>
      )}

      {advogados && advogados.length > 0 && (
        <ul className="advogados-lista">
          {advogados.map((adv) => (
            <li key={adv.uid}>
              <Link to={`/advogados/${adv.uid}`} className="advogado-row">
                <span className="avatar-placeholder">{(adv.nome || "?").charAt(0).toUpperCase()}</span>
                <span className="advogado-row__info">
                  <span className="advogado-row__nome">
                    {adv.nome || adv.uid}
                    {adv.verificado && <span className="badge">OAB verificada</span>}
                    {adv.especialidadesCompativeis > 0 && (
                      <span className="badge">Atua no assunto</span>
                    )}
                  </span>
                  <span className="advogado-row__meta">
                    {adv.areasAtuacao?.map((a) => LABEL_AREA[a] || a).join(" · ") || "Área não informada"} —{" "}
                    {adv.localizacao?.cidade}/{adv.localizacao?.uf}
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
