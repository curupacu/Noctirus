import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { BotaoGoogle } from "../../components/BotaoGoogle/BotaoGoogle";
import { Button } from "../../components/Button/Button";
import { ChoiceCard } from "../../components/ChoiceCard/ChoiceCard";
import { Input } from "../../components/Input/Input";
import { Logo } from "../../components/Logo/Logo";
import { api } from "../../lib/api";
import { auth } from "../../lib/firebase";
import { useTitulo } from "../../lib/useTitulo";
import { useAuth } from "./AuthContext";
import { rotaInicial } from "./rotaInicial";

const AREAS = [
  { valor: "civel", label: "Cível" },
  { valor: "trabalhista", label: "Trabalhista" },
];

export function CadastroPage() {
  useTitulo("Criar conta");
  const { cadastrar, loginComGoogle, atualizarRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [role, setRole] = useState("cliente");
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [telefone, setTelefone] = useState("");
  const [oabNumero, setOabNumero] = useState("");
  const [oabUf, setOabUf] = useState("");
  const [cidade, setCidade] = useState("");
  const [uf, setUf] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [areasAtuacao, setAreasAtuacao] = useState([]);
  const [categoriasPorArea, setCategoriasPorArea] = useState(null);
  const [especialidades, setEspecialidades] = useState([]);
  const [aceitouPoliticaPrivacidade, setAceitouPoliticaPrivacidade] = useState(false);
  // Preenchido quando o cadastro vem via Google — pula e-mail/senha, porque o Firebase já
  // autenticou a pessoa (ver loginComGoogle/BotaoGoogle abaixo).
  const [contaGoogle, setContaGoogle] = useState(null);
  const [erro, setErro] = useState(null);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    api.get("/triagem/perguntas").then((dados) => setCategoriasPorArea(dados.categorias));
  }, []);

  // Chegou aqui vindo do botão "Entrar com Google" da LoginPage (conta sem role ainda) —
  // já está autenticado, não precisa abrir o popup de novo.
  useEffect(() => {
    if (location.state?.viaGoogle && auth.currentUser) {
      setContaGoogle(auth.currentUser);
      setNome(auth.currentUser.displayName || "");
    }
  }, [location.state]);

  async function cadastrarComGoogle() {
    setErro(null);
    try {
      const { user, role: roleExistente } = await loginComGoogle();
      if (roleExistente) {
        navigate(rotaInicial(roleExistente));
        return;
      }
      setContaGoogle(user);
      setNome(user.displayName || "");
    } catch {
      setErro("Não foi possível conectar com o Google");
    }
  }

  function alternarArea(area) {
    setAreasAtuacao((atual) =>
      atual.includes(area) ? atual.filter((a) => a !== area) : [...atual, area],
    );
  }

  function alternarEspecialidade(valor) {
    setEspecialidades((atual) =>
      atual.includes(valor) ? atual.filter((e) => e !== valor) : [...atual, valor],
    );
  }

  const especialidadesDisponiveis = (categoriasPorArea
    ? areasAtuacao.flatMap((area) => categoriasPorArea[area] || [])
    : []
  ).filter((c, i, lista) => lista.findIndex((c2) => c2.valor === c.valor) === i);

  useEffect(() => {
    const valoresDisponiveis = especialidadesDisponiveis.map((c) => c.valor);
    setEspecialidades((atual) => atual.filter((e) => valoresDisponiveis.includes(e)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [areasAtuacao, categoriasPorArea]);

  async function criarConta(e) {
    e.preventDefault();
    setErro(null);
    setEnviando(true);

    // Só cria (e só desfaz em caso de erro) uma conta nova por e-mail/senha. A conta do
    // Google já existia antes desse formulário — se completar-cadastro falhar, não faz
    // sentido apagar o login Google da pessoa, só o cadastro na Nocturis não terminou.
    let usuarioCriado = null;
    try {
      if (!contaGoogle) {
        usuarioCriado = await cadastrar(email, senha);
      }

      await api.post("/auth/completar-cadastro", {
        role,
        nome,
        telefone,
        aceitouPoliticaPrivacidade,
        ...(role === "advogado"
          ? {
              oab: { numero: oabNumero, uf: oabUf },
              areasAtuacao,
              especialidades,
              localizacao: { cidade, uf },
              whatsapp,
            }
          : {}),
      });

      const roleLogado = await atualizarRole();
      navigate(rotaInicial(roleLogado));
    } catch (err) {
      if (usuarioCriado) {
        await usuarioCriado.delete().catch(() => {});
      }
      setErro(err.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <main className="auth-screen">
      <Link to="/" className="auth-screen__close" aria-label="Voltar para o início">
        ×
      </Link>

      <div className="auth-screen__inner">
        <Logo className="auth-screen__logo step-enter" />
        <div className="auth-screen__header step-enter" style={{ animationDelay: "80ms" }}>
          <h1>Criar conta</h1>
          <p>Leva menos de 2 minutos.</p>
        </div>

        <form
          className="auth-screen__form step-enter"
          style={{ animationDelay: "160ms" }}
          onSubmit={criarConta}
        >
          <div className="input-group">
            <label className="input-label">Você é:</label>
            <div className="choice-grid">
              <ChoiceCard
                type="radio"
                name="role"
                label="Cliente"
                description="Quero encontrar um advogado"
                checked={role === "cliente"}
                onChange={() => setRole("cliente")}
              />
              <ChoiceCard
                type="radio"
                name="role"
                label="Advogado"
                description="Quero atender clientes"
                checked={role === "advogado"}
                onChange={() => setRole("advogado")}
              />
            </div>
          </div>

          {!contaGoogle && (
            <>
              <BotaoGoogle onClick={cadastrarComGoogle} style={{ width: "100%" }}>
                Cadastrar com Google
              </BotaoGoogle>
              <p className="text-muted" style={{ textAlign: "center", margin: 0 }}>
                ou
              </p>
            </>
          )}

          {contaGoogle && (
            <p className="text-muted">
              Conectado como <strong>{contaGoogle.email}</strong> via Google.
            </p>
          )}

          <Input label="Nome" id="nome" value={nome} onChange={(e) => setNome(e.target.value)} required />
          {!contaGoogle && (
            <>
              <Input
                label="E-mail"
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Input
                label="Senha"
                id="senha"
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                minLength={6}
                required
              />
            </>
          )}
          <Input
            label="Telefone"
            id="telefone"
            value={telefone}
            onChange={(e) => setTelefone(e.target.value)}
          />

          {role === "advogado" && (
            <>
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

              <div className="input-group">
                <label className="input-label">Áreas de atuação</label>
                <div className="choice-grid">
                  {AREAS.map((area) => (
                    <ChoiceCard
                      key={area.valor}
                      type="checkbox"
                      label={area.label}
                      checked={areasAtuacao.includes(area.valor)}
                      onChange={() => alternarArea(area.valor)}
                    />
                  ))}
                </div>
              </div>

              {especialidadesDisponiveis.length > 0 && (
                <div className="input-group">
                  <label className="input-label">Especialidades (opcional)</label>
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

              <div className="row">
                <Input label="Cidade" id="cidade" value={cidade} onChange={(e) => setCidade(e.target.value)} />
                <Input label="UF" id="uf" value={uf} onChange={(e) => setUf(e.target.value)} maxLength={2} />
              </div>
              <Input
                label="WhatsApp"
                id="whatsapp"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
              />
              <p className="text-muted">
                Sua OAB fica em análise até a aprovação manual do admin — hoje não existe API
                gratuita da OAB pra verificar isso automaticamente.
              </p>
            </>
          )}

          <label style={{ display: "flex", alignItems: "flex-start", gap: "8px", fontSize: "var(--font-size-sm)" }}>
            <input
              type="checkbox"
              checked={aceitouPoliticaPrivacidade}
              onChange={(e) => setAceitouPoliticaPrivacidade(e.target.checked)}
              required
              style={{ marginTop: "3px" }}
            />
            <span>
              Li e aceito a{" "}
              <Link to="/privacidade" target="_blank" rel="noreferrer">
                política de privacidade
              </Link>
              .
            </span>
          </label>

          {erro && <p role="alert">{erro}</p>}

          <Button type="submit" disabled={enviando || !aceitouPoliticaPrivacidade}>
            {enviando ? "Criando conta..." : "Criar conta"}
          </Button>
        </form>
      </div>
    </main>
  );
}
