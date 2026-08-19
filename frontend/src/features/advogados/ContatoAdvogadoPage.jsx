import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { Avatar } from "../../components/Avatar/Avatar";
import { ChatThread } from "../../components/ChatThread/ChatThread";
import { Loading } from "../../components/Loading/Loading";
import { api } from "../../lib/api";

const LABEL_AREA = { civel: "cível", trabalhista: "trabalhista" };

// Categorias de mensagem do cliente pro chatzinho (ver components/ChatThread) — igual
// lista de mensagens da OAB, agora separada por tipo (pedido do usuário, 18/08: "tipo
// olá etc"). Precisa bater exatamente com mensagensCliente() no backend
// (routes/conversas.js) — o servidor só aceita um desses textos.
function categoriasCliente(advogado) {
  const area = LABEL_AREA[advogado?.areasAtuacao?.[0]] || "jurídica";
  return {
    Saudação: ["Olá!", "Oi, tudo bem?"],
    "Sobre o caso": [
      `Tenho uma questão ${area} e preciso de ajuda.`,
      "Quero sua ajuda com um problema urgente.",
      "Gostaria de agendar uma conversa antes de decidir.",
    ],
    "Resposta rápida": ["Sim, pode ser!", "Não, prefiro por aqui mesmo.", "Combinado, obrigado(a)!"],
  };
}

export function ContatoAdvogadoPage() {
  const { uid } = useParams();
  const [searchParams] = useSearchParams();
  const triagemId = searchParams.get("triagemId");
  const [advogado, setAdvogado] = useState(null);
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

      {!suspenso && (
        <>
          <div className="section-heading">
            <h2>Conversa</h2>
          </div>
          <ChatThread
            comUid={uid}
            categorias={categoriasCliente(advogado)}
            extra={triagemId ? { triagemId } : undefined}
          />
        </>
      )}

      {!suspenso && (whatsapp || email) && (
        <>
          <div className="section-heading">
            <h2>Contato direto</h2>
          </div>
          <div className="stack">
            {whatsapp && (
              <a
                className="button button--primary contato-canal"
                href={`https://wa.me/${whatsapp}`}
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
                href={`mailto:${email}?subject=${encodeURIComponent("Contato via Nocturis")}`}
                onClick={() => logarContato("email")}
              >
                <span className="contato-canal__label">Enviar e-mail</span>
                <span className="contato-canal__valor">{email}</span>
              </a>
            )}
          </div>
        </>
      )}

      {!suspenso && !whatsapp && !email && (
        <p className="text-muted">Nenhum contato direto cadastrado ainda.</p>
      )}

      <p className="text-muted resultado-proximos-passos">
        <Link to={`/advogados/${uid}`}>Voltar pro perfil</Link>
      </p>
    </main>
  );
}
