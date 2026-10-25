import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CartaoTriagem } from "../../components/CartaoTriagem/CartaoTriagem";
import { Loading } from "../../components/Loading/Loading";
import { api } from "../../lib/api";
import { rotulosEspecialidades } from "../../lib/solicitacoes";
import { useTitulo } from "../../lib/useTitulo";



export function MinhasTriagensPage() {
  useTitulo("Minhas triagens");
  const [triagens, setTriagens] = useState(null);
  const [erro, setErro] = useState(null);
  const [rotulos, setRotulos] = useState({});

  useEffect(() => {
    api.get("/triagem/historico").then(setTriagens).catch((err) => setErro(err.message));
    api
      .get("/triagem/perguntas")
      .then((p) => setRotulos(rotulosEspecialidades(p.categorias)))
      .catch(() => {});
  }, []);

  return (
    <main>
      <div className="section-heading">
        <h1 style={{ margin: 0 }}>Minhas triagens</h1>
        <Link to="/triagem">Nova triagem</Link>
      </div>

      {erro && <p role="alert">{erro}</p>}
      {!triagens && !erro && <Loading>Carregando...</Loading>}
      {triagens && triagens.length === 0 && <p>Você ainda não fez nenhuma triagem.</p>}

      {triagens && triagens.length > 0 && (
        <ul className="lista-triagens">
          {triagens.map((t) => (
            <li key={t.id}>
              <CartaoTriagem triagem={t} rotulos={rotulos} />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
