import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Input } from "../../components/Input/Input";
import { api } from "../../lib/api";

const AREAS = [
  { value: "", label: "Todas" },
  { value: "civel", label: "Cível" },
  { value: "trabalhista", label: "Trabalhista" },
];

export function AdvogadosListPage() {
  const [area, setArea] = useState("");
  const [cidade, setCidade] = useState("");
  const [uf, setUf] = useState("");
  const [advogados, setAdvogados] = useState(null);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams();
    if (area) params.set("area", area);
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
  }, [area, cidade, uf]);

  const temFiltro = area || cidade || uf;

  function limpar() {
    setArea("");
    setCidade("");
    setUf("");
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
                  </span>
                  <span className="advogado-row__meta">
                    {adv.areasAtuacao?.join(" · ") || "Área não informada"} — {adv.localizacao?.cidade}/
                    {adv.localizacao?.uf}
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
