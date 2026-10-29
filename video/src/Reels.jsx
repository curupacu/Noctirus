import { AbsoluteFill, Easing, Img, interpolate, Sequence, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { CorujaEstatica, CorujaLogo } from "./Coruja";
import { ADVOGADOS } from "./Telas";
import { COR, SANS, SERIF } from "./tema";

// Versão Reels (vertical 1080x1920, 21 s), pedida em 29/10/2026 depois da primeira ter
// ficado "morta": cortes rápidos, texto gigante repetido no fundo, coisas entrando de lado
// e um dedo tocando nos botões (referências de motion graphics de anúncio que o usuário
// mandou no Pinterest). Mesmas cores do site: só marrom, bege e creme.

const C = { extrapolateLeft: "clamp", extrapolateRight: "clamp" };
const SAIDA = Easing.bezier(0.16, 1, 0.3, 1);
const ENTRADA = Easing.bezier(0.7, 0, 0.84, 0);

// Cena com entrada e saída em "chicote" (desliza rápido com desfoque de movimento).
function Cena({ duracao, fundo, de = "baixo", children }) {
  const f = useCurrentFrame();
  const eixo = de === "baixo" ? "Y" : "X";
  const entra = interpolate(f, [0, 9], [100, 0], { ...C, easing: SAIDA });
  const sai = interpolate(f, [duracao - 8, duracao], [0, -100], { ...C, easing: ENTRADA });
  const pos = f < duracao - 8 ? entra : sai;
  const desfoque = Math.abs(pos) * 0.35;
  return (
    <AbsoluteFill
      style={{
        background: fundo,
        overflow: "hidden",
        translate: eixo === "Y" ? `0 ${pos}%` : `${pos}% 0`,
        filter: desfoque > 0.5 ? `blur(${desfoque}px)` : undefined,
      }}
    >
      {children}
    </AbsoluteFill>
  );
}

// Faixas de texto gigante só com contorno, passando em sentidos opostos (o "DRINK DRINK").
function FaixasDeTexto({ texto, cor, linhas = 7, tamanho = 230, opacidade = 0.22, preenchida = -1 }) {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ justifyContent: "center", gap: 0, rotate: "-8deg", scale: "1.35", opacity: opacidade }}>
      {Array.from({ length: linhas }).map((_, i) => (
        <div
          key={i}
          style={{
            whiteSpace: "nowrap",
            fontFamily: SANS,
            fontWeight: 700,
            fontSize: tamanho,
            lineHeight: 0.95,
            letterSpacing: -4,
            color: i === preenchida ? cor : "transparent",
            WebkitTextStroke: `3px ${cor}`,
            translate: `${(i % 2 === 0 ? -1 : 1) * f * 9 - 900}px 0`,
          }}
        >
          {`${texto} `.repeat(6)}
        </div>
      ))}
    </AbsoluteFill>
  );
}

// Dedo (um círculo, como nos vídeos de app) que vai até o botão e toca, com onda.
function Toque({ x, y, quando }) {
  const f = useCurrentFrame();
  const chega = interpolate(f, [quando - 14, quando], [0, 1], { ...C, easing: SAIDA });
  const aperta = interpolate(f, [quando, quando + 4, quando + 9], [1, 0.8, 1], C);
  const onda = interpolate(f, [quando, quando + 16], [0, 1], C);
  if (f < quando - 14 || f > quando + 26) return null;
  return (
    <div style={{ position: "absolute", left: x, top: y, width: 0, height: 0 }}>
      <div
        style={{
          position: "absolute",
          width: 150,
          height: 150,
          left: -75,
          top: -75,
          borderRadius: "50%",
          border: `6px solid ${COR.cremeClaro}`,
          scale: `${0.4 + onda}`,
          opacity: f >= quando ? 1 - onda : 0,
        }}
      />
      <div
        style={{
          position: "absolute",
          width: 84,
          height: 84,
          left: -42,
          top: -42,
          borderRadius: "50%",
          background: "rgba(255, 253, 248, 0.85)",
          boxShadow: "0 8px 30px rgba(30, 20, 12, 0.35)",
          translate: `${(1 - chega) * 220}px ${(1 - chega) * 260}px`,
          scale: `${aperta}`,
          opacity: interpolate(f, [quando + 14, quando + 26], [1, 0], C),
        }}
      />
    </div>
  );
}

