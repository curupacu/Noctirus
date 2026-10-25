import { useEffect, useState } from "react";
import {
  ativarAvisos,
  avisosConfigurados,
  ehIphone,
  estaInstalado,
  registrarAparelho,
  suportaAvisos,
} from "../../lib/avisosCelular";
import { PassosIphone } from "./PassosIphone";
import "./AvisosCelular.css";

const CHAVE_DISPENSADO = "nocturis-avisos-dispensado-em";
const DIAS_ATE_PERGUNTAR_DE_NOVO = 14;

function foiDispensadoFazPouco() {
  try {
    const em = Number(localStorage.getItem(CHAVE_DISPENSADO) || 0);
    return Date.now() - em < DIAS_ATE_PERGUNTAR_DE_NOVO * 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
}

function situacaoInicial() {
  if (suportaAvisos()) {
    if (Notification.permission === "granted") return "ativo";
    if (Notification.permission === "denied") return "oculto";
    return foiDispensadoFazPouco() ? "oculto" : "pedir";
  }
  // iPhone fora do app instalado: primeiro instala, depois ativa.
  if (avisosConfigurados() && ehIphone() && !estaInstalado()) return foiDispensadoFazPouco() ? "oculto" : "instalar";
  return "oculto";
}

const TEXTOS = {
  cliente: {
    titulo: "Saiba na hora quando o advogado responder",
    texto: "Ative os avisos e a Nocturis te avisa no celular, igual mensagem do WhatsApp.",
  },
  advogado: {
    titulo: "Saiba na hora quando chegar um pedido novo",
    texto: "Ative os avisos e a Nocturis te avisa no celular assim que um cliente pedir contato.",
  },
};

function IconeSino() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  );
}

// Cartão do painel (cliente e advogado) que liga os avisos no celular. Quem já ativou não
// vê nada: o aparelho só é registrado de novo em silêncio, pro token não envelhecer.
export function AvisosCelular({ papel = "cliente" }) {
  const [situacao, setSituacao] = useState(situacaoInicial);
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    if (situacaoInicial() === "ativo") registrarAparelho().catch(() => {});
  }, []);

  if (situacao === "oculto" || situacao === "ativo") return null;

  function dispensar() {
    try {
      localStorage.setItem(CHAVE_DISPENSADO, String(Date.now()));
    } catch {
      // sem localStorage: o cartão só volta na próxima visita
    }
    setSituacao("oculto");
  }

  async function ativar() {
    setOcupado(true);
    setErro("");
    try {
      const permissao = await ativarAvisos();
      if (permissao === "granted") setSituacao("pronto");
      else if (permissao === "denied") setSituacao("negado");
    } catch {
      setErro("Não deu pra ativar agora. Tente de novo em instantes.");
    } finally {
      setOcupado(false);
    }
  }

  const { titulo, texto } = TEXTOS[papel] || TEXTOS.cliente;

  return (
    <section className="avisos-celular" aria-live="polite">
      <span className="avisos-celular__icone">
        <IconeSino />
      </span>
      <div className="avisos-celular__corpo">
        {situacao === "pronto" && (
          <>
            <h2>Avisos ativados</h2>
            <p>Pronto! Quando tiver novidade, ela aparece no seu celular.</p>
            <button type="button" className="link-button" onClick={() => setSituacao("oculto")}>
              Fechar
            </button>
          </>
        )}
        {situacao === "negado" && (
          <>
            <h2>Os avisos ficaram bloqueados</h2>
            <p>Se mudar de ideia, dá pra liberar nas configurações do navegador, em Notificações.</p>
            <button type="button" className="link-button" onClick={() => setSituacao("oculto")}>
              Entendi
            </button>
          </>
        )}
        {situacao === "pedir" && (
          <>
            <h2>{titulo}</h2>
            <p>{texto}</p>
            {erro && (
              <p role="alert" className="avisos-celular__erro">
                {erro}
              </p>
            )}
            <div className="avisos-celular__acoes">
              <button type="button" className="button button--primary" onClick={ativar} disabled={ocupado}>
                {ocupado ? "Ativando..." : "Ativar avisos"}
              </button>
              <button type="button" className="link-button" onClick={dispensar}>
                Agora não
              </button>
            </div>
          </>
        )}
        {situacao === "instalar" && (
          <>
            <h2>{titulo}</h2>
            <p>No iPhone, os avisos só funcionam com a Nocturis instalada na tela de início:</p>
            <PassosIphone />
            <p>Depois é só ativar os avisos por aqui.</p>
            <button type="button" className="link-button" onClick={dispensar}>
              Agora não
            </button>
          </>
        )}
      </div>
    </section>
  );
}
