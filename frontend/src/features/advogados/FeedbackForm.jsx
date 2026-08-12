import { useState } from "react";
import { Button } from "../../components/Button/Button";
import { api } from "../../lib/api";

// Avaliação privada do cliente sobre o atendimento — nunca fica pública nem aparece no
// perfil, diferente de "Denunciar este advogado" (que vai pro admin moderar conduta
// inadequada). Só o próprio advogado avaliado vê (nem o admin, ver routes/advogados.js).
export function FeedbackForm({ uid }) {
  const [nota, setNota] = useState(0);
  const [notaHover, setNotaHover] = useState(0);
  const [comentario, setComentario] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [erro, setErro] = useState(null);

  async function enviar(e) {
    e.preventDefault();
    if (!nota) {
      setErro("Escolha uma nota antes de enviar.");
      return;
    }
    setErro(null);
    setEnviando(true);
    try {
      await api.post(`/advogados/${uid}/feedback`, { nota, comentario });
      setEnviado(true);
    } catch (err) {
      setErro(err.message);
    } finally {
      setEnviando(false);
    }
  }

  if (enviado) {
    return (
      <div className="card">
        <p role="status">Obrigado! Seu feedback foi enviado — é privado, só o advogado vê.</p>
      </div>
    );
  }

  return (
    <form className="card stack" onSubmit={enviar}>
      <div>
        <h3>Como foi seu atendimento?</h3>
        <p className="text-muted">Privado — só o advogado vê essa avaliação.</p>
      </div>

      <div className="feedback-estrelas" role="radiogroup" aria-label="Nota do atendimento">
        {[1, 2, 3, 4, 5].map((valor) => (
          <button
            key={valor}
            type="button"
            className="feedback-estrelas__item"
            aria-label={`${valor} estrela${valor > 1 ? "s" : ""}`}
            aria-pressed={valor <= nota}
            onClick={() => setNota(valor)}
            onMouseEnter={() => setNotaHover(valor)}
            onMouseLeave={() => setNotaHover(0)}
            style={{ color: valor <= (notaHover || nota) ? "var(--gold)" : "var(--color-border)" }}
          >
            ★
          </button>
        ))}
      </div>

      <textarea
        className="input"
        rows={3}
        maxLength={500}
        placeholder="Quer contar mais alguma coisa? (opcional)"
        value={comentario}
        onChange={(e) => setComentario(e.target.value)}
      />

      {erro && <p role="alert">{erro}</p>}

      <Button type="submit" variant="secondary" disabled={enviando}>
        {enviando ? "Enviando..." : "Enviar feedback privado"}
      </Button>
    </form>
  );
}
