import { Audio } from "@remotion/media";
import { AbsoluteFill, Easing, interpolate, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { CorujaLogo } from "./Coruja";
import { COR, SERIF } from "./tema";

// Vinheta curta (29/10/2026): só a coruja montando, o nome sendo escrito e a frase do site.
// Serve pra abrir ou fechar a apresentação. Sai em horizontal e em vertical.
export const DURACAO_VINHETA = 180;

const C = { extrapolateLeft: "clamp", extrapolateRight: "clamp" };
const FRASE = "Encontre o advogado certo para o seu caso.".split(" ");

// [arquivo, quadro, volume, duração em quadros]: piscada, asas abrindo e a frase entrando.
const EFEITOS = [
  ["sfx/clique.wav", 31, 0.45],
  ["sfx/impacto.wav", 42, 0.4, 80],
  ["sfx/whoosh.wav", 100, 0.3, 30],
];

// `ingles` (no pitch): a voz do grupo diz "Nocturis" quando o nome é escrito e a frase em
// inglês quando a frase aparece, com a tradução em letra menor embaixo.
const VOZ = [
  ["pitch/voz-nocturis.wav", 68],
  ["pitch/voz-frase.wav", 104],
];

export function Vinheta({ ingles = false }) {
  const f = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const vertical = height > width;

  // luz quente atrás da coruja, acende junto com as asas
  const luz = interpolate(f, [40, 70], [0, 1], { ...C, easing: Easing.out(Easing.quad) });

  return (
    <AbsoluteFill style={{ background: COR.noite, alignItems: "center", justifyContent: "center" }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at 50% ${vertical ? 42 : 40}%, ${COR.marromFundo} 0%, transparent 55%)`,
          opacity: luz * 0.9,
        }}
      />
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: vertical ? 110 : 64 }}>
        <CorujaLogo largura={vertical ? 720 : 560} />
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            columnGap: "0.28em",
            maxWidth: vertical ? 860 : 1500,
            fontFamily: SERIF,
            fontSize: vertical ? 68 : 52,
            lineHeight: 1.25,
            color: COR.bege,
          }}
        >
          {FRASE.map((palavra, i) => {
            const p = interpolate(f, [100 + i * 4, 116 + i * 4], [0, 1], { ...C, easing: Easing.out(Easing.cubic) });
            return (
              <span key={i} style={{ opacity: p, translate: `0 ${(1 - p) * 28}px`, filter: `blur(${(1 - p) * 6}px)` }}>
                {palavra}
              </span>
            );
          })}
        </div>
      </div>

      {ingles && (
        <div
          style={{
            position: "absolute",
            bottom: vertical ? 330 : 120,
            width: "100%",
            textAlign: "center",
            fontFamily: SERIF,
            fontStyle: "italic",
            fontSize: vertical ? 44 : 34,
            color: COR.bege,
            opacity: interpolate(f, [110, 130], [0, 0.75], C),
          }}
        >
          Find the right lawyer for your case.
        </div>
      )}
      {ingles &&
        VOZ.map(([arquivo, quando]) => (
          <Sequence key={arquivo} from={quando} layout="none">
            <Audio src={staticFile(arquivo)} volume={1} />
          </Sequence>
        ))}
      {EFEITOS.filter(([arquivo]) => !(ingles && arquivo === "sfx/whoosh.wav")).map(([arquivo, quando, volume, dur], i) => (
        <Sequence key={i} from={quando} durationInFrames={dur ?? 30} layout="none">
          <Audio src={staticFile(arquivo)} volume={volume} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
}
