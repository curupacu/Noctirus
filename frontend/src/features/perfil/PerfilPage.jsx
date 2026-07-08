import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "../../components/Button/Button";
import { Input } from "../../components/Input/Input";
import { useAuth } from "../auth/AuthContext";
import { CurriculoForm } from "../curriculo/CurriculoForm";
import { api } from "../../lib/api";

export function PerfilPage() {
  const { user, role } = useAuth();

  const [dadosUsuario, setDadosUsuario] = useState(null);
  const [advogado, setAdvogado] = useState(null);
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [cidade, setCidade] = useState("");
  const [uf, setUf] = useState("");
  const [categoriasPorArea, setCategoriasPorArea] = useState(null);
  const [especialidades, setEspecialidades] = useState([]);
  const [mensagem, setMensagem] = useState(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    async function carregar() {
      const usuario = await api.get("/users/me");
      setDadosUsuario(usuario);
      setNome(usuario.nome || "");
      setTelefone(usuario.telefone || "");

      if (role === "advogado") {
        const [dadosAdvogado, perguntas] = await Promise.all([
          api.get(`/advogados/${user.uid}`),
          api.get("/triagem/perguntas"),
        ]);
        setAdvogado(dadosAdvogado);
        setWhatsapp(dadosAdvogado.contatos?.whatsapp || "");
        setCidade(dadosAdvogado.localizacao?.cidade || "");
        setUf(dadosAdvogado.localizacao?.uf || "");
        setEspecialidades(dadosAdvogado.especialidades || []);
        setCategoriasPorArea(perguntas.categorias);
      }
      setCarregando(false);
    }
    if (user && role) carregar();
  }, [user, role]);

  function alternarEspecialidade(valor) {
    setEspecialidades((atual) =>
      atual.includes(valor) ? atual.filter((e) => e !== valor) : [...atual, valor],
    );
  }

  const especialidadesDisponiveis = (categoriasPorArea && advogado
    ? (advogado.areasAtuacao || []).flatMap((area) => categoriasPorArea[area] || [])
    : []
  ).filter((c, i, lista) => lista.findIndex((c2) => c2.valor === c.valor) === i);

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
        especialidades,
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

          {especialidadesDisponiveis.length > 0 && (
            <fieldset>
              <legend>Especialidades</legend>
              <p>Ajuda o cliente a ver se você atende o assunto específico do caso dele.</p>
              {especialidadesDisponiveis.map((c) => (
                <label key={c.valor}>
                  <input
                    type="checkbox"
                    checked={especialidades.includes(c.valor)}
                    onChange={() => alternarEspecialidade(c.valor)}
                  />
                  {c.label}
                </label>
              ))}
            </fieldset>
          )}

          <Button type="submit">Salvar dados de advogado</Button>
        </form>
      )}

      {role === "advogado" && (
        <>
          <CurriculoForm uid={user.uid} />
          <p>
            <Link to={`/advogados/${user.uid}`}>Ver meu perfil público</Link>
          </p>
        </>
      )}

      {role === "admin" && (
        <p>
          <Link to="/admin/advogados">Aprovar OAB de advogados</Link>
        </p>
      )}

      {mensagem && <p role="status">{mensagem}</p>}
    </main>
  );
}
