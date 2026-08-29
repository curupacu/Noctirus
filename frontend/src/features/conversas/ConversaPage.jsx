import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { Avatar } from "../../components/Avatar/Avatar";
import { ChatThread } from "../../components/ChatThread/ChatThread";
import { api } from "../../lib/api";
import { useTitulo } from "../../lib/useTitulo";

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

const LABEL_AREA = { civel: "Cível", trabalhista: "Trabalhista", indefinido: "Não identificada" };

export function ConversaPage() {
  const { uid } = useParams();
  const location = useLocation();
  // Nome vem da lista (ConversasPage manda via state) — não existe endpoint pra buscar
  // nome de qualquer usuário por uid, só o que a própria conversa já resolveu.
  const nome = location.state?.nome || "Cliente";
  useTitulo(`Conversa — ${nome}`);

  const [triagem, setTriagem] = useState(null);

  useEffect(() => {
    api
      .get(`/conversas/${uid}/triagem`)
      .then(setTriagem)
      .catch(() => setTriagem(null));
  }, [uid]);

  return (
    <main>
      <span className="eyebrow">Conversa</span>
      <div className="media">
        <Avatar nome={nome} seed={uid} className="avatar-placeholder--grande" />
        <h1 style={{ margin: 0 }}>{nome}</h1>
      </div>

      {triagem && (
        <div className="card">
          <span className="badge badge--gold">Chegou via triagem</span>
          <p className="text-muted" style={{ marginBottom: 0 }}>
            <strong>Área:</strong> {LABEL_AREA[triagem.areaClassificada] || triagem.areaClassificada}
          </p>
          <p style={{ marginBottom: 0 }}>{triagem.descricao}</p>
        </div>
      )}

      <div style={{ marginTop: "var(--space-lg)" }}>
        <ChatThread comUid={uid} categorias={CATEGORIAS_ADVOGADO} />
      </div>

      <p className="text-muted resultado-proximos-passos">
        <Link to="/conversas">Voltar pras conversas</Link>
      </p>
    </main>
  );
}
