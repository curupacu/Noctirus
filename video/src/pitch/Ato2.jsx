import { Audio, Video } from "@remotion/media";
import { AbsoluteFill, Img, Easing, interpolate, Sequence, staticFile, useCurrentFrame } from "remotion";

// Rascunho do Ato 2 do pitch com as gravações do grupo (02/11/2026): sofá, rolando o feed,
// o Reels da Nocturis em tela cheia, os olhos arregalando e a triagem. Os arquivos em
// public/pitch/ são cópias leves (H.264, 1080p) dos takes originais em 4K do S24.
const FPS = 30;
const s = (segundos) => Math.round(segundos * FPS);
const C = { extrapolateLeft: "clamp", extrapolateRight: "clamp" };

// Antes da Nocturis o mundo é frio e apagado; o Reels fica com as cores dele.
export function Frio({ brilho = 1.4, children }) {
  return (
    <AbsoluteFill style={{ filter: `brightness(${brilho}) contrast(1.08) saturate(0.7)` }}>
      {children}
      <AbsoluteFill style={{ background: "#3a5470", mixBlendMode: "soft-light", opacity: 0.45 }} />
    </AbsoluteFill>
  );
}

// Um trecho de um take: `de` e `ate` em segundos do arquivo; `zoom` aproxima devagar a partir
// de `origem`; `velocidade` < 1 é câmera lenta. Só a cena do sofá tem som (os passos): nas
// outras gravações tem conversa de fundo, então o padrão é mudo.
function Take({ arquivo, de, ate, brilho, zoom = [1, 1], volume = 0, velocidade = 1, origem = "50% 50%" }) {
  const f = useCurrentFrame();
  const escala = interpolate(f, [0, s((ate - de) / velocidade)], zoom, { ...C, easing: Easing.inOut(Easing.cubic) });
  return (
    <Frio brilho={brilho}>
      <AbsoluteFill style={{ scale: `${escala}`, transformOrigin: origem }}>
        <Video
          src={staticFile(`pitch/${arquivo}`)}
          trimBefore={s(de)}
          trimAfter={s(ate)}
          playbackRate={velocidade}
          volume={(q) => volume * interpolate(q, [0, 8, s((ate - de) / velocidade) - 8, s((ate - de) / velocidade)], [0, 1, 1, 0], C)}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </AbsoluteFill>
    </Frio>
  );
}

// O Reels vertical no meio da tela, com fundo escuro da marca nas laterais. Mudo: a música
// entra limpa por baixo (o som do Reels tinha pops e whooshes que ficavam estranhos aqui).
function ReelsTelaCheia({ de }) {
  return (
    <AbsoluteFill style={{ background: "#120c08", alignItems: "center", justifyContent: "center" }}>
      <Video
        src={staticFile("pitch/reels.mp4")}
        trimBefore={s(de)}
        muted
        style={{ height: "100%", aspectRatio: "9 / 16", boxShadow: "0 30px 90px rgba(0,0,0,0.6)" }}
      />
    </AbsoluteFill>
  );
}

// Sincronia com o Reels (medida nos quadros): no take "rolando" o Reels começa a tocar no
// celular em 6,27 s; no take "perfil" a tela do celular está 3,4 s à frente do arquivo.
const ROLANDO_REELS = 6.27;
const PERFIL_REELS = 3.4;
const ROLANDO = [6.1, 7.9]; // ~1,5 s da coruja aparecendo no próprio celular
const REELS_DE = ROLANDO[1] - ROLANDO_REELS;
const REELS_DUR = 24.37 - REELS_DE;
// Corte pro rosto só onde o Reels tem texto grande e pouco importante ("PENSÃO?", "DESPEJO?");
// o tempo do Reels continua correndo, então nada aparece duas vezes.
const CORTE_PERFIL = { reels: 4.95, dur: 2.25 };
const TRIAGEM = [
  [2.5, 4.0], // digitando
  [35.8, 37.2], // "Confere se é isso"
  [38.0, 39.0], // coruja procurando advogados
  [41.0, 42.3], // "Caso trabalhista"
  [43.6, 45.0], // os mais compatíveis
];
// O último toque é em "Pedir contato": aproxima do botão e corta no clique (a página do
// WhatsApp, que vem depois, não aparece).
const TOQUE = { de: 47.5, ate: 49.05, velocidade: 1, momento: 48.9 };
const TOQUE_DUR = (TOQUE.ate - TOQUE.de) / TOQUE.velocidade;

// Versão simples (sem o motion da Nocturis): no lugar do Reels, prints do site com um zoom lento.
// `origem` aponta pra parte do print que importa.
const PRINTS = [
  { arquivo: "print1.png", origem: "38% 30%", zoom: [1.05, 1.18] }, // página inicial
  { arquivo: "print2.png", origem: "50% 28%", zoom: [1.35, 1.5] }, // "O que aconteceu?" com o caso escrito
  { arquivo: "print3.png", origem: "50% 35%", zoom: [1.3, 1.45] }, // "Confere se é isso"
  { arquivo: "print4.png", origem: "50% 42%", zoom: [1.3, 1.45] }, // os mais compatíveis
  { arquivo: "print5.png", origem: "50% 50%", zoom: [1.3, 1.45] }, // perfil do advogado com "Pedir contato"
];
const DUR_PRINT = 3.2;

function Prints() {
  const f = useCurrentFrame();
  const dur = s(DUR_PRINT);
  return (
    <AbsoluteFill style={{ background: "#fbf8f2" }}>
      {PRINTS.map(({ arquivo, origem, zoom }, i) => {
        if (f < i * dur || f >= (i + 1) * dur) return null;
        const escala = interpolate(f - i * dur, [0, dur], zoom, C);
        return (
          <AbsoluteFill key={arquivo} style={{ scale: `${escala}`, transformOrigin: origem }}>
            <Img src={staticFile(`pitch/prints/${arquivo}`)} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "50% 0%" }} />
          </AbsoluteFill>
        );
      })}
    </AbsoluteFill>
  );
}

