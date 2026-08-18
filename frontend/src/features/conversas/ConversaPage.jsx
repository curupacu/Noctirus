import { Link, useLocation, useParams } from "react-router-dom";
import { Avatar } from "../../components/Avatar/Avatar";
import { ChatThread } from "../../components/ChatThread/ChatThread";

// Categorias de resposta do advogado — precisa bater exatamente com MENSAGENS_ADVOGADO
// no backend (routes/conversas.js).
const CATEGORIAS_ADVOGADO = {
  Resposta: ["Já te respondi por lá (WhatsApp/e-mail)."],
  Disponibilidade: [
    "Estou ocupado esse mês, mas posso te atender em breve.",
    "No momento não consigo assumir novos casos.",
    "Vamos conversar por WhatsApp?",
  ],
  "Resposta rápida": ["Sim, sem problema.", "Combinado!", "Por enquanto não, mas te aviso."],
};

export function ConversaPage() {
  const { uid } = useParams();
  const location = useLocation();
  // Nome vem da lista (ConversasPage manda via state) — não existe endpoint pra buscar
  // nome de qualquer usuário por uid, só o que a própria conversa já resolveu.
  const nome = location.state?.nome || "Cliente";

  return (
    <main>
      <span className="eyebrow">Conversa</span>
      <div className="media">
        <Avatar nome={nome} seed={uid} className="avatar-placeholder--grande" />
        <h1 style={{ margin: 0 }}>{nome}</h1>
      </div>

      <div style={{ marginTop: "var(--space-lg)" }}>
        <ChatThread comUid={uid} categorias={CATEGORIAS_ADVOGADO} />
      </div>

      <p className="text-muted resultado-proximos-passos">
        <Link to="/conversas">Voltar pras conversas</Link>
      </p>
    </main>
  );
}
