import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "../../components/Button/Button";
import { Input } from "../../components/Input/Input";
import { useAuth } from "../auth/AuthContext";
import { api } from "../../lib/api";

export function PerfilPage() {
  const { user, role, logout } = useAuth();

  const [dadosUsuario, setDadosUsuario] = useState(null);
  const [advogado, setAdvogado] = useState(null);
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [cidade, setCidade] = useState("");
  const [uf, setUf] = useState("");
  const [mensagem, setMensagem] = useState(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    async function carregar() {
      const usuario = await api.get("/users/me");
      setDadosUsuario(usuario);
      setNome(usuario.nome || "");
      setTelefone(usuario.telefone || "");

      if (role === "advogado") {
        const dadosAdvogado = await api.get(`/advogados/${user.uid}`);
        setAdvogado(dadosAdvogado);
        setWhatsapp(dadosAdvogado.contatos?.whatsapp || "");
        setCidade(dadosAdvogado.localizacao?.cidade || "");
        setUf(dadosAdvogado.localizacao?.uf || "");
      }
      setCarregando(false);
    }
    if (user && role) carregar();
  }, [user, role]);

  async function salvarUsuario(e) {
    e.preventDefault();
    setMensagem(null);
    try {
      await api.put("/users/me", { nome, telefone });
      setMensagem("Dados salvos.");
    } catch (err) {
      setMensagem(err.message);
    }
  }

  async function salvarAdvogado(e) {
    e.preventDefault();
    setMensagem(null);
    try {
      await api.put(`/advogados/${user.uid}`, {
        whatsapp,
        localizacao: { cidade, uf },
      });
      setMensagem("Dados salvos.");
    } catch (err) {
      setMensagem(err.message);
    }
  }

  if (carregando || !dadosUsuario) {
    return <p>Carregando perfil...</p>;
  }

  return (
    <main>
      <h1>Meu perfil</h1>
      <p>Papel: {dadosUsuario.role}</p>

      {role === "advogado" && (
        <p>
          Situação da OAB:{" "}
          {advogado?.verificado ? "verificada" : "em análise (aguardando aprovação do admin)"}
        </p>
      )}

      <form onSubmit={salvarUsuario}>
        <Input label="Nome" id="nome" value={nome} onChange={(e) => setNome(e.target.value)} />
        <Input
          label="Telefone"
          id="telefone"
          value={telefone}
          onChange={(e) => setTelefone(e.target.value)}
        />
        <Button type="submit">Salvar dados básicos</Button>
      </form>

      {role === "advogado" && advogado && (
        <form onSubmit={salvarAdvogado}>
          <h2>Dados de advogado</h2>
          <p>OAB: {advogado.oab?.numero}/{advogado.oab?.uf} (não editável)</p>
          <Input
            label="WhatsApp"
            id="whatsapp"
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
          />
          <Input label="Cidade" id="cidade" value={cidade} onChange={(e) => setCidade(e.target.value)} />
          <Input label="UF" id="uf" value={uf} onChange={(e) => setUf(e.target.value)} maxLength={2} />
          <Button type="submit">Salvar dados de advogado</Button>
        </form>
      )}

      {role === "admin" && (
        <p>
          <Link to="/admin/advogados">Aprovar OAB de advogados</Link>
        </p>
      )}

      {mensagem && <p role="status">{mensagem}</p>}

      <Button variant="secondary" onClick={logout}>
        Sair
      </Button>
    </main>
  );
}
