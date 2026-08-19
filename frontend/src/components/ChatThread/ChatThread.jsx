import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Loading } from "../Loading/Loading";
import { api } from "../../lib/api";
import { useAuth } from "../../features/auth/AuthContext";
import "./ChatThread.css";

// Chatzinho de mensagem fixa, nos dois sentidos — antes eram só botões que abriam o
// WhatsApp, sem nenhuma confirmação visível de que "algo foi enviado" (achado do
// usuário, 18/08). Aqui o clique manda de verdade (POST /conversas/:comUid/mensagens) e
// a mensagem aparece na hora como uma bolha na conversa. `categorias` é um mapa
// rótulo -> lista de textos fixos (cliente e advogado têm listas diferentes, ver
// features/advogados/ContatoAdvogadoPage e features/conversas).
//
// Usado numa rota pública (ContatoAdvogadoPage não exige login pra RF008/RF010) — então
// não dá pra assumir que o Firebase Auth já restaurou a sessão quando esse componente
// monta. `loading` do useAuth só vira false depois que onAuthStateChanged dispara pela
// primeira vez; buscar a conversa antes disso manda a requisição sem token e toma 401
// (achado ao vivo, 18/08: conversa aparecia vazia mesmo com mensagens salvas, só em
// F5 — carregar direto por URL, sem passar pela navegação do app, é o caso que expõe
// isso). Esperar `!loading` resolve pros dois lados (logado ou não).
export function ChatThread({ comUid, categorias, extra }) {
  const { user, role, loading } = useAuth();
  const [mensagens, setMensagens] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const fimRef = useRef(null);

  useEffect(() => {
    if (loading || !user) return;
    api
      .get(`/conversas/${comUid}/mensagens`)
      .then(setMensagens)
      .catch(() => setMensagens([]));
  }, [comUid, loading, user]);

  useEffect(() => {
    fimRef.current?.scrollIntoView({ block: "nearest" });
  }, [mensagens]);

  async function enviar(texto) {
    setEnviando(true);
    try {
      const nova = await api.post(`/conversas/${comUid}/mensagens`, { texto, ...extra });
      setMensagens((atual) => [...(atual || []), nova]);
    } catch {
      // silencioso — a mensagem simplesmente não aparece e a pessoa pode tentar de novo
    } finally {
      setEnviando(false);
    }
  }

  if (loading) return <Loading>Carregando...</Loading>;

  if (!user) {
    return (
      <p className="text-muted">
        <Link to="/login">Entre na sua conta</Link> pra ver e mandar mensagens.
      </p>
    );
  }

  return (
    <div className="chat-thread">
      <div className="chat-thread__mensagens">
        {mensagens === null && <Loading>Carregando conversa...</Loading>}
        {mensagens?.length === 0 && (
          <p className="text-muted chat-thread__vazio">Nenhuma mensagem ainda.</p>
        )}
        {mensagens?.map((m) => (
          <div
            key={m.id}
            className={`chat-bubble${m.remetente === role ? " chat-bubble--minha" : ""}`}
          >
            <p>{m.texto}</p>
            <span className="chat-bubble__hora">
              {new Date(m.createdAt).toLocaleString("pt-BR", {
                day: "2-digit",
                month: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        ))}
        <div ref={fimRef} />
      </div>

      {Object.entries(categorias).map(([categoria, opcoes]) => (
        <div key={categoria} className="chat-thread__categoria">
          <span className="eyebrow">{categoria}</span>
          <div className="pill-toggle">
            {opcoes.map((texto) => (
              <button
                key={texto}
                type="button"
                className="pill-toggle__item"
                disabled={enviando}
                onClick={() => enviar(texto)}
              >
                {texto}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
