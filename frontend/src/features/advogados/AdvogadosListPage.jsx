import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "../../components/Button/Button";
import { Input } from "../../components/Input/Input";
import { Select } from "../../components/Select/Select";
import { api } from "../../lib/api";

export function AdvogadosListPage() {
  const [area, setArea] = useState("");
  const [cidade, setCidade] = useState("");
  const [uf, setUf] = useState("");
  const [advogados, setAdvogados] = useState(null);
  const [erro, setErro] = useState(null);

  function buscar(e) {
    e?.preventDefault();
    const params = new URLSearchParams();
    if (area) params.set("area", area);
    if (cidade) params.set("cidade", cidade);
    if (uf) params.set("uf", uf);

    const query = params.toString();
    api
      .get(`/advogados${query ? `?${query}` : ""}`)
      .then(setAdvogados)
      .catch((err) => setErro(err.message));
  }

  useEffect(() => {
    buscar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function limpar() {
    setArea("");
    setCidade("");
    setUf("");
    api.get("/advogados").then(setAdvogados).catch((err) => setErro(err.message));
  }

  return (
    <main>
      <h1>Advogados</h1>

      <form className="card filter-bar" onSubmit={buscar}>
        <Select label="Área" id="area" value={area} onChange={(e) => setArea(e.target.value)}>
          <option value="">Todas</option>
          <option value="civel">Cível</option>
          <option value="trabalhista">Trabalhista</option>
        </Select>

        <Input label="Cidade" id="cidade" value={cidade} onChange={(e) => setCidade(e.target.value)} />
        <Input label="UF" id="uf" value={uf} onChange={(e) => setUf(e.target.value)} maxLength={2} />

        <Button type="submit">Filtrar</Button>
        <Button type="button" variant="secondary" onClick={limpar}>
          Limpar filtros
        </Button>
      </form>

      {erro && <p role="alert">{erro}</p>}
      {!advogados && !erro && <p>Carregando...</p>}

      {advogados && advogados.length === 0 && <p>Nenhum advogado encontrado com esses filtros.</p>}

      {advogados && advogados.length > 0 && (
        <ul className="list-plain">
          {advogados.map((adv) => (
            <li key={adv.uid} className="card">
              <Link to={`/advogados/${adv.uid}`}>
                <strong>{adv.nome || adv.uid}</strong>
              </Link>
              <p className="text-muted">
                {adv.areasAtuacao?.join(", ") || "sem área"} — {adv.localizacao?.cidade}/
                {adv.localizacao?.uf} — {adv.verificado ? "OAB verificada" : "OAB em análise"}
              </p>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
