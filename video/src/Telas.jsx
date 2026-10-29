import { Img, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { CorujaEstatica } from "./Coruja";
import { COR, SANS, SERIF } from "./tema";

// Versões das telas de verdade do site, desenhadas aqui pra poder animar (digitação,
// cartões entrando). Os advogados e fotos são os mesmos da demonstração do site.

export const ADVOGADOS = [
  {
    nome: "Thiago Ramalho Costa",
    meta: "OAB/SP 600002 · São Paulo/SP",
    foto: "https://images.unsplash.com/photo-1757620765404-a1ee66df5e27?auto=format&fit=facearea&facepad=3&w=400&h=400&q=75",
  },
  {
    nome: "Carlos Eduardo Lima",
    meta: "OAB/SP 234567 · Guarulhos/SP",
    foto: "https://images.unsplash.com/photo-1738566061874-2160e9f4a064?auto=format&fit=facearea&facepad=3&w=400&h=400&q=75",
  },
  {
    nome: "Fernanda Torres",
    meta: "OAB/SP 345678 · São Paulo/SP",
    foto: "https://images.unsplash.com/photo-1685760259914-ee8d2c92d2e0?auto=format&fit=facearea&facepad=3&w=400&h=400&q=75",
  },
];

const TEXTO_CASO = "Fui demitido e a empresa não pagou minhas horas extras nem a rescisão. Trabalhei lá 3 anos.";

function Topo({ ativo = "Triagem" }) {
  return (
    <div style={{ height: 70, background: COR.marrom, display: "flex", alignItems: "center", padding: "0 26px", gap: 20 }}>
      <CorujaEstatica largura={40} />
      {["Início", "Triagem"].map((item) => (
        <span
          key={item}
          style={{
            fontFamily: SANS,
            fontWeight: 600,
            fontSize: 15,
            padding: "6px 14px",
            borderRadius: 999,
            color: item === ativo ? COR.marrom : COR.creme,
            background: item === ativo ? COR.cremeClaro : "transparent",
          }}
        >
          {item}
        </span>
      ))}
    </div>
  );
}

function Etiqueta({ children }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, fontFamily: SANS, fontWeight: 700, fontSize: 14, letterSpacing: 1.4, color: COR.marrom }}>
      <span style={{ width: 28, height: 2, background: COR.marrom }} />
      {children}
    </div>
  );
}

export function TelaTriagem() {
  const quadro = useCurrentFrame();
  const letras = Math.floor(interpolate(quadro, [20, 130], [0, TEXTO_CASO.length], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
  const digitado = TEXTO_CASO.slice(0, letras);
  const cursor = Math.floor(quadro / 15) % 2 === 0;
  const pronto = letras >= 40;

  return (
    <div style={{ height: "100%", background: COR.fundo, display: "flex", flexDirection: "column" }}>
      <Topo />
      <div style={{ padding: "30px 30px 0", display: "flex", flexDirection: "column", gap: 18 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ fontFamily: SANS, fontSize: 22, color: COR.texto }}>←</span>
          <div style={{ flex: 1, height: 7, borderRadius: 4, background: COR.bege, overflow: "hidden" }}>
            <div style={{ width: "25%", height: "100%", background: COR.marrom }} />
          </div>
          <span style={{ fontFamily: SANS, fontSize: 14, fontWeight: 600, color: COR.textoSuave }}>1/4</span>
        </div>
        <div style={{ height: 8 }} />
        <Etiqueta>SOBRE O SEU CASO</Etiqueta>
        <div style={{ fontFamily: SERIF, fontSize: 40, color: COR.texto, lineHeight: 1.15 }}>O que aconteceu?</div>
        <div style={{ fontFamily: SANS, fontSize: 17, color: COR.textoSuave, lineHeight: 1.45 }}>
          Não precisa saber nada de Direito. Escreva do seu jeito, como contaria pra um amigo.
        </div>
        <div
          style={{
            minHeight: 210,
            borderRadius: 16,
            border: `1.5px solid ${COR.marrom}`,
            background: COR.cremeClaro,
            padding: 18,
            fontFamily: SANS,
            fontSize: 19,
            lineHeight: 1.5,
            color: COR.texto,
          }}
        >
          {digitado}
          <span style={{ display: "inline-block", width: 2, height: 22, marginLeft: 2, verticalAlign: "middle", background: COR.marrom, opacity: cursor ? 1 : 0 }} />
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <div
            style={{
              fontFamily: SANS,
              fontWeight: 700,
              fontSize: 18,
              color: COR.cremeClaro,
              background: pronto ? COR.marrom : "#a8957f",
              padding: "16px 48px",
              borderRadius: 14,
            }}
          >
            Continuar
          </div>
        </div>
      </div>
    </div>
  );
}

function CartaoAdvogado({ advogado, atraso }) {
  const quadro = useCurrentFrame();
  const { fps } = useVideoConfig();
  const entra = spring({ frame: quadro - atraso, fps, config: { damping: 16 } });
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 16,
        padding: 16,
        borderRadius: 18,
        background: "#ffffff",
        boxShadow: "0 6px 18px rgba(59, 40, 28, 0.10)",
        opacity: entra,
        transform: `translateY(${(1 - entra) * 40}px)`,
      }}
    >
      <Img src={advogado.foto} style={{ width: 64, height: 64, borderRadius: "50%", objectFit: "cover" }} />
      <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
        <span style={{ fontFamily: SANS, fontWeight: 700, fontSize: 18, color: COR.texto }}>{advogado.nome}</span>
        <span style={{ fontFamily: SANS, fontSize: 14, color: COR.textoSuave }}>{advogado.meta}</span>
        <span style={{ fontFamily: SANS, fontWeight: 700, fontSize: 14, color: COR.marrom }}>✓ Atua no assunto do seu caso</span>
      </div>
    </div>
  );
}

