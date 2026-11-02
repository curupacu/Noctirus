import { Audio, Video } from "@remotion/media";
import { AbsoluteFill, interpolate, Sequence, staticFile, useCurrentFrame } from "remotion";

// Rascunho do Ato 2 do pitch com as gravações do grupo (02/11/2026): sofá, rolando o feed,
// o Reels da Nocturis em tela cheia, os olhos arregalando e a triagem. Os arquivos em
// public/pitch/ são cópias leves (H.264, 1080p) dos takes originais em 4K do S24.
const FPS = 30;
const s = (segundos) => Math.round(segundos * FPS);
const C = { extrapolateLeft: "clamp", extrapolateRight: "clamp" };

// Antes da Nocturis o mundo é frio e apagado; o Reels fica com as cores dele.
function Frio({ brilho = 1.4, children }) {
  return (
    <AbsoluteFill style={{ filter: `brightness(${brilho}) contrast(1.08) saturate(0.7)` }}>
      {children}
      <AbsoluteFill style={{ background: "#3a5470", mixBlendMode: "soft-light", opacity: 0.45 }} />
    </AbsoluteFill>
  );
}

// Um trecho de um take: `de` e `ate` em segundos do arquivo; `zoom` aproxima devagar.
function Take({ arquivo, de, ate, brilho, zoom = [1, 1], volume = 1 }) {
  const f = useCurrentFrame();
  const escala = interpolate(f, [0, s(ate - de)], zoom, C);
  return (
    <Frio brilho={brilho}>
      <AbsoluteFill style={{ scale: `${escala}` }}>
        <Video
          src={staticFile(`pitch/${arquivo}`)}
          trimBefore={s(de)}
          trimAfter={s(ate)}
          volume={volume}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </AbsoluteFill>
    </Frio>
  );
}

// O Reels vertical no meio da tela, com fundo escuro da marca nas laterais.
function ReelsTelaCheia({ de }) {
  return (
    <AbsoluteFill style={{ background: "#120c08" }}>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <Video
          src={staticFile("pitch/reels.mp4")}
          trimBefore={s(de)}
          volume={0.9}
          style={{ height: "100%", aspectRatio: "9 / 16", boxShadow: "0 30px 90px rgba(0,0,0,0.6)" }}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
}

// Inícios no Reels e nos takes (em segundos). No take "perfil" o Reels do celular está
// 1 s atrasado em relação ao arquivo, então o rosto aparece com a tela certa.
const REELS_DE = 0.6;
const REELS_DUR = 24.37 - REELS_DE;
const CORTES_PERFIL = [
  { reels: 9.0, dur: 2.0 },
  { reels: 17.5, dur: 2.2 },
];
const TRIAGEM = [
  [2.5, 4.0],
  [35.8, 37.2],
  [38.0, 39.0],
  [41.0, 42.3],
  [43.6, 45.4],
];

// `el` é função: o JSX só é criado na hora de desenhar o quadro
const BLOCOS = [
  { dur: 6.3, el: () => <Take arquivo="sofa.mp4" de={0.5} ate={6.8} brilho={1.45} zoom={[1, 1.04]} /> },
  { dur: 5.4, el: () => <Take arquivo="rolando.mp4" de={2.0} ate={7.4} brilho={1.5} zoom={[1, 1.06]} /> },
  {
    dur: REELS_DUR,
    el: () => (
      <>
        <ReelsTelaCheia de={REELS_DE} />
        {CORTES_PERFIL.map(({ reels, dur }) => (
          <Sequence key={reels} from={s(reels - REELS_DE)} durationInFrames={s(dur)}>
            <Take arquivo="perfil.mp4" de={reels - 1} ate={reels - 1 + dur} brilho={2.1} zoom={[1.05, 1.1]} volume={0} />
          </Sequence>
        ))}
      </>
    ),
  },
  { dur: 2.6, el: () => <Take arquivo="olhos.mp4" de={1.0} ate={3.6} brilho={1.45} zoom={[1, 1.1]} volume={0.4} /> },
  ...TRIAGEM.map(([de, ate]) => ({ dur: ate - de, el: () => <Take arquivo="triagem.mp4" de={de} ate={ate} brilho={1.1} zoom={[1.15, 1.2]} volume={0.4} /> })),
];

const INICIOS = BLOCOS.map((_, i) => BLOCOS.slice(0, i).reduce((t, b) => t + s(b.dur), 0));
export const DURACAO_ATO2 = BLOCOS.reduce((t, b) => t + s(b.dur), 0);

export function Ato2() {
  const f = useCurrentFrame();
  const fimReels = INICIOS[3];
  // fade pro preto no fim do rascunho
  const escuro = interpolate(f, [DURACAO_ATO2 - 15, DURACAO_ATO2], [0, 1], C);
  return (
    <AbsoluteFill style={{ background: "black" }}>
      {BLOCOS.map((b, i) => (
        <Sequence key={i} from={INICIOS[i]} durationInFrames={s(b.dur)}>
          {b.el()}
        </Sequence>
      ))}
      {/* depois do Reels a música dele continua como trilha (L-cut), do mesmo ponto */}
      <Sequence from={fimReels - 12}>
        <Audio
          src={staticFile("musica.mp3")}
          trimBefore={s(REELS_DE + REELS_DUR + 40 / 30 - 0.4)}
          volume={(q) => interpolate(q, [0, 12, DURACAO_ATO2 - fimReels - 10, DURACAO_ATO2 - fimReels + 12], [0, 0.55, 0.55, 0], C)}
        />
      </Sequence>
      <AbsoluteFill style={{ background: "black", opacity: escuro }} />
    </AbsoluteFill>
  );
}