function Titulo({ numero, children, cor = COR.texto, quando = 6 }) {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: f - quando, fps, config: { damping: 13, stiffness: 160 } });
  return (
    <div style={{ position: "absolute", top: 150, left: 80, right: 80, display: "flex", flexDirection: "column", gap: 18, opacity: s, translate: `0 ${(1 - s) * -60}px` }}>
      <span style={{ fontFamily: SANS, fontWeight: 700, fontSize: 40, letterSpacing: 6, color: cor, opacity: 0.8 }}>PASSO {numero}</span>
      <span style={{ fontFamily: SERIF, fontSize: 96, lineHeight: 1.05, color: cor }}>{children}</span>
    </div>
  );
}

function Celular({ children, quando = 4, inclina = -4 }) {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: f - quando, fps, config: { damping: 14, stiffness: 110 } });
  const flutua = Math.sin(f / 14) * 10;
  return (
    <div
      style={{
        position: "absolute",
        left: 190,
        top: 560,
        width: 700,
        height: 1300,
        borderRadius: 96,
        background: COR.marromTinta,
        padding: 22,
        boxShadow: "0 60px 120px rgba(30, 20, 12, 0.45)",
        translate: `0 ${(1 - s) * 1300 + flutua}px`,
        rotate: `${inclina + (1 - s) * 14}deg`,
      }}
    >
      <div style={{ position: "relative", width: "100%", height: "100%", borderRadius: 76, overflow: "hidden", background: COR.fundo }}>
        <div style={{ height: 104, background: COR.marrom, display: "flex", alignItems: "center", padding: "0 40px" }}>
          <CorujaEstatica largura={64} />
        </div>
        {children}
      </div>
    </div>
  );
}

// Etiqueta que "salta" de trás do celular (o que a IA identificou).
function Etiqueta({ texto, x, y, quando, rotacao }) {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: f - quando, fps, config: { damping: 9, stiffness: 170 } });
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        padding: "22px 34px",
        borderRadius: 20,
        background: COR.marrom,
        color: COR.cremeClaro,
        fontFamily: SANS,
        fontWeight: 700,
        fontSize: 46,
        boxShadow: "0 20px 40px rgba(30, 20, 12, 0.35)",
        scale: `${s}`,
        rotate: `${rotacao * s}deg`,
        translate: `0 ${Math.sin((f + quando) / 12) * 8}px`,
      }}
    >
      {texto}
    </div>
  );
}

/* ---------------- cenas ---------------- */

function CenaLogo() {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: COR.noite, alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
      <div style={{ scale: `${interpolate(f, [0, 60, 75], [1, 1.04, 1.5], { ...C, easing: ENTRADA })}`, opacity: interpolate(f, [66, 75], [1, 0], C) }}>
        <CorujaLogo largura={760} velocidade={1.65} />
      </div>
    </AbsoluteFill>
  );
}

const PROBLEMAS = ["DEMITIDO?", "COBRANÇA INDEVIDA?", "PENSÃO?", "DESPEJO?"];

function CenaProblemas() {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const i = Math.min(PROBLEMAS.length - 1, Math.floor(f / 22));
  const local = f - i * 22;
  const claro = i % 2 === 1;
  const s = spring({ frame: local, fps, config: { damping: 11, stiffness: 220 } });
  const palavra = PROBLEMAS[i];
  return (
    <AbsoluteFill style={{ background: claro ? COR.creme : COR.marrom, alignItems: "center", justifyContent: "center" }}>
      <FaixasDeTexto texto={palavra.replace("?", "")} cor={claro ? COR.marrom : COR.creme} opacidade={0.16} />
      <div
        style={{
          fontFamily: SANS,
          fontWeight: 700,
          fontSize: palavra.length > 10 ? 132 : 170,
          lineHeight: 1,
          textAlign: "center",
          padding: "0 60px",
          letterSpacing: -3,
          color: claro ? COR.marrom : COR.cremeClaro,
          scale: `${interpolate(s, [0, 1], [2.2, 1])}`,
          rotate: `${(1 - s) * (i % 2 === 0 ? -10 : 10)}deg`,
          opacity: interpolate(local, [0, 3], [0, 1], C),
        }}
      >
        {palavra}
      </div>
    </AbsoluteFill>
  );
}

