import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Avatar } from "../../components/Avatar/Avatar";
import { Button } from "../../components/Button/Button";
import { ChoiceCard } from "../../components/ChoiceCard/ChoiceCard";
import { Input } from "../../components/Input/Input";
import { Loading } from "../../components/Loading/Loading";
import { PerfilCompletude } from "../../components/PerfilCompletude/PerfilCompletude";
import { useAuth } from "../auth/AuthContext";
import { CurriculoForm } from "../curriculo/CurriculoForm";
import { api } from "../../lib/api";

export function PerfilPage() {
  const { user, role } = useAuth();

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
  const [metricas, setMetricas] = useState(null);
  const [feedbacks, setFeedbacks] = useState(null);
  const [curriculo, setCurriculo] = useState(null);
  const [conversas, setConversas] = useState(null);

  useEffect(() => {
    async function carregar() {
      const usuario = await api.get("/users/me");
      setDadosUsuario(usuario);
      setNome(usuario.nome || "");
      setTelefone(usuario.telefone || "");

      if (role === "advogado") {
        const [dadosAdvogado, perguntas, dadosCurriculo] = await Promise.all([
          api.get(`/advogados/${user.uid}`),
          api.get("/triagem/perguntas"),
          api.get(`/curriculos/${user.uid}`),
        ]);
        setAdvogado(dadosAdvogado);
        setBio(dadosAdvogado.bio || "");
        setFoto(dadosAdvogado.foto || "");
        setWhatsapp(dadosAdvogado.contatos?.whatsapp || "");
        setCidade(dadosAdvogado.localizacao?.cidade || "");
        setUf(dadosAdvogado.localizacao?.uf || "");
        setEspecialidades(dadosAdvogado.especialidades || []);
        setCategoriasPorArea(perguntas.categorias);
        setCurriculo(dadosCurriculo);
      }
      setCarregando(false);
    }
    if (user && role) carregar();
  }, [user, role]);

  useEffect(() => {
    if (!user || role !== "advogado") return;
    api.get(`/advogados/${user.uid}/metricas`).then(setMetricas);
    api.get(`/advogados/${user.uid}/feedback`).then(setFeedbacks);
    api.get("/conversas/minhas").then(setConversas);
  }, [user, role]);

  function alternarEspecialidade(valor) {
    setEspecialidades((atual) =>
      atual.includes(valor) ? atual.filter((e) => e !== valor) : [...atual, valor],
    );
  }

  const curriculoPreenchido =
    !!curriculo &&
    ["formacao", "especializacoes", "cursos", "experiencias"].some(
      (chave) => (curriculo[chave] || []).length > 0,
    );

  const itensCompletude = [
    { label: "Foto de perfil", completo: !!foto },
    { label: "Sobre você", completo: bio.trim().length > 0 },
    { label: "Especialidades", completo: especialidades.length > 0 },
    { label: "Currículo", completo: curriculoPreenchido },
  ];

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

  if (carregando || !dadosUsuario) {
    return <Loading>Carregando perfil...</Loading>;
  }

  const primeiroNome = (dadosUsuario.nome || dadosUsuario.email || "").split(" ")[0];
  const conversasRecentes = (conversas || []).slice(0, 3);

  return (
    <main>
      {role === "advogado" && advogado ? (
        <>
          <h1>
            Olá, <em className="accent">{primeiroNome}</em>
          </h1>
          <p className="text-muted">
            <span className="badge">{dadosUsuario.role}</span>{" "}
            <span className={`badge${advogado?.verificado ? " badge--seal" : ""}`}>
              {advogado?.verificado && (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              )}
              {advogado?.verificado ? "OAB verificada" : "OAB em análise"}
            </span>
          </p>

          <div className="row">
            <div className="card">
              <p className="text-muted">Contatos recebidos</p>
              <p className="stat-numero">{metricas ? metricas.contatos.total : "—"}</p>
            </div>
            <div className="card">
              <p className="text-muted">Feedback dos clientes</p>
              <p className="stat-numero">{metricas ? (metricas.feedbacks.mediaNota ?? "—") : "—"}</p>
            </div>
            <div className="card">
              <p className="text-muted">Conversas</p>
              <p className="stat-numero">{conversas ? conversas.length : "—"}</p>
            </div>
          </div>

          <PerfilCompletude itens={itensCompletude} />

          <div className="section-heading">
            <h2>Conversas recentes</h2>
            {conversasRecentes.length > 0 && <Link to="/conversas">Ver todas</Link>}
          </div>
          {conversas && conversas.length === 0 && (
            <p className="text-muted">Ninguém te mandou mensagem ainda.</p>
          )}
          {conversasRecentes.length > 0 && (
            <ul className="list-plain">
              {conversasRecentes.map((c) => (
                <li key={c.comUid}>
                  <Link to={`/conversas/${c.comUid}`} state={{ nome: c.nome }} className="list-row">
                    <Avatar nome={c.nome} seed={c.comUid} />
                    <span className="list-row__info">
                      <span className="list-row__title">{c.nome || "Cliente"}</span>
                      <span className="list-row__meta">
                        {c.ultimoRemetente === "advogado" ? "Você" : "Cliente"}: {c.ultimaMensagem}
                      </span>
                    </span>
                    <span className="advogado-row__chevron" aria-hidden="true">
                      ›
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}

          <ul className="list-plain">
            <li>
              <Link to={`/advogados/${user.uid}`} className="list-row">
                <span className="list-row__title">Ver meu perfil público</span>
                <span className="advogado-row__chevron" aria-hidden="true">›</span>
              </Link>
            </li>
            <li>
              <Link to="/cartao" className="list-row">
                <span className="list-row__title">Meu cartão de visita</span>
                <span className="advogado-row__chevron" aria-hidden="true">›</span>
              </Link>
            </li>
          </ul>

          <div className="section-heading">
            <h2>Editar perfil</h2>
          </div>
        </>
      ) : (
        <>
          <h1>Meu perfil</h1>
          <p>
            <span className="badge">{dadosUsuario.role}</span>
          </p>
        </>
      )}

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

      {role === "advogado" && advogado && (
        <>
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
        </>
      )}

      {role === "advogado" && <CurriculoForm uid={user.uid} onSalvo={setCurriculo} />}

      {mensagem && <p role="status">{mensagem}</p>}

      {role === "advogado" && feedbacks && feedbacks.length > 0 && (
        <>
          <div className="section-heading">
            <h2>Avaliações recentes</h2>
          </div>
          <ul className="list-plain">
            {feedbacks.map((f) => (
              <li key={f.id} className="card">
                <span aria-label={`Nota ${f.nota} de 5`}>
                  {"★".repeat(f.nota)}
                  <span className="text-muted">{"★".repeat(5 - f.nota)}</span>
                </span>
                {f.comentario && <p style={{ marginBottom: 0 }}>{f.comentario}</p>}
              </li>
            ))}
          </ul>
        </>
      )}

      <div className="section-heading">
        <h2>Mais</h2>
      </div>
      <ul className="list-plain">
        {role === "admin" && (
          <li>
            <Link to="/admin/advogados" className="list-row">
              <span className="list-row__title">Painel administrativo</span>
              <span className="advogado-row__chevron" aria-hidden="true">›</span>
            </Link>
          </li>
        )}
        {role === "cliente" && (
          <li>
            <Link to="/meus-contatos" className="list-row">
              <span className="list-row__title">Meus contatos</span>
              <span className="advogado-row__chevron" aria-hidden="true">›</span>
            </Link>
          </li>
        )}
        {role !== "admin" && (
          <>
            <li>
              <Link to="/denunciar" className="list-row">
                <span className="list-row__title">Denunciar um problema</span>
                <span className="advogado-row__chevron" aria-hidden="true">›</span>
              </Link>
            </li>
            <li>
              <Link to="/minhas-denuncias" className="list-row">
                <span className="list-row__title">Minhas denúncias</span>
                <span className="advogado-row__chevron" aria-hidden="true">›</span>
              </Link>
            </li>
          </>
        )}
      </ul>
    </main>
  );
}
