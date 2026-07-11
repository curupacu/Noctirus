import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "../../components/Button/Button";
import { api } from "../../lib/api";

const LABEL_AREA = {
  civel: "Cível",
  trabalhista: "Trabalhista",
  indefinido: "Não identificada",
};

export function PainelPage() {
  const [usuario, setUsuario] = useState(null);
  const [triagens, setTriagens] = useState(null);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    Promise.all([api.get("/users/me"), api.get("/triagem/historico")])
      .then(([dadosUsuario, dadosTriagens]) => {
        setUsuario(dadosUsuario);
        setTriagens(dadosTriagens);
      })
      .catch((err) => setErro(err.message));
  }, []);

  if (erro) return <p role="alert">{erro}</p>;
  if (!usuario) return <p>Carregando...</p>;

  const primeiroNome = (usuario.nome || usuario.email || "").split(" ")[0];
  const ultimasTriagens = (triagens || []).slice(0, 3);

  return (
    <main>
      <h1>Olá, {primeiroNome}</h1>
      <p className="text-muted">
        Este é o seu painel. Daqui você faz uma nova triagem ou acompanha as que já fez.
      </p>

      <section className="card card--highlight">
        <h2>Precisa de um advogado?</h2>
        <p>
          Responda algumas perguntas e descreva seu caso — a gente indica a área certa e
          advogados compatíveis.
        </p>
        <Link to="/triagem">
          <Button>Fazer triagem</Button>
        </Link>
      </section>

      <section className="card">
        <div className="card__header">
          <h2>Suas últimas triagens</h2>
          <Link to="/minhas-triagens">Ver todas</Link>
        </div>

        {ultimasTriagens.length === 0 && <p>Você ainda não fez nenhuma triagem.</p>}

        {ultimasTriagens.length > 0 && (
          <ul className="list-plain">
            {ultimasTriagens.map((t) => (
              <li key={t.id}>
                <Link to={`/triagem/${t.id}`}>
                  {LABEL_AREA[t.areaClassificada] || t.areaClassificada} —{" "}
                  {t.tipoAdvogadoSugerido}
                </Link>{" "}
                <span className="text-muted">
                  ({new Date(t.createdAt).toLocaleDateString("pt-BR")})
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card">
        <h2>Minha conta</h2>
        <ul className="list-plain">
          <li>Nome: {usuario.nome}</li>
          <li>E-mail: {usuario.email}</li>
        </ul>
        <Link to="/perfil">Editar meus dados</Link>
      </section>
    </main>
  );
}
