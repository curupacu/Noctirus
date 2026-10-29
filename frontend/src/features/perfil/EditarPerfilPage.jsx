import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Avatar } from "../../components/Avatar/Avatar";
import { Button } from "../../components/Button/Button";
import { CampoLocalizacao } from "../../components/CampoLocalizacao/CampoLocalizacao";
import { Input } from "../../components/Input/Input";
import { EsqueletoPagina } from "../../components/Esqueleto/Esqueleto";
import { useAuth } from "../auth/AuthContext";
import { CurriculoForm } from "../curriculo/CurriculoForm";
import { api } from "../../lib/api";
import { useTitulo } from "../../lib/useTitulo";
import "../advogados/AdvogadoPublicoPage.css";
import "../auth/entrada.css";
import "./EditarPerfilPage.css";
import { LABEL_AREA } from "../../lib/areas";

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
  const [oabNumero, setOabNumero] = useState("");
  const [oabUf, setOabUf] = useState("");
  const [mensagemOab, setMensagemOab] = useState(null);
  const [categoriasPorArea, setCategoriasPorArea] = useState(null);
  const [especialidades, setEspecialidades] = useState([]);
  const [mensagem, setMensagem] = useState(null);
  const [salvando, setSalvando] = useState(false);
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
      setOabNumero(dadosAdvogado.oab?.numero || "");
      setOabUf(dadosAdvogado.oab?.uf || "");
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

  // Um botão só salva tudo (antes eram "Salvar dados básicos" e "Salvar dados de
  // advogado", e quem salvava um achava que tinha salvo o outro).
  async function salvarTudo(e) {
    e.preventDefault();
    setMensagem(null);
    setSalvando(true);
    try {
      await Promise.all([
        api.put("/users/me", { nome, telefone }),
        api.put(`/advogados/${user.uid}`, {
          bio,
          whatsapp,
          localizacao: { cidade, uf },
          especialidades,
        }),
      ]);
      setMensagem("Alterações salvas.");
    } catch (err) {
      setMensagem(err.message);
    } finally {
      setSalvando(false);
    }
  }

  // Só depois de uma recusa: o advogado corrige o número/UF e o cadastro volta pra análise.
  async function reenviarOab(e) {
    e.preventDefault();
    setMensagemOab(null);
    try {
      await api.put(`/advogados/${user.uid}`, { oab: { numero: oabNumero, uf: oabUf } });
      setAdvogado((atual) => ({
        ...atual,
        oab: { numero: oabNumero, uf: oabUf.toUpperCase() },
        situacaoOab: "em_analise",
        situacaoOabMotivo: null,
      }));
      setMensagemOab("Enviado! Sua OAB voltou para análise. Você recebe um aviso quando conferirmos.");
    } catch (err) {
      setMensagemOab(err.message);
    }
  }

  if (carregando || !dadosUsuario || !advogado) {
    return <EsqueletoPagina />;
  }

  const grupos = (advogado.areasAtuacao || [])
    .map((area) => ({ area, opcoes: categoriasPorArea?.[area] || [] }))
    .filter((g) => g.opcoes.length > 0);

  return (
    <main className="editar-perfil">
      <Link to="/perfil" className="perfil-adv__voltar">
        ← Voltar para o painel
      </Link>
      <h1>Editar perfil</h1>

      {/* Topo: foto + OAB. A foto sobe sozinha ao escolher o arquivo. */}
      <section className="card editar-perfil__topo">
        <Avatar nome={advogado.nome} foto={foto} seed={user.uid} className="avatar-placeholder--grande" />
        <div className="stack">
          <strong>{nome || advogado.nome}</strong>
          <span className="text-muted">
            OAB {advogado.oab?.numero}/{advogado.oab?.uf}
          </span>
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
      </section>

      {advogado.situacaoOab === "recusado" && (
        <form className="card stack" onSubmit={reenviarOab}>
          <strong>Corrigir minha OAB</strong>
          <p className="text-muted" style={{ margin: 0 }}>
            Não conseguimos confirmar o número informado
            {advogado.situacaoOabMotivo ? ` (${advogado.situacaoOabMotivo})` : ""}. Confira os dados
            e envie de novo para análise.
          </p>
          <div className="row">
            <Input
              label="Número da OAB"
              id="oabNumero"
              value={oabNumero}
              onChange={(e) => setOabNumero(e.target.value)}
              required
            />
            <Input
              label="UF da OAB"
              id="oabUf"
              value={oabUf}
              onChange={(e) => setOabUf(e.target.value)}
              maxLength={2}
              required
            />
          </div>
          <Button type="submit">Reenviar para análise</Button>
        </form>
      )}
      {mensagemOab && <p role="status">{mensagemOab}</p>}

      <form id="form-perfil" onSubmit={salvarTudo}>
        <section className="card stack">
          <h2>Apresentação</h2>
          <div className="input-group">
            <label className="input-label" htmlFor="bio">
              Sobre você
            </label>
            <textarea
              id="bio"
              className="input"
              rows={3}
              maxLength={240}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Ex.: Advogada trabalhista há 8 anos, focada em casos de rescisão indireta e assédio moral."
            />
            <p className="text-muted char-counter">
              Aparece no topo do seu perfil público · {bio.length}/240
            </p>
          </div>
        </section>

        <section className="card stack">
          <h2>Contato e localização</h2>
          <Input label="Nome" id="nome" value={nome} onChange={(e) => setNome(e.target.value)} />
          <div className="editar-perfil__dupla">
            <Input label="Telefone" id="telefone" value={telefone} onChange={(e) => setTelefone(e.target.value)} />
            <Input label="WhatsApp" id="whatsapp" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} />
          </div>
          <CampoLocalizacao cidade={cidade} uf={uf} onCidade={setCidade} onUf={setUf} required />
          <p className="text-muted" style={{ margin: 0 }}>
            O WhatsApp só é mostrado para o cliente depois que você aceita o pedido dele.
          </p>
        </section>

        {grupos.length > 0 && (
          <section className="card">
            <h2>Especialidades</h2>
            <p className="text-muted">Toque nos assuntos que você atende. O cliente vê isso no seu perfil.</p>
            {grupos.map((g) => (
              <div key={g.area}>
                <p className="chips__grupo">{LABEL_AREA[g.area] || g.area}</p>
                <ul className="chips">
                  {g.opcoes.map((c) => (
                    <li key={c.valor}>
                      <button
                        type="button"
                        className="chip-opcao"
                        aria-pressed={especialidades.includes(c.valor)}
                        onClick={() => alternarEspecialidade(c.valor)}
                      >
                        {c.label}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </section>
        )}

        <div className="editar-perfil__barra">
          {mensagem ? <span role="status">{mensagem}</span> : <span>Lembre de salvar antes de sair.</span>}
          <Button type="submit" disabled={salvando}>
            {salvando ? "Salvando..." : "Salvar alterações"}
          </Button>
        </div>
      </form>

      <section className="card">
        <CurriculoForm uid={user.uid} onSalvo={setCurriculo} />
      </section>
    </main>
  );
}
