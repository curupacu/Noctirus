import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { Select } from "../../components/Select/Select";
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

  useEffect(() => {
    if (resultado) return;
    api
      .get(`/triagem/${id}`)
      .then((dados) => {
        setResultado(dados);
        setCategorias(dados.categorias || []);
      })
      .catch((err) => setErro(err.message));
  }, [id, resultado]);

  useEffect(() => {
    api.get("/triagem/perguntas").then((dados) => setCatalogoCategorias(dados.categorias));
  }, []);

  if (erro) return <p role="alert">{erro}</p>;
  if (!resultado) return <p>Carregando...</p>;

  const opcoesDaArea = catalogoCategorias?.[resultado.areaClassificada] || [];
  const rotuloCategoria = (valor) => opcoesDaArea.find((c) => c.valor === valor)?.label || valor;
  const disponiveisParaAdicionar = opcoesDaArea.filter((c) => !categorias.includes(c.valor));

  function removerCategoria(valor) {
    setCategorias((atual) => atual.filter((c) => c !== valor));
  }

  function adicionarCategoria(valor) {
    if (!valor) return;
    setCategorias((atual) => [...atual, valor]);
  }

  return (
    <main>
      <h1>Resultado da triagem</h1>

      <section className="card">
        <span className="badge">
          {resultado.origem === "ia" ? "Classificado por IA" : "Classificado por regras"}
        </span>
        <p>
          <strong>Área:</strong> {LABEL_AREA[resultado.areaClassificada] || resultado.areaClassificada}
        </p>
        <p>
          <strong>Recomendação:</strong> {resultado.tipoAdvogadoSugerido}
        </p>
        {resultado.justificativa && <p className="text-muted">{resultado.justificativa}</p>}
      </section>

      {opcoesDaArea.length > 0 && (
        <section className="card">
          <h2>Categorias identificadas no seu caso</h2>
          <p className="text-muted">Se alguma não fizer sentido, remova. Se faltou algo, adicione.</p>

          <ul className="chip-list">
            {categorias.length === 0 && <li className="text-muted">Nenhuma categoria selecionada.</li>}
            {categorias.map((valor) => (
              <li key={valor} className="chip">
                {rotuloCategoria(valor)}
                <button
                  type="button"
                  onClick={() => removerCategoria(valor)}
                  aria-label={`Remover ${rotuloCategoria(valor)}`}
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>

          {disponiveisParaAdicionar.length > 0 && (
            <Select
              label="Adicionar categoria"
              id="adicionar-categoria"
              value=""
              onChange={(e) => adicionarCategoria(e.target.value)}
            >
              <option value="">Selecione...</option>
              {disponiveisParaAdicionar.map((c) => (
                <option key={c.valor} value={c.valor}>
                  {c.label}
                </option>
              ))}
            </Select>
          )}
        </section>
      )}

      <h2>Advogados compatíveis</h2>
      {resultado.advogados.length === 0 && <p>Nenhum advogado compatível encontrado ainda.</p>}
      {resultado.advogados.length > 0 && (
        <ul className="list-plain">
          {resultado.advogados.map((adv) => (
            <li key={adv.uid} className="card">
              <Link to={`/advogados/${adv.uid}`}>
                <strong>{adv.nome || adv.uid}</strong>
              </Link>
              <p className="text-muted">
                {adv.areasAtuacao?.join(", ") || "sem área"} — {adv.localizacao?.cidade}/
                {adv.localizacao?.uf}
              </p>
            </li>
          ))}
        </ul>
      )}

      <p>
        <Link to="/triagem">Fazer nova triagem</Link> ·{" "}
        <Link to="/minhas-triagens">Minhas triagens</Link>
      </p>
    </main>
  );
}
