import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../lib/api";

export function AdvogadosListPage() {
  const [advogados, setAdvogados] = useState(null);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    api.get("/advogados").then(setAdvogados).catch((err) => setErro(err.message));
  }, []);

  if (erro) return <p role="alert">{erro}</p>;
  if (!advogados) return <p>Carregando...</p>;

  return (
    <main>
      <h1>Advogados</h1>
      <p>
        Lista simples pra teste — sem filtro por área/localização ainda (isso é o matching,
        que vem depois).
      </p>
      <ul>
        {advogados.map((adv) => (
          <li key={adv.uid}>
            <Link to={`/advogados/${adv.uid}`}>{adv.nome || adv.uid}</Link> —{" "}
            {adv.areasAtuacao?.join(", ") || "sem área"} —{" "}
            {adv.verificado ? "OAB verificada" : "OAB em análise"}
          </li>
        ))}
      </ul>
    </main>
  );
}
