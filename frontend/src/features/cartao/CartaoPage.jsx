import { toPng } from "html-to-image";
import QRCode from "qrcode";
import { useRef, useState } from "react";
import { EsqueletoPagina } from "../../components/Esqueleto/Esqueleto";
import { LABEL_AREA_CURTO } from "../../lib/areas";
import { api } from "../../lib/api";
import { useCarregar } from "../../lib/useCarregar";
import { useTitulo } from "../../lib/useTitulo";
import { useAuth } from "../auth/AuthContext";
import "./cartao.css";
import { TEMPLATES } from "./templates";

const CHAVE_TEMPLATE = "nocturis:cartao:template";

function lerModeloSalvo() {
  try {
    const salvo = localStorage.getItem(CHAVE_TEMPLATE);
    return TEMPLATES.some((t) => t.id === salvo) ? salvo : TEMPLATES[0].id;
  } catch {
    return TEMPLATES[0].id;
  }
}

function nomeDeArquivo(nome) {
  return (nome || "advogado")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// Cartão de visita do advogado (repaginado em 25/10/2026): 5 modelos com frente e verso
// combinando, escolhidos pela miniatura do próprio cartão, e prévia das duas faces lado a lado.
export function CartaoPage() {
  useTitulo("Cartão de visita");
  const { user } = useAuth();
  const [templateId, setTemplateId] = useState(lerModeloSalvo);
  const [baixando, setBaixando] = useState(null);
  const [erroDownload, setErroDownload] = useState(null);
  const frenteRef = useRef(null);
  const versoRef = useRef(null);

  const { dado, erro: erroCarregar } = useCarregar(async () => {
    const perfilUrl = `${window.location.origin}/advogados/${user.uid}`;
    const [usuario, advogado, qrCode] = await Promise.all([
      api.get("/users/me"),
      api.get(`/advogados/${user.uid}`),
      QRCode.toDataURL(perfilUrl, { margin: 1, width: 320, color: { dark: "#221b12", light: "#ffffff" } }),
    ]);
    return { dadosUsuario: usuario, advogado, qrCode };
  }, [user.uid]);

  if (erroCarregar) return <p role="alert">{erroCarregar}</p>;
  if (!dado) return <EsqueletoPagina />;

  const { dadosUsuario, advogado, qrCode } = dado;
  const dados = {
    uid: user.uid,
    nome: dadosUsuario.nome,
    foto: advogado.foto,
    oabNumero: advogado.oab?.numero,
    oabUf: advogado.oab?.uf,
    cidade: advogado.localizacao?.cidade,
    uf: advogado.localizacao?.uf,
    whatsapp: advogado.contatos?.whatsapp,
    email: advogado.contatos?.email,
    areas: (advogado.areasAtuacao || []).map((a) => LABEL_AREA_CURTO[a] || a).join(" · ") || "Advocacia",
    qrCode,
  };

  const modelo = TEMPLATES.find((t) => t.id === templateId) || TEMPLATES[0];

  function escolher(id) {
    setTemplateId(id);
    try {
      localStorage.setItem(CHAVE_TEMPLATE, id);
    } catch {
      // sem localStorage: só não lembra o modelo na próxima visita
    }
  }

  async function baixar(lado) {
    const alvo = lado === "verso" ? versoRef.current : frenteRef.current;
    if (!alvo) return;
    setErroDownload(null);
    setBaixando(lado);
    try {
      const dataUrl = await toPng(alvo, { pixelRatio: 3, cacheBust: true });
      const link = document.createElement("a");
      link.download = `cartao-${nomeDeArquivo(dados.nome)}-${modelo.id}-${lado}.png`;
      link.href = dataUrl;
      link.click();
    } catch {
      setErroDownload("Não foi possível gerar a imagem. Tente de novo.");
    } finally {
      setBaixando(null);
    }
  }

  // PDF pra imprimir (28/10/2026): ver pdfCartao.js. jsPDF só é baixado quando a pessoa pede.
  async function baixarPdf(tipo) {
    if (!frenteRef.current || !versoRef.current) return;
    setErroDownload(null);
    setBaixando(tipo);
    try {
      const { gerarPdfCartao } = await import("./pdfCartao");
      await gerarPdfCartao({
        frenteEl: frenteRef.current,
        versoEl: versoRef.current,
        tipo,
        nome: dados.nome,
        arquivo: `cartao-${nomeDeArquivo(dados.nome)}-${modelo.id}-${tipo === "folha" ? "frente-e-verso" : "3-cartoes"}.pdf`,
      });
    } catch {
      setErroDownload("Não foi possível gerar o PDF. Tente de novo.");
    } finally {
      setBaixando(null);
    }
  }

  const { Frente, Verso } = modelo;

  return (
    <main className="cartao-pagina">
      <h1>Meu cartão de visita</h1>
      <p className="text-muted">
        Escolha um modelo. Seus dados e um QR code pro seu perfil já vêm preenchidos, prontos pra
        mandar no WhatsApp ou imprimir (tamanho padrão de 9 × 5 cm).
      </p>

      <div className="section-heading">
        <h2>Modelos</h2>
      </div>
      <ul className="cartao-modelos">
        {TEMPLATES.map((t) => (
          <li key={t.id}>
            <button
              type="button"
              className={`cartao-modelo${t.id === templateId ? " cartao-modelo--ativo" : ""}`}
              aria-pressed={t.id === templateId}
              onClick={() => escolher(t.id)}
            >
              <t.Frente dados={dados} />
              <strong>{t.nome}</strong>
              <span>{t.descricao}</span>
            </button>
          </li>
        ))}
      </ul>

      <div className="section-heading">
        <h2>{modelo.nome}</h2>
      </div>
      <div className="cartao-previa">
        <figure>
          <Frente dados={dados} />
          <figcaption>Frente</figcaption>
        </figure>
        <figure>
          <Verso dados={dados} />
          <figcaption>Verso</figcaption>
        </figure>
      </div>

      {/* Fora da tela: o download captura daqui, sem sombra nem cantos de prévia. */}
      <div className="cartao-export" aria-hidden="true">
        <div ref={frenteRef}>
          <Frente dados={dados} />
        </div>
        <div ref={versoRef}>
          <Verso dados={dados} />
        </div>
      </div>

      {erroDownload && <p role="alert">{erroDownload}</p>}

      <div className="cartao-downloads">
        <button type="button" className="cartao-download cartao-download--principal" onClick={() => baixar("frente")} disabled={!!baixando}>
          <strong>{baixando === "frente" ? "Gerando..." : "Baixar a frente"}</strong>
          <span>Imagem PNG em alta resolução</span>
        </button>
        <button type="button" className="cartao-download" onClick={() => baixar("verso")} disabled={!!baixando}>
          <strong>{baixando === "verso" ? "Gerando..." : "Baixar o verso"}</strong>
          <span>Imagem PNG em alta resolução</span>
        </button>
        <button type="button" className="cartao-download" onClick={() => baixarPdf("folha")} disabled={!!baixando}>
          <strong>{baixando === "folha" ? "Gerando..." : "PDF: frente e verso"}</strong>
          <span>Uma folha A4 com os dois lados, pra imprimir</span>
        </button>
        <button type="button" className="cartao-download" onClick={() => baixarPdf("tres")} disabled={!!baixando}>
          <strong>{baixando === "tres" ? "Gerando..." : "PDF: folha com 3 cartões"}</strong>
          <span>3 frentes e 3 versos, pra recortar e dobrar</span>
        </button>
      </div>
    </main>
  );
}
