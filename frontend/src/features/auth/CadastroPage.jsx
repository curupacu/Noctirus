import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { BotaoGoogle } from "../../components/BotaoGoogle/BotaoGoogle";
import { Button } from "../../components/Button/Button";
import { CampoLocalizacao } from "../../components/CampoLocalizacao/CampoLocalizacao";
import { ChoiceCard } from "../../components/ChoiceCard/ChoiceCard";
import { Input } from "../../components/Input/Input";
import { api } from "../../lib/api";
import { auth } from "../../lib/firebase";
import { UFS } from "../../lib/localizacao";
import { useTitulo } from "../../lib/useTitulo";
import { useAuth } from "./AuthContext";
import { CampoSenha, EntradaLayout, LogoEntrada } from "./EntradaLayout";
import { rotaInicial } from "./rotaInicial";

const AREAS = [
  { valor: "civel", label: "Cível" },
  { valor: "trabalhista", label: "Trabalhista" },
];

// Etapas do cadastro (uma por tela, como na referência). O advogado tem uma a mais, pra
// escolher áreas e especialidades.
const ETAPAS = {
  cliente: ["papel", "dados", "local"],
  advogado: ["papel", "dados", "local", "atuacao"],
};

const MENSAGENS_ERRO_FIREBASE = {
  "auth/email-already-in-use": "Esse e-mail já tem conta na Nocturis. Entre ou recupere a senha.",
  "auth/invalid-email": "Esse e-mail não parece válido.",
  "auth/weak-password": "Escolha uma senha com pelo menos 6 caracteres.",
};

function IconeUsuario() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </svg>
  );
}

