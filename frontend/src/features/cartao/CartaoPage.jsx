import { toPng } from "html-to-image";
import QRCode from "qrcode";
import { useRef, useState } from "react";
import { Button } from "../../components/Button/Button";
import { ChoiceCard } from "../../components/ChoiceCard/ChoiceCard";
import { Loading } from "../../components/Loading/Loading";
import { api } from "../../lib/api";
import { useCarregar } from "../../lib/useCarregar";
import { useAuth } from "../auth/AuthContext";
import "./cartao.css";
import { CartaoVerso, TEMPLATES } from "./templates";

const LABEL_AREA = { civel: "Cível", trabalhista: "Trabalhista" };
const CHAVE_TEMPLATE = "nocturis:cartao:template";

export function CartaoPage() {
  const { user } = useAuth();
  const [templateId, setTemplateId] = useState(
    () => localStorage.getItem(CHAVE_TEMPLATE) || TEMPLATES[0].id,
  );
  const [baixando, setBaixando] = useState(false);
  const [erroDownload, setErroDownload] = useState(null);
  const [virado, setVirado] = useState(false);
  const cartaoRef = useRef(null);

  const { dado, erro: erroCarregar } = useCarregar(async () => {
    const perfilUrl = `${window.location.origin}/advogados/${user.uid}`;
    const [usuario, advogado, perguntas, qrCode] = await Promise.all([
      api.get("/users/me"),
      api.get(`/advogados/${user.uid}`),
      api.get("/triagem/perguntas"),
      QRCode.toDataURL(perfilUrl, {
        margin: 1,
        width: 240,
        color: { dark: "#221b12", light: "#ffffff" },
      }),
    ]);
    return { dadosUsuario: usuario, advogado, categoriasPorArea: perguntas.categorias, qrCode };
  }, [user.uid]);

  function selecionarTemplate(id) {
    setTemplateId(id);
    localStorage.setItem(CHAVE_TEMPLATE, id);
  }

  if (erroCarregar) return <p role="alert">{erroCarregar}</p>;
  if (!dado) return <Loading>Carregando cartão...</Loading>;

  const { dadosUsuario, advogado, categoriasPorArea, qrCode } = dado;

  async function baixarCartao() {
    if (!cartaoRef.current) return;
    setErroDownload(null);
    setBaixando(true);
    try {
      const dataUrl = await toPng(cartaoRef.current, { pixelRatio: 3, cacheBust: true });
      const nomeArquivo = (dadosUsuario.nome || "advogado")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
      const link = document.createElement("a");
      link.download = `cartao-nocturis-${nomeArquivo || "advogado"}${virado ? "-verso" : ""}.png`;
      link.href = dataUrl;
      link.click();
    } catch {
      setErroDownload("Não foi possível gerar a imagem. Tente de novo.");
    } finally {
      setBaixando(false);
    }
  }

  const todasCategorias = Object.values(categoriasPorArea || {}).flat();
  const especialidadePrincipal = advogado.especialidades?.[0]
    ? todasCategorias.find((c) => c.valor === advogado.especialidades[0])?.label
    : null;
  const areaPrincipal = (advogado.areasAtuacao || []).map((a) => LABEL_AREA[a] || a).join(" · ");

  const dadosCartao = {
    uid: user.uid,
    nome: dadosUsuario.nome,
    foto: advogado.foto,
    oabNumero: advogado.oab?.numero,
    oabUf: advogado.oab?.uf,
    cidade: advogado.localizacao?.cidade,
    uf: advogado.localizacao?.uf,
    whatsapp: advogado.contatos?.whatsapp,
    email: advogado.contatos?.email,
    especialidade: especialidadePrincipal || areaPrincipal || null,
    qrCode,
  };

  const templateAtivo = TEMPLATES.find((t) => t.id === templateId) || TEMPLATES[0];
  const TemplateEscolhido = templateAtivo.Component;

  return (
    <main>
      <h1>Meu cartão de visita</h1>
      <p className="text-muted">
        Um cartão digital com seus dados e um QR code pro seu perfil público — pra
        compartilhar no WhatsApp, nas redes ou imprimir.
      </p>

      <div className="section-heading">
        <h2>Modelo</h2>
      </div>
      <div className="choice-grid">
        {TEMPLATES.map((t) => (
          <ChoiceCard
            key={t.id}
            type="radio"
            name="cartao-template"
            label={t.nome}
            description={t.description}
            checked={templateId === t.id}
            onChange={() => selecionarTemplate(t.id)}
          />
        ))}
      </div>

      <div className="cartao-preview-wrapper">
        <div className="cartao-preview">
          <button
            type="button"
            className="cartao-flip"
            onClick={() => setVirado((v) => !v)}
            aria-label={virado ? "Ver a frente do cartão" : "Ver o verso do cartão"}
          >
            <div className={`cartao-flip__inner${virado ? " cartao-flip__inner--virado" : ""}`}>
              <div className="cartao-flip__face cartao-flip__face--frente">
                <TemplateEscolhido dados={dadosCartao} />
              </div>
              <div className="cartao-flip__face cartao-flip__face--verso">
                <CartaoVerso dados={dadosCartao} />
              </div>
            </div>
          </button>
        </div>
      </div>
      <p className="text-muted cartao-flip-hint">Toque no cartão pra ver o verso.</p>

      {/* Fora da tela — o download sempre captura daqui (sem o transform 3D do flip
          acima), pra garantir que o PNG saia sempre reto. */}
      <div className="cartao-export-target" aria-hidden="true">
        <div ref={cartaoRef}>{virado ? <CartaoVerso dados={dadosCartao} /> : <TemplateEscolhido dados={dadosCartao} />}</div>
      </div>

      {erroDownload && <p role="alert">{erroDownload}</p>}

      <div className="actions">
        <Button onClick={baixarCartao} disabled={baixando}>
          {baixando ? "Gerando imagem..." : `Baixar ${virado ? "verso" : "frente"} (PNG)`}
        </Button>
      </div>
    </main>
  );
}
