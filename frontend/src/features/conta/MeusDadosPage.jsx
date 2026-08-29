import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../components/Button/Button";
import { api } from "../../lib/api";
import { useTitulo } from "../../lib/useTitulo";
import { useAuth } from "../auth/AuthContext";

// Autoatendimento de dados pessoais (LGPD, art. 18) — antes só o admin conseguia apagar
// uma conta (DELETE /admin/users/:uid) e não existia jeito nenhum de baixar os próprios
// dados. Aqui o próprio titular faz as duas coisas sem precisar pedir pra ninguém.
export function MeusDadosPage() {
  useTitulo("Meus dados");
  const { logout } = useAuth();
  const navigate = useNavigate();

  const [baixando, setBaixando] = useState(false);
  const [excluindo, setExcluindo] = useState(false);
  const [erro, setErro] = useState(null);

  async function baixarMeusDados() {
    setErro(null);
    setBaixando(true);
    try {
      const dados = await api.get("/users/me/dados");
      const blob = new Blob([JSON.stringify(dados, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "meus-dados-nocturis.json";
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setErro(err.message);
    } finally {
      setBaixando(false);
    }
  }

  async function excluirMinhaConta() {
    if (
      !window.confirm(
        "Tem certeza que quer apagar sua conta? Essa ação não pode ser desfeita — seu cadastro" +
          " (e, se você for advogado, seu perfil público e currículo) serão removidos.",
      )
    ) {
      return;
    }

    setErro(null);
    setExcluindo(true);
    try {
      await api.delete("/users/me");
      await logout();
      navigate("/");
    } catch (err) {
      setErro(err.message);
      setExcluindo(false);
    }
  }

  return (
    <main>
      <span className="eyebrow">Privacidade</span>
      <h1>Meus dados</h1>
      <p className="text-muted">
        Aqui você acessa dois direitos garantidos pela LGPD: baixar uma cópia de tudo que a
        Nocturis guarda sobre você, ou apagar sua conta de vez.
      </p>

      {erro && <p role="alert">{erro}</p>}

      <div className="section-heading">
        <h2>Baixar meus dados</h2>
      </div>
      <p className="text-muted">
        Gera um arquivo com seu cadastro, triagens, contatos, conversas, feedback e denúncias
        que você registrou.
      </p>
      <div className="actions">
        <Button variant="secondary" onClick={baixarMeusDados} disabled={baixando}>
          {baixando ? "Gerando arquivo..." : "Baixar meus dados"}
        </Button>
      </div>

      <div className="section-heading">
        <h2>Excluir minha conta</h2>
      </div>
      <p className="text-muted">
        Remove seu cadastro definitivamente. Mensagens de chat, feedback e denúncias que
        envolvem outra pessoa não são apagados junto, porque também são registro do outro
        lado da conversa/moderação.
      </p>
      <div className="actions">
        <Button variant="secondary" onClick={excluirMinhaConta} disabled={excluindo}>
          {excluindo ? "Excluindo..." : "Excluir minha conta"}
        </Button>
      </div>
    </main>
  );
}
