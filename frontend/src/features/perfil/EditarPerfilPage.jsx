import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Avatar } from "../../components/Avatar/Avatar";
import { Button } from "../../components/Button/Button";
import { ChoiceCard } from "../../components/ChoiceCard/ChoiceCard";
import { Input } from "../../components/Input/Input";
import { Loading } from "../../components/Loading/Loading";
import { useAuth } from "../auth/AuthContext";
import { CurriculoForm } from "../curriculo/CurriculoForm";
import { api } from "../../lib/api";
import { useTitulo } from "../../lib/useTitulo";

// Formulário de edição do advogado — antes vivia dentro de /perfil junto com o
// dashboard; separado pra /perfil/editar a pedido do usuário (18/08/2026).
export function EditarPerfilPage() {
  useTitulo("Editar perfil");
  const { user } = useAuth();

  const [dadosUsuario, setDadosUsuario] = useState(null);
  const [advogado, setAdvogado] = useState(null);
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [bio, setBio] = useState("");
  const [foto, setFoto] = useState("");
  const [enviandoFoto, setEnviandoFoto] = useState(false);
  const [erroFoto, setErroFoto] = useState(null);
  const [whatsapp, setWhatsapp] = useState("");
  const [cidade, setCidade] = useState("");
  const [uf, setUf] = useState("");
  const [categoriasPorArea, setCategoriasPorArea] = useState(null);
  const [especialidades, setEspecialidades] = useState([]);
  const [mensagem, setMensagem] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [, setCurriculo] = useState(null);

  useEffect(() => {
    async function carregar() {
      const [usuario, dadosAdvogado, perguntas, dadosCurriculo] = await Promise.all([
        api.get("/users/me"),
        api.get(`/advogados/${user.uid}`),
        api.get("/triagem/perguntas"),
        api.get(`/curriculos/${user.uid}`),
      ]);
      setDadosUsuario(usuario);
      setNome(usuario.nome || "");
      setTelefone(usuario.telefone || "");
      setAdvogado(dadosAdvogado);
      setBio(dadosAdvogado.bio || "");
      setFoto(dadosAdvogado.foto || "");
      setWhatsapp(dadosAdvogado.contatos?.whatsapp || "");
      setCidade(dadosAdvogado.localizacao?.cidade || "");
      setUf(dadosAdvogado.localizacao?.uf || "");
      setEspecialidades(dadosAdvogado.especialidades || []);
      setCategoriasPorArea(perguntas.categorias);
      setCurriculo(dadosCurriculo);
      setCarregando(false);
    }
    if (user) carregar();
  }, [user]);

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

  async function enviarFoto(e) {
    const arquivo = e.target.files?.[0];
    if (!arquivo) return;

    setErroFoto(null);
    setEnviandoFoto(true);
    try {
      const formData = new FormData();
      formData.append("foto", arquivo);
      const resultado = await api.upload(`/advogados/${user.uid}/foto`, formData);
      setFoto(resultado.foto);
    } catch (err) {
      setErroFoto(err.message);
    } finally {
      setEnviandoFoto(false);
      e.target.value = "";
    }
  }

  async function salvarAdvogado(e) {
    e.preventDefault();
    setMensagem(null);
    try {
      await api.put(`/advogados/${user.uid}`, {
        bio,
        whatsapp,
        localizacao: { cidade, uf },
        especialidades,
      });
      setMensagem("Dados salvos.");
    } catch (err) {
      setMensagem(err.message);
    }
  }

  if (carregando || !dadosUsuario || !advogado) {
    return <Loading>Carregando perfil...</Loading>;
  }

  return (
    <main>
      <p className="text-muted resultado-proximos-passos" style={{ marginTop: 0 }}>
        <Link to="/perfil">‹ Voltar pro meu perfil</Link>
      </p>

      <h1>Editar perfil</h1>

      <div className="section-heading">
        <h2>Dados básicos</h2>
      </div>
      <form className="stack" onSubmit={salvarUsuario}>
        <Input label="Nome" id="nome" value={nome} onChange={(e) => setNome(e.target.value)} />
        <Input
          label="Telefone"
          id="telefone"
          value={telefone}
          onChange={(e) => setTelefone(e.target.value)}
        />
        <Button type="submit">Salvar dados básicos</Button>
      </form>

      <div className="section-heading">
        <h2>Dados de advogado</h2>
      </div>

      <div className="media">
        <Avatar nome={advogado.nome} foto={foto} seed={user.uid} className="avatar-placeholder--grande" />
        <div className="stack">
          <label className="button button--secondary" htmlFor="foto">
            {enviandoFoto ? "Enviando..." : foto ? "Trocar foto" : "Adicionar foto"}
          </label>
          <input
            id="foto"
            type="file"
            accept="image/*"
            className="visually-hidden"
            onChange={enviarFoto}
            disabled={enviandoFoto}
          />
          {erroFoto && <p role="alert">{erroFoto}</p>}
        </div>
      </div>

      <form className="stack" onSubmit={salvarAdvogado}>
        <p className="text-muted">
          OAB: {advogado.oab?.numero}/{advogado.oab?.uf} (não editável)
        </p>

        <div className="input-group">
          <label className="input-label" htmlFor="bio">
            Sobre você
          </label>
          <p className="text-muted">
            Uma ou duas frases pra se apresentar — aparece no topo do seu perfil
            público e na listagem.
          </p>
          <textarea
            id="bio"
            className="input"
            rows={3}
            maxLength={240}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Ex.: Advogada trabalhista há 8 anos, focada em casos de rescisão indireta e assédio moral."
          />
          <p className="text-muted char-counter">{bio.length}/240</p>
        </div>

        <Input
          label="WhatsApp"
          id="whatsapp"
          value={whatsapp}
          onChange={(e) => setWhatsapp(e.target.value)}
        />
        <div className="row">
          <Input label="Cidade" id="cidade" value={cidade} onChange={(e) => setCidade(e.target.value)} />
          <Input label="UF" id="uf" value={uf} onChange={(e) => setUf(e.target.value)} maxLength={2} />
        </div>

        {especialidadesDisponiveis.length > 0 && (
          <div className="input-group">
            <label className="input-label">Especialidades</label>
            <p className="text-muted">
              Ajuda o cliente a ver se você atende o assunto específico do caso dele.
            </p>
            <div className="choice-grid">
              {especialidadesDisponiveis.map((c) => (
                <ChoiceCard
                  key={c.valor}
                  type="checkbox"
                  label={c.label}
                  checked={especialidades.includes(c.valor)}
                  onChange={() => alternarEspecialidade(c.valor)}
                />
              ))}
            </div>
          </div>
        )}

        <Button type="submit">Salvar dados de advogado</Button>
      </form>

      <CurriculoForm uid={user.uid} onSalvo={setCurriculo} />

      {mensagem && <p role="status">{mensagem}</p>}
    </main>
  );
}
