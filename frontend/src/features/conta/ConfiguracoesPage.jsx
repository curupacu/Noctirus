import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { PassosIphone } from "../../components/AvisosCelular/PassosIphone";
import { Button } from "../../components/Button/Button";
import { api } from "../../lib/api";
import {
  ativarAvisos,
  avisosConfigurados,
  desativarAvisos,
  ehIphone,
  estaInstalado,
  registrarAparelho,
  suportaAvisos,
} from "../../lib/avisosCelular";
import { redefinirAcessibilidade, salvarPreferencia, usePreferencias } from "../../lib/preferencias";
import { usePwaInstall } from "../../lib/usePwaInstall";
import { useTitulo } from "../../lib/useTitulo";
import { useAuth } from "../auth/AuthContext";
import "../../components/AvisosCelular/AvisosCelular.css";
import "./ConfiguracoesPage.css";

const TAMANHOS = [
  { valor: "normal", label: "Normal" },
  { valor: "grande", label: "Grande" },
  { valor: "maior", label: "Maior" },
];

// Ícones no mesmo traço dos atalhos do advogado.
const ICONES = {
  acessibilidade: "M12 5a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM4 8l8 2 8-2M12 10v5m0 0-3 7m3-7 3 7",
  avisos: "M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.94 1.94 0 0 0 3.4 0",
  app: "M8 2h8a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2ZM11 18h2",
  dados: "M12 3 4 6v6c0 4.5 3.4 8 8 9 4.6-1 8-4.5 8-9V6l-8-3Zm-3 9 2 2 4-4",
  ajuda: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20ZM9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3M12 17h.01",
  conta: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9",
};

function Icone({ nome }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={ICONES[nome]} />
    </svg>
  );
}

function Titulo({ id, icone, children }) {
  return (
    <h2 id={id} className="config__titulo">
      <span className="config__titulo-icone">
        <Icone nome={icone} />
      </span>
      {children}
    </h2>
  );
}

function Chave({ id, ligada, onMudar, titulo, texto }) {
  return (
    <div className="config__linha">
      <div className="config__linha-texto">
        <label htmlFor={id}>{titulo}</label>
        <p>{texto}</p>
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={ligada}
        className={`config__chave${ligada ? " config__chave--ligada" : ""}`}
        onClick={() => onMudar(!ligada)}
      >
        <span className="config__chave-bolinha" />
      </button>
    </div>
  );
}

function situacaoDosAvisos(desligados) {
  if (!avisosConfigurados()) return "indisponivel";
  if (suportaAvisos()) {
    if (Notification.permission === "denied") return "bloqueado";
    if (Notification.permission === "granted") return desligados ? "desligado" : "ligado";
    return "desligado";
  }
  if (ehIphone() && !estaInstalado()) return "instalar";
  return "indisponivel";
}

function SecaoAvisos() {
  const prefs = usePreferencias();
  const [situacao, setSituacao] = useState(() => situacaoDosAvisos(prefs.avisosDesligados));
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState("");

  async function ligar() {
    setOcupado(true);
    setErro("");
    try {
      const permissao = Notification.permission === "granted" ? (await registrarAparelho(), "granted") : await ativarAvisos();
      if (permissao === "granted") {
        salvarPreferencia("avisosDesligados", false);
        setSituacao("ligado");
      } else if (permissao === "denied") {
        setSituacao("bloqueado");
      }
    } catch {
      setErro("Não deu para ligar agora. Tente de novo em instantes.");
    } finally {
      setOcupado(false);
    }
  }

  async function desligar() {
    setOcupado(true);
    setErro("");
    try {
      await desativarAvisos();
      salvarPreferencia("avisosDesligados", true);
      setSituacao("desligado");
    } catch {
      setErro("Não deu para desligar agora. Tente de novo em instantes.");
    } finally {
      setOcupado(false);
    }
  }

  const textos = {
    ligado: "Ligados neste aparelho. A Nocturis te avisa quando tiver novidade nos seus pedidos.",
    desligado: "Desligados. Ligue para saber na hora quando tiver novidade nos seus pedidos.",
    bloqueado: "Bloqueados pelo navegador. Para liberar, abra as configurações do navegador, em Notificações.",
    instalar: "No iPhone, os avisos só funcionam com a Nocturis instalada na tela de início:",
    indisponivel: "Este navegador não recebe avisos. Abra a Nocturis no Chrome ou instale o app.",
  };

  return (
    <section className="card config__secao" id="avisos" aria-labelledby="config-avisos">
      <Titulo id="config-avisos" icone="avisos">Avisos no celular</Titulo>
      <p className="config__descricao">{textos[situacao]}</p>
      {situacao === "instalar" && <PassosIphone />}
      {erro && <p role="alert">{erro}</p>}
      {situacao === "ligado" && (
        <div className="actions">
          <Button variant="secondary" onClick={desligar} disabled={ocupado}>
            {ocupado ? "Desligando..." : "Desligar avisos"}
          </Button>
        </div>
      )}
      {situacao === "desligado" && (
        <div className="actions">
          <Button onClick={ligar} disabled={ocupado}>
            {ocupado ? "Ligando..." : "Ligar avisos"}
          </Button>
        </div>
      )}
    </section>
  );
}

