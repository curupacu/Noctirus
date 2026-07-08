import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
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

  useEffect(() => {
    if (resultado) return;
    api
      .get(`/triagem/${id}`)
      .then(setResultado)
      .catch((err) => setErro(err.message));
  }, [id, resultado]);

  if (erro) return <p role="alert">{erro}</p>;
  if (!resultado) return <p>Carregando...</p>;

  return (
    <main>
      <h1>Resultado da triagem</h1>

      <p>
        <strong>Área:</strong>{" "}
        {LABEL_AREA[resultado.areaClassificada] || resultado.areaClassificada}
      </p>
      <p>
        <strong>Recomendação:</strong> {resultado.tipoAdvogadoSugerido}
      </p>
      <p style={{ fontSize: "0.85rem", color: "#666" }}>
        Classificação por {resultado.origem === "ia" ? "IA" : "regras"}
        {resultado.justificativa ? ` — ${resultado.justificativa}` : ""}
      </p>

      <h2>Advogados compatíveis</h2>
      {resultado.advogados.length === 0 && <p>Nenhum advogado compatível encontrado ainda.</p>}
      {resultado.advogados.length > 0 && (
        <ul>
          {resultado.advogados.map((adv) => (
            <li key={adv.uid}>
              <Link to={`/advogados/${adv.uid}`}>{adv.nome || adv.uid}</Link> —{" "}
              {adv.areasAtuacao?.join(", ") || "sem área"} —{" "}
              {adv.localizacao?.cidade}/{adv.localizacao?.uf}
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
