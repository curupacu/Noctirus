import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "../../components/Button/Button";
import { Input } from "../../components/Input/Input";
import { api } from "../../lib/api";
import { useTitulo } from "../../lib/useTitulo";

export function DenunciarPage() {
  useTitulo("Denunciar");
  const [searchParams] = useSearchParams();
  const alvoId = searchParams.get("alvoId") || null;
  const alvoNome = searchParams.get("alvoNome");
  const navigate = useNavigate();

  const [descricao, setDescricao] = useState("");
  const [provaUrl, setProvaUrl] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState(null);
  const [enviado, setEnviado] = useState(false);

  async function enviar(e) {
    e.preventDefault();
    setErro(null);

    if (descricao.trim().length < 10) {
      setErro("Descreva o que aconteceu com pelo menos 10 caracteres.");
      return;
    }

    setEnviando(true);
    try {
      await api.post("/denuncias", {
        alvoId,
        descricao,
        provaUrl: provaUrl.trim() || undefined,
      });
      setEnviado(true);
    } catch (err) {
      setErro(err.message);
    } finally {
      setEnviando(false);
    }
  }

  if (enviado) {
    return (
      <main>
        <h1>Denúncia registrada</h1>
        <section className="card">
          <p>Recebemos sua denúncia e nossa equipe vai analisar com cuidado.</p>
          <div className="actions">
            <Button onClick={() => navigate(-1)}>Voltar</Button>
            <Link to="/minhas-denuncias" className="button button--secondary">
              Acompanhar minhas denúncias <span className="button__arrow" aria-hidden="true">→</span>
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main>
      <h1>Registrar denúncia</h1>
      <p className="text-muted">
        {alvoNome
          ? `Conte o que aconteceu com ${alvoNome}. Toda denúncia é analisada com cuidado.`
          : "Conte o que aconteceu. Toda denúncia é analisada com cuidado."}
      </p>

      <form className="stack" onSubmit={enviar}>
        <div className="input-group">
          <label className="input-label" htmlFor="descricao">
            O que aconteceu?
          </label>
          <textarea
            id="descricao"
            className="input"
            rows={6}
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
          />
        </div>

        <Input
          label="Link de prova (opcional)"
          id="provaUrl"
          type="url"
          placeholder="Ex.: link de um print ou documento já hospedado em outro lugar"
          value={provaUrl}
          onChange={(e) => setProvaUrl(e.target.value)}
        />

        <div className="form-cta-sticky">
          <Button type="submit" disabled={enviando}>
            {enviando ? "Enviando..." : "Enviar denúncia"}
          </Button>
          {erro && <p role="alert">{erro}</p>}
        </div>
      </form>
    </main>
  );
}
