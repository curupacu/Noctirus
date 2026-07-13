import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "../../components/Button/Button";
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
        <Link to="/triagem">
          <Button>Fazer nova triagem</Button>
        </Link>
      </p>

      {erro && <p role="alert">{erro}</p>}
      {!triagens && !erro && <p className="loading">Carregando...</p>}
      {triagens && triagens.length === 0 && <p>Você ainda não fez nenhuma triagem.</p>}

      {triagens && triagens.length > 0 && (
        <ul className="list-plain">
          {triagens.map((t) => (
            <li key={t.id} className="card">
              <Link to={`/triagem/${t.id}`}>
                <strong>{LABEL_AREA[t.areaClassificada] || t.areaClassificada}</strong> —{" "}
                {t.tipoAdvogadoSugerido}
              </Link>
              <p className="text-muted">{new Date(t.createdAt).toLocaleDateString("pt-BR")}</p>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
