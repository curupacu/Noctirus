import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Avatar } from "../../components/Avatar/Avatar";
import { Input } from "../../components/Input/Input";
import { Button } from "../../components/Button/Button";
import { Loading } from "../../components/Loading/Loading";
import { PerfilCompletude } from "../../components/PerfilCompletude/PerfilCompletude";
import { useAuth } from "../auth/AuthContext";
import { api } from "../../lib/api";

// Dashboard do advogado (rotaInicial já manda ele pra cá) — antes essa tela era o
// dashboard E o formulário de edição juntos, rolando um dentro do outro (achado do
// usuário, 18/08: "separar isso em duas telas"). Agora só leitura rápida + atalhos;
// editar de verdade é em /perfil/editar (ver EditarPerfilPage). Cliente e admin não
// mudam — pra eles /perfil já era só um formulário pequeno, sem esse problema.
export function PerfilPage() {
  const { user, role } = useAuth();

  const [dadosUsuario, setDadosUsuario] = useState(null);
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [mensagem, setMensagem] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [advogado, setAdvogado] = useState(null);
  const [curriculo, setCurriculo] = useState(null);
  const [metricas, setMetricas] = useState(null);
  const [feedbacks, setFeedbacks] = useState(null);
  const [conversas, setConversas] = useState(null);

  useEffect(() => {
    async function carregar() {
      const usuario = await api.get("/users/me");
      setDadosUsuario(usuario);
      setNome(usuario.nome || "");
      setTelefone(usuario.telefone || "");

      if (role === "advogado") {
        const [dadosAdvogado, dadosCurriculo] = await Promise.all([
          api.get(`/advogados/${user.uid}`),
          api.get(`/curriculos/${user.uid}`),
        ]);
        setAdvogado(dadosAdvogado);
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

  if (carregando || !dadosUsuario) {
    return <Loading>Carregando perfil...</Loading>;
  }

  if (role === "advogado" && advogado) {
    const curriculoPreenchido =
      !!curriculo &&
      ["formacao", "especializacoes", "cursos", "experiencias"].some(
        (chave) => (curriculo[chave] || []).length > 0,
      );
    const itensCompletude = [
      { label: "Foto de perfil", completo: !!advogado.foto },
      { label: "Sobre você", completo: (advogado.bio || "").trim().length > 0 },
      { label: "Especialidades", completo: (advogado.especialidades || []).length > 0 },
      { label: "Currículo", completo: curriculoPreenchido },
    ];
    const primeiroNome = (dadosUsuario.nome || dadosUsuario.email || "").split(" ")[0];
    const conversasRecentes = (conversas || []).slice(0, 3);

    return (
      <main>
        <h1>
          Olá, <em className="accent">{primeiroNome}</em>
        </h1>
        <p className="text-muted">
          <span className="badge">{dadosUsuario.role}</span>{" "}
          <span className={`badge${advogado.verificado ? " badge--seal" : ""}`}>
            {advogado.verificado && (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M20 6 9 17l-5-5" />
              </svg>
            )}
            {advogado.verificado ? "OAB verificada" : "OAB em análise"}
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

        <div className="section-heading">
          <h2>Acesso rápido</h2>
        </div>
        <ul className="list-plain">
          <li>
            <Link to="/perfil/editar" className="list-row">
              <span className="list-row__title">Editar perfil</span>
              <span className="advogado-row__chevron" aria-hidden="true">›</span>
            </Link>
          </li>
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

        {feedbacks && feedbacks.length > 0 && (
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
          <li>
            <Link to="/meus-dados" className="list-row">
              <span className="list-row__title">Meus dados</span>
              <span className="advogado-row__chevron" aria-hidden="true">›</span>
            </Link>
          </li>
        </ul>
      </main>
    );
  }

  return (
    <main>
      <h1>Meu perfil</h1>
      <p>
        <span className="badge">{dadosUsuario.role}</span>
      </p>

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

      {mensagem && <p role="status">{mensagem}</p>}

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
            <li>
              <Link to="/meus-dados" className="list-row">
                <span className="list-row__title">Meus dados</span>
                <span className="advogado-row__chevron" aria-hidden="true">›</span>
              </Link>
            </li>
          </>
        )}
      </ul>
    </main>
  );
}
