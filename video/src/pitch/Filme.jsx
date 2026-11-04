import { Audio, Video } from "@remotion/media";
import { AbsoluteFill, Easing, Img, interpolate, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { CorujaEstatica } from "../Coruja";
import { COR, SANS, SERIF } from "../tema";
import { Vinheta } from "../Vinheta";
import { Ato2, DURACAO_ATO2, Frio, MUSICA_FIM_ATO2 } from "./Ato2";

// Pitch da Nocturis, versão 1 com as gravações do grupo (04/11/2026). Sem falas e sem o som
// das gravações: só a música do Reels (que vira a trilha), efeitos e a vinheta no fim.
// Ainda falta a cena dele chegando em casa (entra entre a demissão e o sofá).
const FPS = 30;
const s = (segundos) => Math.round(segundos * FPS);
const C = { extrapolateLeft: "clamp", extrapolateRight: "clamp" };

// Depois da notificação o mundo esquenta.
function Quente({ brilho = 1.1, children }) {
  return (
    <AbsoluteFill style={{ filter: `brightness(${brilho}) contrast(1.06) saturate(1.15)` }}>
      {children}
      <AbsoluteFill style={{ background: "#c98a4a", mixBlendMode: "soft-light", opacity: 0.35 }} />
    </AbsoluteFill>
  );
}

// Um pedaço de take com enquadramento: `zoom` [início, fim] a partir de `origem`.
// `crash` faz o zoom acontecer nos primeiros 6 quadros (o zoom brusco do susto).
function Plano({ arquivo, de, ate, zoom = [1, 1], origem = "50% 50%", velocidade = 1, crash = false }) {
  const f = useCurrentFrame();
  const dur = s((ate - de) / velocidade);
  const escala = crash
    ? interpolate(f, [0, 6], zoom, { ...C, easing: Easing.out(Easing.cubic) })
    : interpolate(f, [0, dur], zoom, { ...C, easing: Easing.inOut(Easing.quad) });
  return (
    <AbsoluteFill style={{ scale: `${escala}`, transformOrigin: origem }}>
      <Video
        src={staticFile(`pitch/${arquivo}`)}
        trimBefore={s(de)}
        trimAfter={s(ate)}
        playbackRate={velocidade}
        muted
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />
    </AbsoluteFill>
  );
}

// ---------- Ato 1: demissão (um plano só, recortado em vários pela edição) ----------
const DEMISSAO = [
  { de: 0.5, ate: 4.7, zoom: [1, 1.06] }, // o escritório parado, ele trabalhando (com o texto)
  { de: 4.7, ate: 6.6, zoom: [1.35, 1.4], origem: "45% 55%" }, // o chefe chega e puxa ele pelo ombro
  { de: 6.6, ate: 8.3, zoom: [1.8, 2.0], origem: "6% 30%" }, // o chefe gritando
  { de: 8.3, ate: 9.7, zoom: [1.15, 1.2], origem: "0% 45%" }, // os dois frente a frente
  { de: 9.7, ate: 13.6, zoom: [1.1, 1.15], origem: "60% 50%" }, // ele pega o papel e vai embora
]
const DUR_DEMISSAO = DEMISSAO.reduce((t, p) => t + s(p.ate - p.de), 0);

function Demissao() {
  let inicio = 0;
  return (
    <AbsoluteFill>
    <Frio brilho={1.0}>
      {DEMISSAO.map((p, i) => {
        const de = inicio;
        inicio += s(p.ate - p.de);
        return (
          <Sequence key={i} from={de} durationInFrames={s(p.ate - p.de)}>
            <Plano arquivo="demissao.mp4" {...p} />
          </Sequence>
        );
      })}
    </Frio>
    <Legenda />
    </AbsoluteFill>
  );
}

// Texto de abertura, discreto, como em filme.
function Legenda() {
  const f = useCurrentFrame();
  const op = interpolate(f, [15, 35, 100, 122], [0, 1, 1, 0], C);
  return (
    <div style={{ position: "absolute", left: 90, bottom: 90, opacity: op, translate: `0 ${(1 - op) * 12}px`, color: "white", textShadow: "0 2px 16px rgba(0,0,0,0.55)" }}>
      <div style={{ fontFamily: SANS, fontWeight: 600, fontSize: 30, letterSpacing: "0.22em", textTransform: "uppercase" }}>Escritório</div>
      <div style={{ fontFamily: SERIF, fontSize: 54, marginTop: 6 }}>Segunda-feira, 9h</div>
    </div>
  );
}

// ---------- Ato 3: advogado ----------
// A imagem congela no desânimo, a notificação desce, e daí em diante tudo esquenta.
const ADV = { triste: [0.3, 3.9], congela: 1.3, lendo: [3.9, 9.4], festa: [9.4, 10.9] };
const DUR_ADV =
  s(ADV.triste[1] - ADV.triste[0]) + s(ADV.congela) + s((ADV.lendo[1] - ADV.lendo[0]) / 1.4) + s(ADV.festa[1] - ADV.festa[0]);

function Notificacao({ quando, sai }) {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const desce = spring({ frame: f - quando, fps, config: { damping: 10, stiffness: 140 } });
  const pisca = interpolate(f - quando, [14, 17, 20], [1, 0.1, 1], C);
  const saida = interpolate(f, [sai, sai + 12], [0, 1], { ...C, easing: Easing.in(Easing.cubic) });
  return (
    <div
      style={{
        position: "absolute",
        top: 60,
        left: "50%",
        width: 900,
        translate: `-50% ${(1 - desce) * -260 - saida * 300}px`,
        rotate: `${(1 - desce) * -4}deg`,
        background: COR.cremeClaro,
        borderRadius: 30,
        boxShadow: "0 24px 60px rgba(0,0,0,0.45)",
        padding: "26px 32px",
        display: "flex",
        gap: 26,
        alignItems: "center",
      }}
    >
      <div style={{ width: 96, height: 96, flex: "none", borderRadius: 24, background: COR.marrom, display: "grid", placeItems: "center", opacity: 1 }}>
        <div style={{ opacity: pisca }}>
          <CorujaEstatica largura={74} />
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <span style={{ fontFamily: SANS, fontWeight: 700, fontSize: 36, color: COR.texto }}>Nocturis</span>
        <span style={{ fontFamily: SANS, fontSize: 34, color: COR.textoSuave }}>Novo pedido de contato: caso trabalhista</span>
      </div>
    </div>
  );
}

function Advogado() {
  const f = useCurrentFrame();
  const t1 = s(ADV.triste[1] - ADV.triste[0]);
  const t2 = t1 + s(ADV.congela);
  const t3 = t2 + s((ADV.lendo[1] - ADV.lendo[0]) / 1.4);
  // a cor vira junto com a notificação
  const virada = interpolate(f, [t1 + 10, t1 + 30], [0, 1], C);
  const cena = (
    <>
      <Sequence durationInFrames={t1}>
        <Plano arquivo="advogado.mp4" de={ADV.triste[0]} ate={ADV.triste[1]} zoom={[1.05, 1.12]} origem="35% 40%" />
      </Sequence>
      <Sequence from={t1} durationInFrames={s(ADV.congela)}>
        <AbsoluteFill style={{ scale: "1.12", transformOrigin: "35% 40%" }}>
          <Img src={staticFile("pitch/advogado-parado.png")} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </AbsoluteFill>
      </Sequence>
      <Sequence from={t2} durationInFrames={t3 - t2}>
        <Plano arquivo="advogado.mp4" de={ADV.lendo[0]} ate={ADV.lendo[1]} velocidade={1.4} zoom={[1.12, 1.2]} origem="35% 40%" />
      </Sequence>
      <Sequence from={t3}>
        <Plano arquivo="advogado.mp4" de={ADV.festa[0]} ate={ADV.festa[1]} zoom={[1.2, 1.4]} origem="30% 38%" />
      </Sequence>
    </>
  );
  return (
    <AbsoluteFill>
      <Frio brilho={1.0}>{cena}</Frio>
      <AbsoluteFill style={{ opacity: virada }}>
        <Quente>{cena}</Quente>
      </AbsoluteFill>
      <Sequence from={t1 - 4} durationInFrames={s(ADV.congela) + 40}>
        <Notificacao quando={4} sai={s(ADV.congela) + 26} />
      </Sequence>
    </AbsoluteFill>
  );
}

// ---------- Conversa (feita na edição: ainda não tem gravação) ----------
const MENSAGENS = [
  { de: "cliente", texto: "Oi, doutor! Fiz a triagem na Nocturis e enviei o meu caso." },
  { de: "advogado", texto: "Olá! Li o seu caso. Vamos conversar sobre a demissão?" },
  { de: "cliente", texto: "Vamos sim! Pode ser amanhã?" },
  { de: "advogado", texto: "Combinado. Traga a carteira de trabalho e os papéis da empresa." },
];
const PASSO_MSG = 34;
const DUR_CONVERSA = 30 + MENSAGENS.length * PASSO_MSG + 40;

function Conversa() {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const entra = spring({ frame: f, fps, config: { damping: 14 } });
  return (
    <AbsoluteFill style={{ background: COR.creme, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 110 }}>
      <div style={{ width: 560, fontFamily: SERIF, fontSize: 64, lineHeight: 1.2, color: COR.marromTinta, opacity: entra, translate: `${(1 - entra) * -60}px 0` }}>
        O contato só aparece depois que o advogado aceita.
      </div>
      <div
        style={{
          width: 600,
          height: 960,
          borderRadius: 64,
          background: COR.cremeClaro,
          border: `14px solid ${COR.marromTinta}`,
          boxShadow: "0 40px 90px rgba(59,40,28,0.35)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          translate: `0 ${(1 - entra) * 900}px`,
        }}
      >
        <div style={{ background: COR.marrom, padding: "50px 30px 24px", display: "flex", gap: 18, alignItems: "center" }}>
          <div style={{ width: 64, height: 64, borderRadius: 999, background: COR.bege, display: "grid", placeItems: "center", fontFamily: SANS, fontWeight: 700, fontSize: 26, color: COR.marromTinta }}>
            Dr.
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontFamily: SANS, fontWeight: 700, fontSize: 28, color: COR.cremeClaro }}>Advogado</span>
            <span style={{ fontFamily: SANS, fontSize: 20, color: COR.bege }}>contato liberado pela Nocturis</span>
          </div>
        </div>
        <div style={{ flex: 1, padding: 26, display: "flex", flexDirection: "column", gap: 18, justifyContent: "flex-end" }}>
          {MENSAGENS.map((m, i) => {
            const p = spring({ frame: f - 30 - i * PASSO_MSG, fps, config: { damping: 12, stiffness: 160 } });
            const cliente = m.de === "cliente";
            return (
              <div
                key={i}
                style={{
                  alignSelf: cliente ? "flex-end" : "flex-start",
                  maxWidth: "80%",
                  background: cliente ? COR.bege : "white",
                  border: `2px solid ${COR.bordaBege}`,
                  borderRadius: 26,
                  padding: "18px 22px",
                  fontFamily: SANS,
                  fontSize: 27,
                  lineHeight: 1.35,
                  color: COR.texto,
                  opacity: p,
                  scale: `${0.6 + p * 0.4}`,
                  transformOrigin: cliente ? "100% 100%" : "0% 100%",
                }}
              >
                {m.texto}
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
}

// ---------- Aperto de mão (o take mais de perto, o único em que as mãos se encontram) ----------
const MAOS = [
  { arquivo: "maos-perto.mp4", de: 0.2, ate: 3.6, zoom: [1.1, 1.25], origem: "58% 55%", velocidade: 0.85 },
]
const DUR_MAOS = MAOS.reduce((t, p) => t + s((p.ate - p.de) / (p.velocidade ?? 1)), 0);

function Maos() {
  let inicio = 0;
  return (
    <Quente brilho={1.25}>
      {MAOS.map((p, i) => {
        const de = inicio;
        const dur = s((p.ate - p.de) / (p.velocidade ?? 1));
        inicio += dur;
        return (
          <Sequence key={i} from={de} durationInFrames={dur}>
            <Plano {...p} />
          </Sequence>
        );
      })}
    </Quente>
  );
}

// ---------- Montagem ----------
const DUR_VINHETA = 180;
const PARTES = [
  { id: "demissao", dur: DUR_DEMISSAO, Comp: Demissao },
  { id: "ato2", dur: DURACAO_ATO2, Comp: () => <Ato2 sozinho={false} /> },
  { id: "advogado", dur: DUR_ADV, Comp: Advogado },
  { id: "conversa", dur: DUR_CONVERSA, Comp: Conversa },
  { id: "maos", dur: DUR_MAOS, Comp: Maos },
  { id: "vinheta", dur: DUR_VINHETA, Comp: Vinheta },
];
const INICIO = Object.fromEntries(PARTES.map((p, i) => [p.id, PARTES.slice(0, i).reduce((t, q) => t + q.dur, 0)]));
export const DURACAO_FILME = PARTES.reduce((t, p) => t + p.dur, 0);

function Trilha() {
  // a música do Reels continua do ponto em que o Ato 2 parou; fica quase muda enquanto o
  // advogado está desanimado e volta com a notificação
  const comeco = INICIO.advogado;
  const notif = INICIO.advogado + s(ADV.triste[1] - ADV.triste[0]);
  const fim = DURACAO_FILME;
  const volume = (q) => {
    const f = q + comeco;
    return interpolate(
      f,
      [comeco, comeco + 15, notif, notif + 10, INICIO.vinheta + 60, fim - 20],
      [0.55, 0.12, 0.12, 0.6, 0.55, 0],
      C,
    );
  };
  return (
    <Sequence from={comeco}>
      <Audio src={staticFile("musica.mp3")} trimBefore={s(MUSICA_FIM_ATO2)} volume={volume} />
    </Sequence>
  );
}

// [arquivo, quadro no filme, volume, duração]
const EFEITOS = [
  ["sfx/aviso.wav", INICIO.advogado + s(ADV.triste[1] - ADV.triste[0]) + 4, 0.8, 45], // notificação
  ...MENSAGENS.map((_, i) => ["sfx/pop.wav", INICIO.conversa + 30 + i * PASSO_MSG, 0.35, 20]),
]

export function Filme() {
  return (
    <AbsoluteFill style={{ background: "black" }}>
      {PARTES.map(({ id, dur, Comp }) => (
        <Sequence key={id} from={INICIO[id]} durationInFrames={dur}>
          <Comp />
        </Sequence>
      ))}
      <Trilha />
      {EFEITOS.map(([arquivo, quando, volume, dur], i) => (
        <Sequence key={i} from={quando} durationInFrames={dur ?? 30} layout="none">
          <Audio src={staticFile(arquivo)} volume={volume} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
}
