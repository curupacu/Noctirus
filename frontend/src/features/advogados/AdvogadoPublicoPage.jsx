import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../../lib/api";

function ListaOuVazio({ titulo, itens }) {
  return (
    <section>
      <h3>{titulo}</h3>
      {itens && itens.length > 0 ? (
        <ul className="list-plain">
          {itens.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      ) : (
        <p className="text-muted">Nada cadastrado ainda.</p>
      )}
    </section>
  );
}

export function AdvogadoPublicoPage() {
  const { uid } = useParams();
  const [advogado, setAdvogado] = useState(null);
  const [curriculo, setCurriculo] = useState(null);
  const [catalogoCategorias, setCatalogoCategorias] = useState(null);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    Promise.all([
      api.get(`/advogados/${uid}`),
      api.get(`/curriculos/${uid}`).catch(() => null),
      api.get("/triagem/perguntas"),
    ])
      .then(([dadosAdvogado, dadosCurriculo, perguntas]) => {
        setAdvogado(dadosAdvogado);
        setCurriculo(dadosCurriculo);
        setCatalogoCategorias(perguntas.categorias);
      })
      .catch((err) => setErro(err.message));
  }, [uid]);

  if (erro) return <p role="alert">{erro}</p>;
  if (!advogado) return <p className="loading">Carregando...</p>;

  const whatsapp = advogado.contatos?.whatsapp;
  const email = advogado.contatos?.email;
  const rotulosEspecialidades = (advogado.especialidades || []).map((valor) => {
    const todas = Object.values(catalogoCategorias || {}).flat();
    return todas.find((c) => c.valor === valor)?.label || valor;
  });

  return (
    <main>
      <div className="media">
        <span className="avatar-placeholder">{(advogado.nome || "?").charAt(0).toUpperCase()}</span>
        <h1>{advogado.nome}</h1>
      </div>

      <section className="card">
        <p>
          <span className="badge">
            {advogado.verificado ? "OAB verificada" : "OAB em análise"}
          </span>
        </p>
        <p className="text-muted">
          OAB {advogado.oab?.numero}/{advogado.oab?.uf}
        </p>
        <p>Áreas de atuação: {advogado.areasAtuacao?.join(", ") || "não informado"}</p>

        {rotulosEspecialidades.length > 0 && (
          <ul className="chip-list">
            {rotulosEspecialidades.map((rotulo) => (
              <li key={rotulo} className="chip">
                {rotulo}
              </li>
            ))}
          </ul>
        )}

        <p className="text-muted">
          Localização: {advogado.localizacao?.cidade || "?"}/{advogado.localizacao?.uf || "?"}
        </p>
      </section>

      <section className="card">
        <h2>Contato</h2>
        <div className="actions">
          {whatsapp && (
            <a
              className="button button--primary"
              href={`https://wa.me/${whatsapp}`}
              target="_blank"
              rel="noreferrer"
            >
              Falar no WhatsApp
            </a>
          )}
          {email && (
            <a className="button button--secondary" href={`mailto:${email}`}>
              Enviar e-mail
            </a>
          )}
        </div>
        {!whatsapp && !email && <p>Nenhum contato cadastrado.</p>}
      </section>

      <section className="card">
        <h2>Currículo</h2>
        <ListaOuVazio titulo="Formação" itens={curriculo?.formacao} />
        <ListaOuVazio titulo="Especializações" itens={curriculo?.especializacoes} />
        <ListaOuVazio titulo="Cursos" itens={curriculo?.cursos} />
        <ListaOuVazio titulo="Experiências" itens={curriculo?.experiencias} />
      </section>
    </main>
  );
}
