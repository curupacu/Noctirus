import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../../lib/api";

const LABEL_AREA = {
  civel: "Cível",
  trabalhista: "Trabalhista",
};

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

  const suspenso = advogado.status === "suspenso";
  const whatsapp = !suspenso && advogado.contatos?.whatsapp;
  const email = !suspenso && advogado.contatos?.email;
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
        <h2>Sobre</h2>
        {suspenso && (
          <p>
            <span className="badge">Suspenso da plataforma</span>
          </p>
        )}
        <p>
          <span className="badge">
            {advogado.verificado ? "OAB verificada" : "OAB em análise"}
          </span>
        </p>
        <p className="text-muted">
          OAB {advogado.oab?.numero}/{advogado.oab?.uf} — {advogado.localizacao?.cidade || "?"}/
          {advogado.localizacao?.uf || "?"}
        </p>
        <p>
          Atua em: {advogado.areasAtuacao?.map((a) => LABEL_AREA[a] || a).join(", ") || "não informado"}
        </p>

        {rotulosEspecialidades.length > 0 && (
          <>
            <p className="text-muted">Especialidades:</p>
            <ul className="chip-list">
              {rotulosEspecialidades.map((rotulo) => (
                <li key={rotulo} className="chip">
                  {rotulo}
                </li>
              ))}
            </ul>
          </>
        )}
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
        {suspenso && <p>Este advogado está suspenso e não pode ser contatado pela plataforma.</p>}
        {!suspenso && !whatsapp && !email && <p>Nenhum contato cadastrado.</p>}
      </section>

      <section className="card">
        <h2>Currículo</h2>
        <ListaOuVazio titulo="Formação" itens={curriculo?.formacao} />
        <ListaOuVazio titulo="Especializações" itens={curriculo?.especializacoes} />
        <ListaOuVazio titulo="Cursos" itens={curriculo?.cursos} />
        <ListaOuVazio titulo="Experiências" itens={curriculo?.experiencias} />
      </section>

      <p className="text-muted">
        <Link to={`/denunciar?alvoId=${uid}&alvoNome=${encodeURIComponent(advogado.nome || "")}`}>
          Denunciar este advogado
        </Link>
      </p>
    </main>
  );
}
