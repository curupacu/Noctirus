import { useEffect, useState } from "react";
import { api } from "../../lib/api";

export function PainelPage() {
  const [usuario, setUsuario] = useState(null);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    api.get("/users/me").then(setUsuario).catch((err) => setErro(err.message));
  }, []);

  return (
    <main>
      <h1>Painel</h1>

      <p style={{ fontSize: "1.5rem", fontWeight: "bold" }}>Aqui vai aparecer tudo.</p>

      <p>
        Essa tela é só um espaço reservado — ainda não tem nenhuma funcionalidade real. Ela
        existe pra confirmar que o login funcionou: se os dados abaixo baterem com a sua conta,
        deu certo.
      </p>

      {erro && <p role="alert">Erro ao confirmar login: {erro}</p>}
      {!usuario && !erro && <p>Carregando...</p>}

      {usuario && (
        <ul>
          <li>Nome: {usuario.nome}</li>
          <li>E-mail: {usuario.email}</li>
          <li>Papel: {usuario.role}</li>
        </ul>
      )}
    </main>
  );
}