export function CadastroPage() {
  useTitulo("Criar conta");
  const { cadastrar, loginComGoogle, atualizarRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [etapa, setEtapa] = useState(0);
  const [role, setRole] = useState("cliente");
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [senha2, setSenha2] = useState("");
  const [telefone, setTelefone] = useState("");
  const [oabNumero, setOabNumero] = useState("");
  const [oabUf, setOabUf] = useState("");
  const [cidade, setCidade] = useState("");
  const [uf, setUf] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [areasAtuacao, setAreasAtuacao] = useState([]);
  const [categoriasPorArea, setCategoriasPorArea] = useState(null);
  const [erroCategorias, setErroCategorias] = useState(false);
  const [especialidades, setEspecialidades] = useState([]);
  const [aceitouPoliticaPrivacidade, setAceitouPoliticaPrivacidade] = useState(false);
  // Preenchido quando o cadastro vem via Google — pula e-mail/senha, porque o Firebase já
  // autenticou a pessoa (ver loginComGoogle/BotaoGoogle abaixo).
  const [contaGoogle, setContaGoogle] = useState(null);
  const [erro, setErro] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [concluido, setConcluido] = useState(null);

  const etapas = ETAPAS[role];
  const nomeEtapa = etapas[etapa];
  const ultima = etapa === etapas.length - 1;

  // Lista de especialidades (a mesma taxonomia da triagem). Se a API não responder (ex.:
  // Render acordando), a etapa de atuação avisa e deixa tentar de novo ou seguir só com a área.
  function carregarCategorias() {
    setErroCategorias(false);
    api
      .get("/triagem/perguntas")
      .then((dados) => setCategoriasPorArea(dados.categorias))
      .catch(() => setErroCategorias(true));
  }

  useEffect(carregarCategorias, []);

  // Chegou aqui vindo do botão "Entrar com Google" da LoginPage (conta sem role ainda) —
  // já está autenticado, não precisa abrir o popup de novo.
  useEffect(() => {
    if (location.state?.viaGoogle && auth.currentUser) {
      setContaGoogle(auth.currentUser);
      setNome(auth.currentUser.displayName || "");
    }
  }, [location.state]);

  // Depois do "Conta criada!", entra no app.
  useEffect(() => {
    if (!concluido) return;
    const timer = setTimeout(() => navigate(rotaInicial(concluido)), 1800);
    return () => clearTimeout(timer);
  }, [concluido, navigate]);

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
      setEtapa(1);
    } catch {
      setErro("Não foi possível conectar com o Google");
    }
  }

  function alternar(lista, setLista, valor) {
    setLista(lista.includes(valor) ? lista.filter((v) => v !== valor) : [...lista, valor]);
  }

  function alternarArea(area) {
    const novas = areasAtuacao.includes(area) ? areasAtuacao.filter((a) => a !== area) : [...areasAtuacao, area];
    setAreasAtuacao(novas);
    // Especialidade de uma área desmarcada sai junto.
    const validas = novas.flatMap((a) => (categoriasPorArea?.[a] || []).map((c) => c.valor));
    setEspecialidades((atual) => atual.filter((e) => validas.includes(e)));
  }

  // Confere a etapa atual antes de avançar — o erro aparece na própria etapa, em vez de só
  // no fim do cadastro.
  function erroDaEtapa() {
    if (nomeEtapa === "dados") {
      if (nome.trim().length < 2) return "Informe seu nome.";
      if (!contaGoogle) {
        if (!/^\S+@\S+\.\S+$/.test(email.trim())) return "Informe um e-mail válido.";
        if (senha.length < 6) return "A senha precisa ter pelo menos 6 caracteres.";
        if (senha !== senha2) return "As duas senhas não são iguais.";
      }
    }
    if (nomeEtapa === "local") {
      if (cidade.trim().length < 2 || !uf) return "Informe sua cidade e o estado.";
      if (role === "advogado") {
        if (!/^\d{4,7}$/.test(oabNumero.trim())) return "O número da OAB tem de 4 a 7 dígitos.";
        if (!oabUf) return "Escolha a UF da sua OAB.";
      }
    }
    if (nomeEtapa === "atuacao" && areasAtuacao.length === 0) {
      return "Escolha pelo menos uma área de atuação.";
    }
    return null;
  }

  function voltar() {
    setErro(null);
    if (etapa === 0) navigate("/");
    else setEtapa((e) => e - 1);
  }

  async function avancar(e) {
    e.preventDefault();
    const problema = erroDaEtapa();
    if (problema) {
      setErro(problema);
      return;
    }
    setErro(null);
    if (!ultima) {
      setEtapa((n) => n + 1);
      window.scrollTo({ top: 0 });
      return;
    }
    await criarConta();
  }

  async function criarConta() {
    setEnviando(true);
    // Só cria (e só desfaz em caso de erro) uma conta nova por e-mail/senha. A conta do
    // Google já existia antes desse formulário — se completar-cadastro falhar, não faz
    // sentido apagar o login Google da pessoa, só o cadastro na Nocturis não terminou.
    let usuarioCriado = null;
    try {
      if (!contaGoogle) {
        usuarioCriado = await cadastrar(email.trim(), senha);
      }

      await api.post("/auth/completar-cadastro", {
        role,
        nome: nome.trim(),
        telefone,
        aceitouPoliticaPrivacidade,
        localizacao: { cidade, uf },
        ...(role === "advogado"
          ? { oab: { numero: oabNumero.trim(), uf: oabUf }, areasAtuacao, especialidades, whatsapp }
          : {}),
      });

      const roleLogado = await atualizarRole();
      setConcluido(roleLogado || role);
    } catch (err) {
      if (usuarioCriado) {
        await usuarioCriado.delete().catch(() => {});
      }
      setErro(MENSAGENS_ERRO_FIREBASE[err.code] || err.message);
    } finally {
      setEnviando(false);
    }
  }

  const textoBotao = enviando ? "Criando conta..." : ultima ? "Criar conta" : "Continuar";

  return (
    <EntradaLayout
      voltar={voltar}
      rotuloVoltar={etapa === 0 ? "Voltar para o início" : "Etapa anterior"}
      progresso={(etapa + 1) / etapas.length}
    >
      <form className="entrada__form entrada__passo" key={nomeEtapa} onSubmit={avancar} noValidate>
        {nomeEtapa === "papel" && (
          <>
            <div>
              <LogoEntrada />
              <h1 className="entrada__titulo">Vamos criar sua conta</h1>
              <p className="entrada__sub" style={{ margin: 0 }}>
                É grátis. Primeiro, conta pra gente quem é você.
              </p>
            </div>
            <div className="choice-grid">
              <ChoiceCard
                type="radio"
                name="role"
                label="Preciso de um advogado"
                description="Conto meu caso e encontro quem atende perto de mim"
                checked={role === "cliente"}
                onChange={() => setRole("cliente")}
              />
              <ChoiceCard
                type="radio"
                name="role"
                label="Sou advogado"
                description="Quero receber casos da minha área"
                checked={role === "advogado"}
                onChange={() => setRole("advogado")}
              />
            </div>
            {contaGoogle ? (
              <p className="entrada__sub" style={{ margin: 0 }}>
                Conectado como <strong>{contaGoogle.email}</strong> via Google.
              </p>
            ) : (
              <>
                <BotaoGoogle onClick={cadastrarComGoogle}>Continuar com Google</BotaoGoogle>
                <p className="entrada__ou" style={{ margin: "4px 0 -20px" }}>
                  ou
                </p>
              </>
            )}
          </>
        )}

        {nomeEtapa === "dados" && (
          <>
            <div>
              <h1 className="entrada__titulo">Seus dados</h1>
              <p className="entrada__sub" style={{ margin: 0 }}>
                {role === "advogado"
                  ? "Seu nome aparece no seu perfil profissional. O e-mail é pra você entrar."
                  : "Só você vê seus dados. O advogado só vê seu nome se aceitar seu pedido de contato."}
              </p>
            </div>
            <Input
              label="Nome completo"
              id="nome"
              autoComplete="name"
              placeholder="Como você se chama"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
            />
            {!contaGoogle && (
              <>
                <Input
                  label="E-mail"
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <CampoSenha
                  label="Senha"
                  id="senha"
                  autoComplete="new-password"
                  placeholder="Pelo menos 6 caracteres"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                />
                <CampoSenha
                  label="Confirme a senha"
                  id="senha2"
                  autoComplete="new-password"
                  placeholder="Digite a senha de novo"
                  value={senha2}
                  onChange={(e) => setSenha2(e.target.value)}
                />
              </>
            )}
            <Input
              label="Telefone (opcional)"
              id="telefone"
              type="tel"
              autoComplete="tel"
              placeholder="(11) 90000-0000"
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
            />
          </>
        )}

        {nomeEtapa === "local" && (
          <>
            <div>
              <h1 className="entrada__titulo">{role === "advogado" ? "Onde você atende?" : "Onde você mora?"}</h1>
              <p className="entrada__sub" style={{ margin: 0 }}>
                {role === "advogado"
                  ? "Os clientes da sua região veem você primeiro. Sua OAB fica em análise até a gente conferir no Cadastro Nacional dos Advogados."
                  : "Usamos sua cidade pra mostrar primeiro os advogados perto de você."}
              </p>
            </div>
            <CampoLocalizacao cidade={cidade} uf={uf} onCidade={setCidade} onUf={setUf} />
            {role === "advogado" && (
              <>
                <div className="row">
                  <Input
                    label="Número da OAB"
                    id="oabNumero"
                    inputMode="numeric"
                    placeholder="123456"
                    value={oabNumero}
                    onChange={(e) => setOabNumero(e.target.value.replace(/\D/g, ""))}
                  />
                  <div className="input-group">
                    <label className="input-label" htmlFor="oabUf">
                      UF da OAB
                    </label>
                    <select id="oabUf" className="input" value={oabUf} onChange={(e) => setOabUf(e.target.value)}>
                      <option value="">—</option>
                      {UFS.map((sigla) => (
                        <option key={sigla} value={sigla}>
                          {sigla}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <Input
                  label="WhatsApp (opcional)"
                  id="whatsapp"
                  type="tel"
                  placeholder="(11) 90000-0000"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                />
                <p className="entrada__sub" style={{ margin: 0, fontSize: 13 }}>
                  O WhatsApp e o e-mail só são mostrados pro cliente quando você aceita o pedido dele.
                </p>
              </>
            )}
          </>
        )}

        {nomeEtapa === "atuacao" && (
          <>
            <div>
              <h1 className="entrada__titulo">Em que você atua?</h1>
              <p className="entrada__sub" style={{ margin: 0 }}>
                Escolha a área e, se quiser, as especialidades — é assim que os casos certos chegam até você.
              </p>
            </div>
            <div>
              <p className="chips__grupo" style={{ marginTop: 0 }}>
                Áreas
              </p>
              <ul className="chips">
                {AREAS.map((area) => (
                  <li key={area.valor}>
                    <button
                      type="button"
                      className="chip-opcao"
                      aria-pressed={areasAtuacao.includes(area.valor)}
                      onClick={() => alternarArea(area.valor)}
                    >
                      {area.label}
                    </button>
                  </li>
                ))}
              </ul>
              {areasAtuacao.length > 0 && !categoriasPorArea && (
                <p className="entrada__sub" style={{ margin: "16px 0 0" }}>
                  {erroCategorias ? (
                    <>
                      Não deu pra carregar as especialidades agora.{" "}
                      <button type="button" className="link-button" onClick={carregarCategorias}>
                        Tentar de novo
                      </button>{" "}
                      — ou siga só com a área e escolha depois, no seu perfil.
                    </>
                  ) : (
                    "Carregando especialidades..."
                  )}
                </p>
              )}
              {categoriasPorArea &&
                areasAtuacao.map((area) => (
                <div key={area}>
                  <p className="chips__grupo">Especialidades {area === "civel" ? "cíveis" : "trabalhistas"}</p>
                  <ul className="chips">
                    {(categoriasPorArea?.[area] || []).map((c) => (
                      <li key={c.valor}>
                        <button
                          type="button"
                          className="chip-opcao"
                          aria-pressed={especialidades.includes(c.valor)}
                          onClick={() => alternar(especialidades, setEspecialidades, c.valor)}
                        >
                          {c.label}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </>
        )}

        {ultima && (
          <label className="entrada__consentimento">
            <input
              type="checkbox"
              checked={aceitouPoliticaPrivacidade}
              onChange={(e) => setAceitouPoliticaPrivacidade(e.target.checked)}
            />
            <span>
              Li e aceito a{" "}
              <Link to="/privacidade" target="_blank" rel="noreferrer" className="entrada__link">
                política de privacidade
              </Link>
              .
            </span>
          </label>
        )}

        {erro && <p role="alert">{erro}</p>}

        {/* Na primeira etapa o botão fica logo depois do "ou" (Google ou e-mail); nas outras,
            preso no pé da tela no celular, como na referência. */}
        <div className={`entrada__acoes${nomeEtapa === "papel" ? "" : " entrada__acoes--fixas"}`}>
          <Button type="submit" disabled={enviando || (ultima && !aceitouPoliticaPrivacidade)}>
            {nomeEtapa === "papel" && !contaGoogle ? "Continuar com e-mail" : textoBotao}
          </Button>
        </div>
      </form>

      {etapa === 0 && (
        <p className="entrada__rodape">
          Já tem conta?{" "}
          <Link to="/login" className="entrada__link">
            Entrar
          </Link>
        </p>
      )}

      {concluido && (
        <div className="entrada-sucesso" role="alertdialog" aria-labelledby="sucesso-titulo">
          <div className="entrada-sucesso__cartao">
            <div className="entrada-sucesso__icone">
              <IconeUsuario />
            </div>
            <h2 id="sucesso-titulo" className="entrada-sucesso__titulo">
              Conta criada!
            </h2>
            <p className="entrada-sucesso__texto">
              {concluido === "advogado"
                ? "Sua OAB foi pra análise. Enquanto isso, já dá pra completar seu perfil."
                : "Estamos preparando seu painel..."}
            </p>
            <div className="entrada-sucesso__girando" aria-hidden="true" />
          </div>
        </div>
      )}
    </EntradaLayout>
  );
}