function CenaPergunta() {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const linhas = ["Não sabe", "a quem", "recorrer?"];
  return (
    <AbsoluteFill style={{ alignItems: "flex-start", justifyContent: "center", padding: "0 90px", gap: 6 }}>
      <FaixasDeTexto texto="NOCTURIS" cor={COR.creme} opacidade={0.12} />
      {linhas.map((l, i) => {
        const s = spring({ frame: f - 6 - i * 7, fps, config: { damping: 12, stiffness: 170 } });
        return (
          <div key={l} style={{ fontFamily: SERIF, fontSize: 150, lineHeight: 1.08, color: COR.cremeClaro, translate: `${(1 - s) * -700}px 0`, opacity: s }}>
            {l}
          </div>
        );
      })}
      <div
        style={{
          marginTop: 60,
          fontFamily: SANS,
          fontWeight: 700,
          fontSize: 64,
          color: COR.marromTinta,
          background: COR.creme,
          padding: "22px 40px",
          borderRadius: 20,
          scale: `${spring({ frame: f - 34, fps, config: { damping: 9, stiffness: 180 } })}`,
          rotate: "-3deg",
        }}
      >
        A Nocturis te ajuda.
      </div>
    </AbsoluteFill>
  );
}

const CASO = "Fui demitido e não pagaram minhas horas extras nem a rescisão.";

function CenaTriagem() {
  const f = useCurrentFrame();
  const letras = Math.floor(interpolate(f, [16, 58], [0, CASO.length], C));
  const pronto = letras > 30;
  const tocou = f >= 66;
  return (
    <>
      <FaixasDeTexto texto="CONTE" cor={COR.marrom} opacidade={0.1} />
      <Titulo numero="1">Conte o seu caso</Titulo>
      <Celular>
        <div style={{ padding: "50px 46px", display: "flex", flexDirection: "column", gap: 30 }}>
          <div style={{ height: 12, borderRadius: 6, background: COR.bege, overflow: "hidden" }}>
            <div style={{ height: "100%", width: tocou ? "50%" : "25%", background: COR.marrom }} />
          </div>
          <span style={{ fontFamily: SERIF, fontSize: 68, color: COR.texto }}>O que aconteceu?</span>
          <div style={{ minHeight: 400, borderRadius: 28, border: `3px solid ${COR.marrom}`, background: COR.cremeClaro, padding: 32, fontFamily: SANS, fontSize: 40, lineHeight: 1.45, color: COR.texto }}>
            {CASO.slice(0, letras)}
            <span style={{ display: "inline-block", width: 4, height: 44, marginLeft: 3, verticalAlign: "middle", background: COR.marrom, opacity: Math.floor(f / 8) % 2 ? 0 : 1 }} />
          </div>
          <div
            style={{
              alignSelf: "flex-end",
              fontFamily: SANS,
              fontWeight: 700,
              fontSize: 40,
              color: COR.cremeClaro,
              background: pronto ? COR.marrom : "#a8957f",
              padding: "28px 64px",
              borderRadius: 26,
              scale: `${interpolate(f, [66, 70, 75], [1, 0.9, 1], C)}`,
            }}
          >
            Continuar
          </div>
        </div>
      </Celular>
      <Toque x={690} y={1445} quando={66} />
      <Etiqueta texto="Trabalhista" x={60} y={1440} quando={76} rotacao={-7} />
      <Etiqueta texto="Horas extras" x={560} y={1610} quando={82} rotacao={6} />
    </>
  );
}