export function TelaResultado() {
  const quadro = useCurrentFrame();
  const { fps } = useVideoConfig();
  const destaque = spring({ frame: quadro - 6, fps, config: { damping: 18 } });

  return (
    <div style={{ height: "100%", background: COR.fundo, display: "flex", flexDirection: "column" }}>
      <Topo />
      <div style={{ padding: "26px 26px 0", display: "flex", flexDirection: "column", gap: 14 }}>
        <span style={{ fontFamily: SANS, fontSize: 15, fontWeight: 600, color: COR.textoSuave }}>Triagem concluída</span>
        <div style={{ fontFamily: SERIF, fontSize: 32, color: COR.texto, lineHeight: 1.15 }}>O que encontramos no seu caso</div>
        <div
          style={{
            borderRadius: 22,
            background: COR.marrom,
            padding: "24px 24px",
            color: COR.creme,
            display: "flex",
            flexDirection: "column",
            gap: 10,
            opacity: destaque,
            transform: `scale(${0.94 + destaque * 0.06})`,
          }}
        >
          <span style={{ fontFamily: SANS, fontWeight: 700, fontSize: 13, letterSpacing: 1.3 }}>TRABALHISTA · IDENTIFICADO POR IA</span>
          <span style={{ fontFamily: SERIF, fontSize: 36 }}>Horas extras</span>
          <span style={{ fontFamily: SANS, fontSize: 16, lineHeight: 1.45, color: "#e6d8bf" }}>
            3 advogados atendem esse assunto em SP. Escolha um e peça contato.
          </span>
        </div>
        <span style={{ fontFamily: SERIF, fontSize: 22, color: COR.texto, marginTop: 8 }}>Os mais compatíveis com o seu caso</span>
        {ADVOGADOS.map((a, i) => (
          <CartaoAdvogado key={a.nome} advogado={a} atraso={30 + i * 12} />
        ))}
      </div>
    </div>
  );
}

export function TelaAceito() {
  const quadro = useCurrentFrame();
  const { fps } = useVideoConfig();
  const aviso = spring({ frame: quadro - 10, fps, config: { damping: 15 } });
  const cartao = spring({ frame: quadro - 34, fps, config: { damping: 16 } });
  const toque = interpolate(quadro, [100, 108, 116], [1, 0.94, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const advogado = ADVOGADOS[0];

  return (
    <div style={{ height: "100%", background: COR.fundo, display: "flex", flexDirection: "column", position: "relative" }}>
      <Topo ativo="Início" />
      {/* aviso que chega no celular */}
      <div
        style={{
          position: "absolute",
          top: 14,
          left: 16,
          right: 16,
          padding: "14px 16px",
          borderRadius: 18,
          background: COR.cremeClaro,
          boxShadow: "0 12px 30px rgba(30, 20, 12, 0.28)",
          display: "flex",
          gap: 12,
          alignItems: "center",
          transform: `translateY(${(1 - aviso) * -140}px)`,
          zIndex: 2,
        }}
      >
        <div style={{ width: 42, height: 42, borderRadius: 10, background: COR.marrom, flex: "none", display: "grid", placeItems: "center" }}>
          <CorujaEstatica largura={32} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <span style={{ fontFamily: SANS, fontWeight: 700, fontSize: 15, color: COR.texto }}>Nocturis</span>
          <span style={{ fontFamily: SANS, fontSize: 14, color: COR.textoSuave }}>Thiago aceitou o seu pedido de contato.</span>
        </div>
      </div>

      <div style={{ padding: "120px 26px 0", display: "flex", flexDirection: "column", gap: 18 }}>
        <Etiqueta>MEUS PEDIDOS DE CONTATO</Etiqueta>
        <div
          style={{
            borderRadius: 22,
            background: "#ffffff",
            boxShadow: "0 8px 24px rgba(59, 40, 28, 0.12)",
            padding: 24,
            display: "flex",
            flexDirection: "column",
            gap: 18,
            opacity: cartao,
            transform: `translateY(${(1 - cartao) * 50}px)`,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <Img src={advogado.foto} style={{ width: 72, height: 72, borderRadius: "50%", objectFit: "cover" }} />
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ fontFamily: SANS, fontWeight: 700, fontSize: 19, color: COR.texto }}>{advogado.nome}</span>
              <span style={{ fontFamily: SANS, fontWeight: 700, fontSize: 15, color: COR.marrom }}>✓ Pedido aceito</span>
            </div>
          </div>
          <span style={{ fontFamily: SANS, fontSize: 16, lineHeight: 1.45, color: COR.textoSuave }}>
            Chame pra conversar sobre o seu caso. O contato agora está liberado.
          </span>
          <div
            style={{
              fontFamily: SANS,
              fontWeight: 700,
              fontSize: 18,
              textAlign: "center",
              color: COR.cremeClaro,
              background: COR.marrom,
              padding: "16px 0",
              borderRadius: 14,
              transform: `scale(${toque})`,
            }}
          >
            Chamar no WhatsApp
          </div>
          <div
            style={{
              fontFamily: SANS,
              fontWeight: 700,
              fontSize: 18,
              textAlign: "center",
              color: COR.marrom,
              border: `1.5px solid ${COR.marrom}`,
              padding: "14px 0",
              borderRadius: 14,
            }}
          >
            Mandar e-mail
          </div>
        </div>
      </div>
    </div>
  );
}
