import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Avatar } from "../../components/Avatar/Avatar";
import { Loading } from "../../components/Loading/Loading";
import { api } from "../../lib/api";

const LABEL_AREA = { civel: "cível", trabalhista: "trabalhista" };

// Mensagens prontas, só isso — nada de campo livre (pedido do usuário, 18/08: "não
// quero que a pessoa possa escrever algo, só mensagenzinhas prontas"). Reduz risco de
// captação de clientela (Código de Ética da OAB, art. 34, IV: o advogado nunca aborda o
// cliente primeiro) e mantém o texto sempre dentro do que a plataforma já revisou — o
// cliente escolhe uma das opções, não redige a mensagem. O clique de enviar
// (WhatsApp/e-mail) continua sendo sempre dele.
function mensagensProntas(advogado) {
  const area = LABEL_AREA[advogado?.areasAtuacao?.[0]] || "jurídica";
  return [
    `Olá! Tenho uma questão ${area} e preciso de ajuda.`,
    "Quero sua ajuda com um problema urgente.",
    "Gostaria de agendar uma conversa antes de decidir.",
  ];
}

export function ContatoAdvogadoPage() {
  const { uid } = useParams();
  const [advogado, setAdvogado] = useState(null);
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState(null);

  useEffect(() => {
    api
      .get(`/advogados/${uid}`)
      .then(setAdvogado)
      .catch((err) => setErro(err.message));
  }, [uid]);

  function logarContato(canal) {
    api.post(`/advogados/${uid}/contato`, { canal }).catch(() => {});
  }

  if (erro) return <p role="alert">{erro}</p>;
  if (!advogado) return <Loading>Carregando...</Loading>;

  const suspenso = advogado.status === "suspenso";
  const whatsapp = !suspenso && advogado.contatos?.whatsapp;
  const email = !suspenso && advogado.contatos?.email;
  const mensagens = mensagensProntas(advogado);
  const textoCodificado = encodeURIComponent(mensagem);

  return (
    <main>
      <span className="eyebrow">Contato</span>
      <div className="media">
        <Avatar nome={advogado.nome} foto={advogado.foto} seed={uid} className="avatar-placeholder--grande" />
        <span className="stack" style={{ gap: 2 }}>
          <h1 style={{ margin: 0 }}>{advogado.nome}</h1>
          <span className="text-muted">
            {advogado.localizacao?.cidade || "?"}/{advogado.localizacao?.uf || "?"}
          </span>
        </span>
      </div>

      {suspenso && (
        <p className="text-muted">Este advogado está suspenso e não pode ser contatado pela plataforma.</p>
      )}

      {!suspenso && (whatsapp || email) && (
        <>
          <div className="section-heading">
            <h2>Mensagem inicial</h2>
          </div>
          <p className="text-muted">Escolha uma mensagem pronta (opcional) pra já ir junto.</p>
          <div className="pill-toggle">
            {mensagens.map((texto) => (
              <button
                key={texto}
                type="button"
                className={`pill-toggle__item${mensagem === texto ? " pill-toggle__item--active" : ""}`}
                aria-pressed={mensagem === texto}
                onClick={() => setMensagem((atual) => (atual === texto ? "" : texto))}
              >
                {texto}
              </button>
            ))}
          </div>
        </>
      )}

      {!suspenso && (
        <div className="stack" style={{ marginTop: "var(--space-lg)" }}>
          {whatsapp && (
            <a
              className="button button--primary contato-canal"
              href={`https://wa.me/${whatsapp}${textoCodificado ? `?text=${textoCodificado}` : ""}`}
              target="_blank"
              rel="noreferrer"
              onClick={() => logarContato("whatsapp")}
            >
              <span className="contato-canal__label">Chamar no WhatsApp</span>
              <span className="contato-canal__valor">{whatsapp}</span>
            </a>
          )}
          {email && (
            <a
              className="button button--secondary contato-canal"
              href={`mailto:${email}?subject=${encodeURIComponent("Contato via Nocturis")}${textoCodificado ? `&body=${textoCodificado}` : ""}`}
              onClick={() => logarContato("email")}
            >
              <span className="contato-canal__label">Enviar e-mail</span>
              <span className="contato-canal__valor">{email}</span>
            </a>
          )}
          {!whatsapp && !email && <p className="text-muted">Nenhum contato cadastrado ainda.</p>}
        </div>
      )}

      <p className="text-muted resultado-proximos-passos">
        <Link to={`/advogados/${uid}`}>Voltar pro perfil</Link>
      </p>
    </main>
  );
}