function CartaoGrande({ advogado, i, f, fps }) {
  const s = spring({ frame: f - 22 - i * 5, fps, config: { damping: 13, stiffness: 140 } });
  // carrossel: depois de entrar em leque, desliza de lado como quem passa o dedo
  const passa = interpolate(f, [62, 74], [0, -1], { ...C, easing: SAIDA });
  const posicao = i - 1 + passa;
  return (
    <div
      style={{
        position: "absolute",
        left: 540 - 300,
        top: 760,
        width: 600,
        padding: "48px 40px",
        borderRadius: 44,
        background: COR.cremeClaro,
        boxShadow: "0 40px 80px rgba(20, 12, 6, 0.4)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 20,
        translate: `${posicao * 560 * s}px ${(1 - s) * 900 + Math.abs(posicao) * 60}px`,
        rotate: `${posicao * 7}deg`,
        scale: `${Math.abs(posicao) < 0.5 ? 1 : 0.86}`,
        zIndex: 10 - Math.round(Math.abs(posicao) * 2),
      }}
    >
      <Img src={advogado.foto} style={{ width: 230, height: 230, borderRadius: "50%", objectFit: "cover", border: `8px solid ${COR.bege}` }} />
      <span style={{ fontFamily: SANS, fontWeight: 700, fontSize: 44, color: COR.texto, textAlign: "center" }}>{advogado.nome}</span>
      <span style={{ fontFamily: SANS, fontSize: 32, color: COR.textoSuave }}>{advogado.meta.split(" · ")[1]}</span>
      <span style={{ fontFamily: SANS, fontWeight: 700, fontSize: 32, color: COR.marrom }}>✓ Atua no seu caso</span>
    </div>
  );
}

function CenaResultado() {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const selo = spring({ frame: f - 8, fps, config: { damping: 10, stiffness: 180 } });
  return (
    <>
      <FaixasDeTexto texto="COMPATÍVEIS" cor={COR.creme} opacidade={0.1} tamanho={200} />
      <Titulo numero="2" cor={COR.cremeClaro}>
        A gente acha os mais compatíveis
      </Titulo>
      <div
        style={{
          position: "absolute",
          top: 560,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          scale: `${selo}`,
        }}
      >
        <span style={{ fontFamily: SANS, fontWeight: 700, fontSize: 40, letterSpacing: 3, color: COR.marromTinta, background: COR.creme, padding: "18px 34px", borderRadius: 18 }}>
          TRABALHISTA · HORAS EXTRAS
        </span>
      </div>
      {ADVOGADOS.map((a, i) => (
        <CartaoGrande key={a.nome} advogado={a} i={i} f={f} fps={fps} />
      ))}
      <Toque x={700} y={1180} quando={60} />
      <div style={{ position: "absolute", bottom: 150, left: 0, right: 0, textAlign: "center", fontFamily: SANS, fontWeight: 700, fontSize: 48, color: COR.creme, opacity: interpolate(f, [30, 40], [0, 1], C) }}>
        perto de você
      </div>
    </>
  );
}