function SecaoApp() {
  const { podeInstalar, instalar } = usePwaInstall();
  const instalado = estaInstalado();
  const iphone = ehIphone();

  return (
    <section className="card config__secao" id="app" aria-labelledby="config-app">
      <Titulo id="config-app" icone="app">App</Titulo>
      {instalado ? (
        <p className="config__descricao">A Nocturis já está instalada neste aparelho.</p>
      ) : podeInstalar ? (
        <>
          <p className="config__descricao">
            Instale a Nocturis para abrir direto da tela de início, como um app, e receber avisos.
          </p>
          <div className="actions">
            <Button onClick={instalar}>Instalar a Nocturis</Button>
          </div>
        </>
      ) : iphone ? (
        <>
          <p className="config__descricao">No iPhone, a instalação é pelo Safari:</p>
          <PassosIphone />
        </>
      ) : (
        <p className="config__descricao">
          Para instalar, abra a Nocturis no Chrome (celular ou computador) ou no Safari do iPhone.
        </p>
      )}
    </section>
  );
}

function SecaoDados() {
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
        "Tem certeza que quer apagar sua conta? Essa ação não pode ser desfeita: seu cadastro" +
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
    <section className="card config__secao" id="dados" aria-labelledby="config-dados">
      <Titulo id="config-dados" icone="dados">Privacidade e dados</Titulo>
      <p className="config__descricao">
        Dois direitos garantidos pela LGPD: baixar uma cópia de tudo que a Nocturis guarda sobre
        você, ou apagar sua conta de vez.
      </p>
      {erro && <p role="alert">{erro}</p>}

      <div className="config__linha">
        <div className="config__linha-texto">
          <strong>Baixar meus dados</strong>
          <p>Um arquivo com seu cadastro, suas triagens e seus pedidos de contato.</p>
        </div>
        <Button variant="secondary" onClick={baixarMeusDados} disabled={baixando}>
          {baixando ? "Gerando..." : "Baixar"}
        </Button>
      </div>

      <div className="config__linha">
        <div className="config__linha-texto">
          <strong>Excluir minha conta</strong>
          <p>
            Apaga seu cadastro, suas triagens e seu acesso. Não dá para desfazer. Pedidos já
            enviados continuam no histórico do advogado que os recebeu.
          </p>
        </div>
        <Button variant="secondary" className="button--perigo" onClick={excluirMinhaConta} disabled={excluindo}>
          {excluindo ? "Excluindo..." : "Excluir"}
        </Button>
      </div>
    </section>
  );
}

