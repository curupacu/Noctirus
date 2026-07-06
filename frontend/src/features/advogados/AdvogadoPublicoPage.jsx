import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../../lib/api";

function ListaOuVazio({ titulo, itens }) {
  return (
    <section>
      <h3>{titulo}</h3>
      {itens && itens.length > 0 ? (
        <ul>
          {itens.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      ) : (
        <p>Nada cadastrado ainda.</p>
      )}
    </section>
  );
}

export function AdvogadoPublicoPage() {
  const { uid } = useParams();
  const [advogado, setAdvogado] = useState(null);
  const [curriculo, setCurriculo] = useState(null);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    Promise.all([
      api.get(`/advogados/${uid}`),
      api.get(`/curriculos/${uid}`).catch(() => null),
    ])
      .then(([dadosAdvogado, dadosCurriculo]) => {
        setAdvogado(dadosAdvogado);
        setCurriculo(dadosCurriculo);
      })
      .catch((err) => setErro(err.message));
  }, [uid]);

  if (erro) return <p role="alert">{erro}</p>;
  if (!advogado) return <p>Carregando...</p>;

  const whatsapp = advogado.contatos?.whatsapp;
  const email = advogado.contatos?.email;

  return (
    <main>
      <h1>{advogado.nome}</h1>
      <p>
        OAB {advogado.oab?.numero}/{advogado.oab?.uf} —{" "}
        {advogado.verificado ? "verificada" : "em análise"}
      </p>
      <p>Áreas de atuação: {advogado.areasAtuacao?.join(", ") || "não informado"}</p>
      <p>
        Localização: {advogado.localizacao?.cidade || "?"}/{advogado.localizacao?.uf || "?"}
      </p>

      <section>
        <h2>Contato</h2>
        {whatsapp && (
          <p>
            <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noreferrer">
              Falar no WhatsApp
            </a>
          </p>
        )}
        {email && (
          <p>
            <a href={`mailto:${email}`}>Enviar e-mail</a>
          </p>
        )}
        {!whatsapp && !email && <p>Nenhum contato cadastrado.</p>}
      </section>

      <h2>Currículo</h2>
      <ListaOuVazio titulo="Formação" itens={curriculo?.formacao} />
      <ListaOuVazio titulo="Especializações" itens={curriculo?.especializacoes} />
      <ListaOuVazio titulo="Cursos" itens={curriculo?.cursos} />
      <ListaOuVazio titulo="Experiências" itens={curriculo?.experiencias} />
    </main>
  );
}
