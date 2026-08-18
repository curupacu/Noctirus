import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Avatar } from "../../components/Avatar/Avatar";
import { Loading } from "../../components/Loading/Loading";
import { api } from "../../lib/api";

// Tela própria de contato — antes eram dois botões ("Falar no WhatsApp"/"Enviar e-mail")
// direto no perfil, sempre os dois juntos mesmo quando só um existia (achado do usuário,
// 18/08: "meio estranho"). Agora o perfil manda pra cá com um botão só ("Contatar
// advogado") e essa tela mostra só os canais que esse advogado específico cadastrou —
// hoje WhatsApp/e-mail, mas o formato já é "uma linha por canal presente", então dá pra
// entrar Instagram ou qualquer outro canal aqui sem mudar a ideia da tela.
export function ContatoAdvogadoPage() {
  const { uid } = useParams();
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
        <div className="stack" style={{ marginTop: "var(--space-lg)" }}>
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
              href={`mailto:${email}`}
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
