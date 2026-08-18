import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Avatar } from "../../components/Avatar/Avatar";
import { Loading } from "../../components/Loading/Loading";
import { api } from "../../lib/api";

const LABEL_AREA = { civel: "cível", trabalhista: "trabalhista" };

// Modelos de mensagem inicial — pedido do usuário, 18/08, pra reduzir risco de captação
// de clientela (Código de Ética da OAB, art. 34, IV): a plataforma nunca manda mensagem
// nenhuma sozinha, e o advogado nunca aborda o cliente primeiro. O que existe aqui é só
// um ponto de partida redigido de forma neutra que o PRÓPRIO cliente decide usar, editar
// ou ignorar — o clique de enviar (WhatsApp/e-mail) continua sendo sempre dele.
function modelosDeMensagem(advogado) {
  const area = LABEL_AREA[advogado?.areasAtuacao?.[0]] || "jurídica";
  return [
    {
      label: "Direto ao ponto",
      texto: `Olá! Tenho uma questão ${area} e gostaria de conversar sobre o meu caso.`,
    },
    {
      label: "Perguntar antes",
      texto: `Olá! Encontrei seu perfil na Nocturis. Antes de decidir, gostaria de entender melhor como você poderia me ajudar com uma questão ${area}.`,
    },
    {
      label: "Agendar uma conversa",
      texto: "Olá! Gostaria de agendar uma conversa inicial sobre o meu caso, quando for possível pra você.",
    },
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
  const modelos = modelosDeMensagem(advogado);
  const textoCodificado = encodeURIComponent(mensagem.trim());

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
          <p className="text-muted">
            Um ponto de partida pra você editar como quiser — a mensagem só sai quando você
            mesmo clicar em enviar.
          </p>
          <div className="pill-toggle">
            {modelos.map((modelo) => (
              <button
                key={modelo.label}
                type="button"
                className={`pill-toggle__item${mensagem === modelo.texto ? " pill-toggle__item--active" : ""}`}
                aria-pressed={mensagem === modelo.texto}
                onClick={() => setMensagem(modelo.texto)}
              >
                {modelo.label}
              </button>
            ))}
          </div>
          <textarea
            className="input"
            rows={3}
            maxLength={500}
            value={mensagem}
            onChange={(e) => setMensagem(e.target.value)}
            placeholder="Escolha um modelo acima ou escreva a sua própria mensagem"
            style={{ marginTop: "var(--space-sm)" }}
          />
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