// Monta o Ato 2 completo (com o Reels) ou simples (com os prints).
// `el` é função: o JSX só é criado na hora de desenhar o quadro.
function montar(simples) {
  const blocos = [
    { dur: 3.2, el: () => <Take arquivo="sofa.mp4" de={0.3} ate={3.5} brilho={1.45} zoom={[1, 1.03]} volume={1} /> },
    simples
      ? { dur: 2.0, el: () => <Take arquivo="perfil.mp4" de={20.5} ate={22.5} brilho={2.1} zoom={[1.05, 1.1]} /> } // o rosto iluminado pelo celular
      : { dur: ROLANDO[1] - ROLANDO[0], el: () => <Take arquivo="rolando.mp4" de={ROLANDO[0]} ate={ROLANDO[1]} brilho={1.5} zoom={[1, 1.08]} /> },
    simples
      ? { dur: PRINTS.length * DUR_PRINT, el: () => <Prints /> }
      : {
          dur: REELS_DUR,
          el: () => (
            <>
              <ReelsTelaCheia de={REELS_DE} />
              <Sequence from={s(CORTE_PERFIL.reels - REELS_DE)} durationInFrames={s(CORTE_PERFIL.dur)}>
                <Take
                  arquivo="perfil.mp4"
                  de={CORTE_PERFIL.reels + PERFIL_REELS}
                  ate={CORTE_PERFIL.reels + PERFIL_REELS + CORTE_PERFIL.dur}
                  brilho={2.1}
                  zoom={[1.05, 1.1]}
                />
              </Sequence>
            </>
          ),
        },
    { dur: 2.6, el: () => <Take arquivo="olhos.mp4" de={1.0} ate={3.6} brilho={1.45} zoom={[1, 1.1]} /> },
    ...TRIAGEM.map(([de, ate]) => ({ dur: ate - de, el: () => <Take arquivo="triagem.mp4" de={de} ate={ate} brilho={1.1} zoom={[1.15, 1.2]} /> })),
    {
      dur: TOQUE_DUR,
      el: () => (
        <Take arquivo="triagem.mp4" de={TOQUE.de} ate={TOQUE.ate} velocidade={TOQUE.velocidade} brilho={1.1} zoom={[1.15, 1.55]} origem="34% 72%" />
      ),
    },
  ];
  const inicios = blocos.map((_, i) => blocos.slice(0, i).reduce((t, b) => t + s(b.dur), 0));
  const duracao = blocos.reduce((t, b) => t + s(b.dur), 0);
  return { blocos, inicios, duracao, musicaFim: MUSICA_DE + (duracao - inicios[2]) / FPS };
}

// A música do Reels (sem os efeitos) toca do Reels (ou dos prints) até o fim do Ato 2, e o
// filme inteiro continua a trilha do ponto em que o Ato 2 parou.
const MUSICA_DE = REELS_DE + 40 / 30;
export const ATO2 = { completo: montar(false), simples: montar(true) };
export const DURACAO_ATO2 = ATO2.completo.duracao;
export const MUSICA_FIM_ATO2 = ATO2.completo.musicaFim;

// `sozinho`: rascunho avulso (a música some no fim). No filme inteiro a música segue.
export function Ato2({ sozinho = true, simples = false }) {
  const f = useCurrentFrame();
  const { blocos: BLOCOS, inicios: INICIOS, duracao: DURACAO_ATO2 } = ATO2[simples ? "simples" : "completo"];
  const toque = INICIOS[INICIOS.length - 1] + s((TOQUE.momento - TOQUE.de) / TOQUE.velocidade);
  // o corte final é seco: só um instante de preto no último quadro
  const escuro = interpolate(f, [DURACAO_ATO2 - 4, DURACAO_ATO2], [0, 1], C);
  return (
    <AbsoluteFill style={{ background: "black" }}>
      {BLOCOS.map((b, i) => (
        <Sequence key={i} from={INICIOS[i]} durationInFrames={s(b.dur)}>
          {b.el()}
        </Sequence>
      ))}
      {/* o Reels começa saindo baixinho do celular, antes de ir pra tela cheia */}
      {!simples && <Sequence from={INICIOS[1] + s(ROLANDO_REELS - ROLANDO[0])} durationInFrames={s(ROLANDO[1] - ROLANDO_REELS) + 6}>
        <Audio src={staticFile("pitch/musica-celular.wav")} volume={(q) => 0.8 * interpolate(q, [0, 4, s(ROLANDO[1] - ROLANDO_REELS) - 2, s(ROLANDO[1] - ROLANDO_REELS) + 6], [0, 1, 1, 0], C)} />
      </Sequence>}
      {/* a música do Reels segue como trilha depois dele (L-cut) */}
      <Sequence from={INICIOS[2]}>
        <Audio
          src={staticFile("musica.mp3")}
          trimBefore={s(MUSICA_DE)}
          volume={(q) => interpolate(q, [0, 6, DURACAO_ATO2 - INICIOS[2] - 12, DURACAO_ATO2 - INICIOS[2]], [0, 0.6, 0.6, sozinho ? 0 : 0.6], C)}
        />
      </Sequence>
      <Sequence from={toque} durationInFrames={30}>
        <Audio src={staticFile("sfx/clique.wav")} volume={0.8} />
      </Sequence>
      {sozinho && <AbsoluteFill style={{ background: "black", opacity: escuro }} />}
    </AbsoluteFill>
  );
}