function CenaAceito() {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const aviso = spring({ frame: f - 12, fps, config: { damping: 10, stiffness: 150 } });
  const tremida = f > 14 && f < 22 ? Math.sin(f * 3) * 6 : 0;
  const advogado = ADVOGADOS[0];
  return (
    <>
      <FaixasDeTexto texto="ACEITO" cor={COR.marrom} opacidade={0.1} />
      <Titulo numero="3">Fale direto com o advogado</Titulo>
      <div style={{ position: "absolute", inset: 0, translate: `${tremida}px 0` }}>
        <Celular quando={0} inclina={3}>
          <div style={{ padding: "60px 44px", display: "flex", flexDirection: "column", gap: 34, alignItems: "center" }}>
            <Img src={advogado.foto} style={{ width: 240, height: 240, borderRadius: "50%", objectFit: "cover", marginTop: 120 }} />
            <span style={{ fontFamily: SANS, fontWeight: 700, fontSize: 46, color: COR.texto }}>{advogado.nome}</span>
            <span style={{ fontFamily: SANS, fontWeight: 700, fontSize: 38, color: COR.marrom }}>✓ Pedido aceito</span>
            <div
              style={{
                width: "100%",
                textAlign: "center",
                fontFamily: SANS,
                fontWeight: 700,
                fontSize: 42,
                color: COR.cremeClaro,
                background: COR.marrom,
                padding: "34px 0",
                borderRadius: 28,
                marginTop: 20,
                scale: `${interpolate(f, [58, 62, 67], [1, 0.92, 1], C)}`,
              }}
            >
              Chamar no WhatsApp
            </div>
          </div>
        </Celular>
      </div>
      {/* aviso grande caindo por cima de tudo */}
      <div
        style={{
          position: "absolute",
          left: 70,
          right: 70,
          top: 470,
          padding: "34px 38px",
          borderRadius: 40,
          background: COR.cremeClaro,
          boxShadow: "0 40px 80px rgba(30, 20, 12, 0.35)",
          display: "flex",
          gap: 28,
          alignItems: "center",
          translate: `0 ${(1 - aviso) * -900}px`,
          rotate: `${(1 - aviso) * -6}deg`,
          zIndex: 20,
        }}
      >
        <div style={{ width: 110, height: 110, flex: "none", borderRadius: 28, background: COR.marrom, display: "grid", placeItems: "center" }}>
          <CorujaEstatica largura={84} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <span style={{ fontFamily: SANS, fontWeight: 700, fontSize: 40, color: COR.texto }}>Nocturis</span>
          <span style={{ fontFamily: SANS, fontSize: 36, lineHeight: 1.3, color: COR.textoSuave }}>Thiago aceitou o seu pedido de contato!</span>
        </div>
      </div>
      <Toque x={560} y={1410} quando={58} />
    </>
  );
}

function CenaFinal() {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const texto = spring({ frame: f - 30, fps, config: { damping: 12, stiffness: 150 } });
  const botao = spring({ frame: f - 40, fps, config: { damping: 9, stiffness: 170 } });
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 70 }}>
      <FaixasDeTexto texto="TRIAGEM GRÁTIS" cor={COR.creme} opacidade={0.1} tamanho={190} />
      <CorujaLogo largura={600} velocidade={2.4} />
      <div style={{ fontFamily: SERIF, fontSize: 84, lineHeight: 1.15, textAlign: "center", color: COR.cremeClaro, padding: "0 70px", opacity: texto, translate: `0 ${(1 - texto) * 60}px` }}>
        Encontre o advogado certo pro seu caso.
      </div>
      <div
        style={{
          fontFamily: SANS,
          fontWeight: 700,
          fontSize: 54,
          color: COR.marromTinta,
          background: COR.creme,
          padding: "30px 60px",
          borderRadius: 26,
          scale: `${botao * (1 + Math.sin(Math.max(0, f - 50) / 5) * 0.03)}`,
        }}
      >
        nocturis.com.br
      </div>
    </AbsoluteFill>
  );
}

// Ordem e duração (em quadros, 30 por segundo).
const CENAS = [
  { Comp: CenaLogo, dur: 75, fundo: COR.noite, crua: true },
  { Comp: CenaProblemas, dur: 90, fundo: COR.marrom },
  { Comp: CenaPergunta, dur: 75, fundo: COR.marromFundo, de: "lado" },
  { Comp: CenaTriagem, dur: 105, fundo: COR.creme },
  { Comp: CenaResultado, dur: 100, fundo: COR.marrom, de: "lado" },
  { Comp: CenaAceito, dur: 95, fundo: COR.creme },
  { Comp: CenaFinal, dur: 95, fundo: COR.marromFundo, de: "lado" },
];
export const DURACAO_REELS = CENAS.reduce((t, c) => t + c.dur, 0);

export function Reels() {
  let inicio = 0;
  return (
    <AbsoluteFill style={{ background: COR.noite }}>
      {CENAS.map(({ Comp, dur, fundo, de, crua }, i) => {
        const from = inicio;
        inicio += dur;
        return (
          <Sequence key={i} from={from} durationInFrames={dur}>
            {crua ? (
              <Comp />
            ) : (
              <Cena duracao={i === CENAS.length - 1 ? dur + 20 : dur} fundo={fundo} de={de}>
                <Comp />
              </Cena>
            )}
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
}