// Configurações (28/10/2026): acessibilidade, avisos, app, dados (LGPD) e o "Sair", que
// saiu do cabeçalho. Junta a antiga tela "Meus dados", que ficava escondida no perfil.
export function ConfiguracoesPage() {
  useTitulo("Configurações");
  const { role, logout } = useAuth();
  const navigate = useNavigate();
  const prefs = usePreferencias();
  const temVoz = typeof window !== "undefined" && "speechSynthesis" in window;

  async function sair() {
    await logout();
    navigate("/");
  }

  return (
    <main className="config">
      <h1>Configurações</h1>
      <p className="text-muted">
        As opções de acessibilidade ficam salvas neste aparelho.
      </p>

      <section className="card config__secao" id="acessibilidade" aria-labelledby="config-acessibilidade">
        <Titulo id="config-acessibilidade" icone="acessibilidade">Acessibilidade</Titulo>

        <div className="config__linha config__linha--coluna">
          <div className="config__linha-texto">
            <strong id="config-texto">Tamanho do texto</strong>
            <p>Deixa as letras e os botões do site inteiro maiores.</p>
          </div>
          <div className="config__tamanhos" role="radiogroup" aria-labelledby="config-texto">
            {TAMANHOS.map(({ valor, label }) => (
              <button
                key={valor}
                type="button"
                role="radio"
                aria-checked={prefs.texto === valor}
                className={`config__tamanho config__tamanho--${valor}${prefs.texto === valor ? " config__tamanho--ativo" : ""}`}
                onClick={() => salvarPreferencia("texto", valor)}
              >
                <span aria-hidden="true">Aa</span>
                {label}
              </button>
            ))}
          </div>
        </div>

        <Chave
          id="config-movimento"
          ligada={prefs.movimento === "reduzido"}
          onMudar={(ligada) => salvarPreferencia("movimento", ligada ? "reduzido" : "normal")}
          titulo="Reduzir animações"
          texto="Tira as transições, os efeitos de entrada e a coruja animada."
        />

        <Chave
          id="config-negrito"
          ligada={prefs.negrito}
          onMudar={(ligada) => salvarPreferencia("negrito", ligada)}
          titulo="Texto em negrito"
          texto="Deixa os textos mais grossos, mais fáceis de ler."
        />

        <Chave
          id="config-contraste"
          ligada={prefs.contraste}
          onMudar={(ligada) => salvarPreferencia("contraste", ligada)}
          titulo="Contraste reforçado"
          texto="Escurece os textos mais claros e as bordas."
        />

        {temVoz && (
          <Chave
            id="config-ouvir"
            ligada={prefs.ouvir}
            onMudar={(ligada) => salvarPreferencia("ouvir", ligada)}
            titulo="Ouvir os textos"
            texto="Mostra um botão para ouvir em voz alta o resultado da triagem e o perfil dos advogados."
          />
        )}

        <div className="config__linha">
          <div className="config__linha-texto">
            <strong>Voltar ao padrão</strong>
            <p>Desfaz todos os ajustes de acessibilidade.</p>
          </div>
          <Button variant="secondary" onClick={redefinirAcessibilidade}>
            Redefinir
          </Button>
        </div>
      </section>

      {role !== "admin" && <SecaoAvisos />}
      <SecaoApp />
      {role !== "admin" && <SecaoDados />}

      <section className="card config__secao" id="ajuda" aria-labelledby="config-ajuda">
        <Titulo id="config-ajuda" icone="ajuda">Ajuda e informações</Titulo>
        <ul className="list-plain config__links">
          <li>
            <a href="/#perguntas" className="list-row">
              <span className="list-row__title">Perguntas frequentes</span>
              <span className="advogado-row__chevron" aria-hidden="true">›</span>
            </a>
          </li>
          <li>
            <Link to="/termos" className="list-row">
              <span className="list-row__title">Termos de uso</span>
              <span className="advogado-row__chevron" aria-hidden="true">›</span>
            </Link>
          </li>
          <li>
            <Link to="/privacidade" className="list-row">
              <span className="list-row__title">Política de privacidade</span>
              <span className="advogado-row__chevron" aria-hidden="true">›</span>
            </Link>
          </li>
        </ul>
      </section>

      <section className="card config__secao" id="conta" aria-labelledby="config-conta">
        <Titulo id="config-conta" icone="conta">Conta</Titulo>
        <div className="config__linha">
          <div className="config__linha-texto">
            <strong>Sair da conta</strong>
            <p>Você pode entrar de novo quando quiser.</p>
          </div>
          <Button variant="secondary" onClick={sair}>
            Sair
          </Button>
        </div>
      </section>
    </main>
  );
}
