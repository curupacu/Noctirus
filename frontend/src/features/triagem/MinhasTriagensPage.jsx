import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../lib/api";

const LABEL_AREA = {
  civel: "Cível",
  trabalhista: "Trabalhista",
  indefinido: "Não identificada",
};

export function MinhasTriagensPage() {
  const [triagens, setTriagens] = useState(null);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    api.get("/triagem/historico").then(setTriagens).catch((err) => setErro(err.message));
  }, []);

  return (
    <main>
      <h1>Minhas triagens</h1>
      <p>
        <Link to="/triagem">Fazer nova triagem</Link>
      </p>

      {erro && <p role="alert">{erro}</p>}
      {!triagens && !erro && <p>Carregando...</p>}
      {triagens && triagens.length === 0 && <p>Você ainda não fez nenhuma triagem.</p>}

      {triagens && triagens.length > 0 && (
        <ul>
          {triagens.map((t) => (
            <li key={t.id}>
              <Link to={`/triagem/${t.id}`}>
                {LABEL_AREA[t.areaClassificada] || t.areaClassificada} — {t.tipoAdvogadoSugerido}
              </Link>{" "}
              ({new Date(t.createdAt).toLocaleDateString("pt-BR")})
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
