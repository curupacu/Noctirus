import { AbsoluteFill, Easing, interpolate, Sequence, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { CorujaLogo } from "./Coruja";
import { TelaAceito, TelaResultado, TelaTriagem } from "./Telas";
import { COR, SANS, SERIF } from "./tema";

// Vídeo promocional da Nocturis (roteiro aprovado em 28/10/2026), 30 s, 1920x1080.
// 0 a 4 s logo | 4 a 9 s pergunta | 9 a 26 s o celular com triagem, resultado e aceite |
// 26 a 30 s final com a logo e o site.

function Esmaecer({ children, duracao, entrada = 12, saida = 12 }) {
  const quadro = useCurrentFrame();
  const opacidade = interpolate(quadro, [0, entrada, duracao - saida, duracao], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return <AbsoluteFill style={{ opacity: opacidade }}>{children}</AbsoluteFill>;
}

function Abertura() {
  return (
    <AbsoluteFill style={{ background: COR.noite, alignItems: "center", justifyContent: "center" }}>
      <CorujaLogo largura={560} />
    </AbsoluteFill>
  );
}

function Pergunta() {
  const quadro = useCurrentFrame();
  const { fps } = useVideoConfig();
  const linhas = ["Tem um problema", "e não sabe a quem recorrer?"];
  return (
    <AbsoluteFill style={{ background: COR.marrom, alignItems: "center", justifyContent: "center", gap: 10 }}>
      {linhas.map((linha, i) => {
        const s = spring({ frame: quadro - 8 - i * 14, fps, config: { damping: 18 } });
        return (
          <div
            key={linha}
            style={{
              fontFamily: SERIF,
              fontSize: 104,
              lineHeight: 1.15,
              color: COR.creme,
              opacity: s,
              transform: `translateY(${(1 - s) * 40}px)`,
            }}
          >
            {linha}
          </div>
        );
      })}
      <div
        style={{
          width: interpolate(quadro, [40, 70], [0, 120], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) }),
          height: 3,
          marginTop: 36,
          background: COR.creme,
        }}
      />
    </AbsoluteFill>
  );
}

const PASSOS = [
  { de: 0, ate: 180, numero: "1", titulo: "Conte o que aconteceu", texto: "Com suas palavras, sem precisar saber nada de Direito.", Tela: TelaTriagem },
  { de: 180, ate: 360, numero: "2", titulo: "A gente identifica a área", texto: "E mostra os advogados mais compatíveis com o seu caso, perto de você.", Tela: TelaResultado },
  { de: 360, ate: 510, numero: "3", titulo: "O advogado aceita", texto: "E vocês conversam direto, pelo WhatsApp ou por e-mail.", Tela: TelaAceito },
];

function Legenda({ passo, quadroLocal }) {
  const { fps } = useVideoConfig();
  const s = spring({ frame: quadroLocal - 6, fps, config: { damping: 18 } });
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 26, opacity: s, transform: `translateX(${(1 - s) * -50}px)` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 18, fontFamily: SANS, fontWeight: 700, fontSize: 24, letterSpacing: 3, color: COR.marrom }}>
        <span style={{ width: 48, height: 3, background: COR.marrom }} />
        PASSO {passo.numero}
      </div>
      <div style={{ fontFamily: SERIF, fontSize: 84, lineHeight: 1.1, color: COR.texto }}>{passo.titulo}</div>
      <div style={{ fontFamily: SANS, fontSize: 34, lineHeight: 1.45, color: COR.textoSuave, maxWidth: 760 }}>{passo.texto}</div>
    </div>
  );
}

function Celular() {
  const quadro = useCurrentFrame();
  const { fps } = useVideoConfig();
  const entra = spring({ frame: quadro, fps, config: { damping: 18, stiffness: 80 } });

  return (
    <AbsoluteFill style={{ background: COR.fundo }}>
      {/* faixa bege atrás do celular, como as seções da Home */}
      <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: 760, background: COR.bege }} />

      {PASSOS.map((passo) => {
        const local = quadro - passo.de;
        if (local < 0 || quadro >= passo.ate) return null;
        const sai = interpolate(quadro, [passo.ate - 12, passo.ate], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        return (
          <div key={passo.numero} style={{ position: "absolute", left: 150, top: 0, bottom: 0, width: 860, display: "flex", alignItems: "center", opacity: passo.numero === "3" ? 1 : sai }}>
            <Legenda passo={passo} quadroLocal={local} />
          </div>
        );
      })}

      <div
        style={{
          position: "absolute",
          right: 190,
          top: 60,
          width: 470,
          height: 960,
          borderRadius: 70,
          background: COR.marromTinta,
          padding: 16,
          boxShadow: "0 40px 90px rgba(59, 40, 28, 0.35)",
          transform: `translateY(${(1 - entra) * 700}px) rotate(${(1 - entra) * 6}deg)`,
        }}
      >
        <div style={{ position: "relative", width: "100%", height: "100%", borderRadius: 56, overflow: "hidden", background: COR.fundo }}>
          {PASSOS.map((passo) => {
            const opac = interpolate(quadro, [passo.de, passo.de + 12, passo.ate - 12, passo.ate], [0, 1, 1, 0], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
            const ultimo = passo.numero === "3";
            if (quadro < passo.de || (!ultimo && quadro >= passo.ate)) return null;
            return (
              <Sequence key={passo.numero} from={passo.de} layout="none">
                <div style={{ position: "absolute", inset: 0, opacity: passo.de === 0 ? 1 : ultimo ? Math.min(1, opac * 2) : opac }}>
                  <passo.Tela />
                </div>
              </Sequence>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
}

function Final() {
  const quadro = useCurrentFrame();
  const { fps } = useVideoConfig();
  const texto = spring({ frame: quadro - 40, fps, config: { damping: 18 } });
  return (
    <AbsoluteFill style={{ background: COR.marromFundo, alignItems: "center", justifyContent: "center", gap: 56 }}>
      <CorujaLogo largura={400} velocidade={1.7} />
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18, opacity: texto, transform: `translateY(${(1 - texto) * 30}px)` }}>
        <div style={{ fontFamily: SERIF, fontSize: 60, color: COR.creme }}>Encontre o advogado certo para o seu caso.</div>
        <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 34, letterSpacing: 2, color: "#e6d3b8" }}>nocturis.com.br</div>
      </div>
    </AbsoluteFill>
  );
}

export function Promo() {
  return (
    <AbsoluteFill style={{ background: COR.noite }}>
      <Sequence durationInFrames={120}>
        <Esmaecer duracao={120} entrada={1}>
          <Abertura />
        </Esmaecer>
      </Sequence>
      <Sequence from={120} durationInFrames={150}>
        <Esmaecer duracao={150}>
          <Pergunta />
        </Esmaecer>
      </Sequence>
      <Sequence from={270} durationInFrames={510}>
        <Esmaecer duracao={510}>
          <Celular />
        </Esmaecer>
      </Sequence>
      <Sequence from={780} durationInFrames={120}>
        <Esmaecer duracao={120} saida={1}>
          <Final />
        </Esmaecer>
      </Sequence>
    </AbsoluteFill>
  );
}
