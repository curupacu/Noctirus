import { toPng } from "html-to-image";
import QRCode from "qrcode";
import { useEffect, useRef, useState } from "react";
import { Button } from "../../components/Button/Button";
import { ChoiceCard } from "../../components/ChoiceCard/ChoiceCard";
import { api } from "../../lib/api";
import { useAuth } from "../auth/AuthContext";
import "./cartao.css";
import { TEMPLATES } from "./templates";

const LABEL_AREA = { civel: "Cível", trabalhista: "Trabalhista" };
const CHAVE_TEMPLATE = "nocturis:cartao:template";

export function CartaoPage() {
  const { user } = useAuth();
  const [dadosUsuario, setDadosUsuario] = useState(null);
  const [advogado, setAdvogado] = useState(null);
  const [categoriasPorArea, setCategoriasPorArea] = useState(null);
  const [qrCode, setQrCode] = useState(null);
  const [erroCarregar, setErroCarregar] = useState(null);
  const [templateId, setTemplateId] = useState(
    () => localStorage.getItem(CHAVE_TEMPLATE) || TEMPLATES[0].id,
  );
  const [baixando, setBaixando] = useState(false);
  const [erroDownload, setErroDownload] = useState(null);
  const cartaoRef = useRef(null);

  useEffect(() => {
    const perfilUrl = `${window.location.origin}/advogados/${user.uid}`;
    async function carregar() {
      try {
        const [usuario, dadosAdvogado, perguntas, qr] = await Promise.all([
          api.get("/users/me"),
          api.get(`/advogados/${user.uid}`),
          api.get("/triagem/perguntas"),
          QRCode.toDataURL(perfilUrl, {
            margin: 1,
            width: 240,
            color: { dark: "#221b12", light: "#ffffff" },
          }),
        ]);
        setDadosUsuario(usuario);
        setAdvogado(dadosAdvogado);
        setCategoriasPorArea(perguntas.categorias);
        setQrCode(qr);
      } catch (err) {
        setErroCarregar(err.message);
      }
    }
    carregar();
  }, [user.uid]);

  function selecionarTemplate(id) {
    setTemplateId(id);
    localStorage.setItem(CHAVE_TEMPLATE, id);
  }

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
      link.download = `cartao-nocturis-${nomeArquivo || "advogado"}.png`;
      link.href = dataUrl;
      link.click();
    } catch {
      setErroDownload("Não foi possível gerar a imagem. Tente de novo.");
    } finally {
      setBaixando(false);
    }
  }

  if (erroCarregar) return <p role="alert">{erroCarregar}</p>;
  if (!dadosUsuario || !advogado || !qrCode) {
    return <p className="loading">Carregando cartão...</p>;
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
        <div className="cartao-preview" ref={cartaoRef}>
          <TemplateEscolhido dados={dadosCartao} />
        </div>
      </div>

      {erroDownload && <p role="alert">{erroDownload}</p>}

      <div className="actions">
        <Button onClick={baixarCartao} disabled={baixando}>
          {baixando ? "Gerando imagem..." : "Baixar cartão (PNG)"}
        </Button>
      </div>
    </main>
  );
}
