import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Avatar } from "../../components/Avatar/Avatar";
import { Input } from "../../components/Input/Input";
import { Button } from "../../components/Button/Button";
import { CampoLocalizacao } from "../../components/CampoLocalizacao/CampoLocalizacao";
import { Loading } from "../../components/Loading/Loading";
import { PerfilCompletude } from "../../components/PerfilCompletude/PerfilCompletude";
import { SeloOab } from "../../components/SeloOab/SeloOab";
import { useAuth } from "../auth/AuthContext";
import { api } from "../../lib/api";
import { useTitulo } from "../../lib/useTitulo";
import "../painel/PainelPage.css";

// Foto de banco de imagem (Unsplash, mesma da seção "Sobre" da Home).
const FOTO_DESTAQUE_ADVOGADO =
  "https://images.unsplash.com/photo-1613837770636-cae46b162c28?auto=format&fit=crop&w=720&h=560&q=75";

function Icone({ d }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

const ATALHOS_ADVOGADO = (uid) => [
  {
    to: "/perfil/editar",
    titulo: "Editar perfil",
    texto: "Foto, bio, especialidades e currículo",
    icone: <Icone d="M4 20h4L19 9l-4-4L4 16v4ZM14 6l4 4" />,
  },
  {
    to: `/advogados/${uid}`,
    titulo: "Perfil público",
    texto: "Veja como o cliente te vê",
    icone: <Icone d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Zm10 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />,
  },
  {
    to: "/cartao",
    titulo: "Cartão de visita",
    texto: "Compartilhe com seus clientes",
    icone: <Icone d="M3 6h18v12H3zM7 10h5M7 14h8" />,
  },
  {
    to: "/meus-dados",
    titulo: "Meus dados",
    texto: "Baixe ou apague seus dados",
    icone: <Icone d="M12 3 4 6v6c0 4.5 3.4 8 8 9 4.6-1 8-4.5 8-9V6l-8-3Z" />,
  },
];

// Enquanto a OAB não está aprovada o perfil não aparece pra nenhum cliente (RF009) — o
// advogado precisa saber disso logo de cara, e o porquê quando foi recusado/revogado.
function AvisoSituacaoOab({ advogado }) {
  const situacao = advogado.situacaoOab || "em_analise";
  if (situacao === "aprovado") return null;

  const textos = {
    em_analise: {
      titulo: "Sua OAB está em análise",
      texto:
        "Estamos conferindo seu registro no Cadastro Nacional dos Advogados. Até lá, seu perfil não aparece pros clientes — você recebe um aviso assim que terminarmos.",
    },
    recusado: {
      titulo: "Não conseguimos confirmar sua OAB",
      texto: `Motivo: ${advogado.situacaoOabMotivo || "não informado"}. Corrija o número ou a UF e envie de novo.`,
      link: { to: "/perfil/editar", label: "Corrigir minha OAB" },
    },
    revogado: {
      titulo: "Sua aprovação foi revogada",
      texto: `Motivo: ${advogado.situacaoOabMotivo || "não informado"}. Seu perfil não aparece mais pros clientes.`,
    },
  }[situacao];

  return (
    <div className="card stack" role="status">
      <strong>{textos.titulo}</strong>
      <p className="text-muted" style={{ margin: 0 }}>
        {textos.texto}
      </p>
      {textos.link && (
        <Link to={textos.link.to} className="button button--secondary">
          {textos.link.label}
        </Link>
      )}
    </div>
  );
}

// Dashboard do advogado (rotaInicial já manda ele pra cá) — antes essa tela era o
// dashboard E o formulário de edição juntos, rolando um dentro do outro (achado do
// usuário, 18/08: "separar isso em duas telas"). Agora só leitura rápida + atalhos;
// editar de verdade é em /perfil/editar (ver EditarPerfilPage). Cliente e admin não
// mudam — pra eles /perfil já era só um formulário pequeno, sem esse problema.
export function PerfilPage() {
  useTitulo("Meu perfil");
  const { user, role } = useAuth();

  const [dadosUsuario, setDadosUsuario] = useState(null);
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [cidade, setCidade] = useState("");
  const [uf, setUf] = useState("");
  const [foto, setFoto] = useState("");
  const [enviandoFoto, setEnviandoFoto] = useState(false);
  const [erroFoto, setErroFoto] = useState(null);
  const [mensagem, setMensagem] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [advogado, setAdvogado] = useState(null);
  const [curriculo, setCurriculo] = useState(null);
  const [solicitacoes, setSolicitacoes] = useState(null);

  useEffect(() => {
    async function carregar() {
      const usuario = await api.get("/users/me");
      setDadosUsuario(usuario);
      setNome(usuario.nome || "");
      setTelefone(usuario.telefone || "");
      setCidade(usuario.localizacao?.cidade || "");
      setUf(usuario.localizacao?.uf || "");
      setFoto(usuario.foto || "");

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
    api.get("/solicitacoes/recebidas").then(setSolicitacoes).catch(() => setSolicitacoes([]));
  }, [user, role]);

  async function salvarUsuario(e) {
    e.preventDefault();
    setMensagem(null);
    try {
      await api.put("/users/me", {
        nome,
        telefone,
        ...(role === "cliente" ? { localizacao: { cidade, uf } } : {}),
      });
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
      const resultado = await api.upload("/users/me/foto", formData);
      setFoto(resultado.foto);
    } catch (err) {
      setErroFoto(err.message);
    } finally {
      setEnviandoFoto(false);
      e.target.value = "";
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
    const pendentes = (solicitacoes || []).filter((s) => s.situacao === "pendente");
    const emAndamento = (solicitacoes || []).filter(
      (s) => s.situacao === "aceita" && !s.arquivado && s.etapaCaso === "em_andamento",
    );

    const qtdPendentes = pendentes.length;

    return (
      <main className="painel">
        <p className="painel__ola">
          Olá, {primeiroNome} <SeloOab advogado={advogado} />
        </p>
        <h1 className="painel__titulo">Seu escritório na Nocturis</h1>

        <AvisoSituacaoOab advogado={advogado} />

        {/* Cartão de destaque: o que precisa da atenção do advogado agora. */}
        <section className="destaque">
          <img className="destaque__foto" src={FOTO_DESTAQUE_ADVOGADO} alt="" loading="lazy" />
          <div className="destaque__corpo">
            {qtdPendentes > 0 ? (
              <>
                <span className="destaque__etiqueta">Novos pedidos</span>
                <h2 className="destaque__titulo">
                  {qtdPendentes} pedido{qtdPendentes === 1 ? "" : "s"} esperando sua resposta
                </h2>
                <p className="destaque__texto">Leia o caso e aceite ou recuse. Responder rápido passa confiança.</p>
                <div className="destaque__acoes">
                  <Link to="/casos" className="button button--primary">
                    Responder agora <span className="button__arrow">→</span>
                  </Link>
                </div>
              </>
            ) : (
              <>
                <span className="destaque__etiqueta">Tudo em dia</span>
                <h2 className="destaque__titulo">Nenhum pedido esperando resposta</h2>
                <p className="destaque__texto">
                  Enquanto isso, deixe seu perfil completo: é ele que o cliente vê antes de pedir contato.
                </p>
                <div className="destaque__acoes">
                  <Link to="/casos" className="button button--primary">
                    Abrir quadro de casos <span className="button__arrow">→</span>
                  </Link>
                  <Link to={`/advogados/${user.uid}`} className="destaque__link">
                    Ver meu perfil público
                  </Link>
                </div>
              </>
            )}
          </div>
        </section>

        <div className="painel__numeros">
          <Link to="/casos" className="painel__numero">
            <strong>{solicitacoes ? qtdPendentes : "—"}</strong>
            <span>Pedidos esperando resposta</span>
          </Link>
          <Link to="/casos" className="painel__numero">
            <strong>{solicitacoes ? emAndamento.length : "—"}</strong>
            <span>Casos em andamento</span>
          </Link>
        </div>

        <PerfilCompletude itens={itensCompletude} />

        <div className="section-heading">
          <h2>Atalhos</h2>
        </div>
        <ul className="atalhos">
          {ATALHOS_ADVOGADO(user.uid).map((atalho) => (
            <li key={atalho.to}>
              <Link to={atalho.to} className="atalho">
                <span className="atalho__icone">{atalho.icone}</span>
                <strong>{atalho.titulo}</strong>
                <span>{atalho.texto}</span>
              </Link>
            </li>
          ))}
        </ul>
      </main>
    );
  }

  return (
    <main>
      <h1>Meu perfil</h1>
      <p>
        <span className="badge">{{ cliente: "Cliente", advogado: "Advogado", admin: "Administrador" }[dadosUsuario.role]}</span>
      </p>

      {role === "cliente" && (
        <div className="media" style={{ marginBottom: "var(--space-lg)" }}>
          <Avatar nome={nome} foto={foto} seed={user.uid} className="avatar-placeholder--grande" />
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
        {role === "cliente" && (
          <CampoLocalizacao cidade={cidade} uf={uf} onCidade={setCidade} onUf={setUf} required />
        )}
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
            <Link to="/minhas-solicitacoes" className="list-row">
              <span className="list-row__title">Minhas solicitações</span>
              <span className="advogado-row__chevron" aria-hidden="true">›</span>
            </Link>
          </li>
        )}
        {role !== "admin" && (
          <li>
            <Link to="/meus-dados" className="list-row">
              <span className="list-row__title">Meus dados</span>
              <span className="advogado-row__chevron" aria-hidden="true">›</span>
            </Link>
          </li>
        )}
      </ul>
    </main>
  );
}
