import { Audio, Video } from "@remotion/media";
import { AbsoluteFill, Easing, interpolate, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { CorujaLogo } from "../Coruja";
import { TelaResultado, TelaTriagem } from "../Telas";
import { COR, SANS, SERIF } from "../tema";
import { Balao, Pessoa } from "./Pessoa";

// Animatic do pitch (29/10/2026): o roteiro de docs/ROTEIRO_PITCH.md com bonequinhos, pro
// grupo ver o ritmo, os cortes e os enquadramentos antes de gravar com gente de verdade.
// Cada cena mostra embaixo qual é o plano (aberto, médio, fechado...).

const C = { extrapolateLeft: "clamp", extrapolateRight: "clamp" };
const SUAVE = Easing.bezier(0.45, 0, 0.2, 1);

// Personagens
const FUNCIONARIO = { pele: "#c58c63", cabelo: "#2a1f16", camisa: "#a8957f", calca: "#3b281c" };
const CHEFE = { pele: "#e0b48f", cabelo: "#5e4e3b", tipoCabelo: "careca", camisa: "#fffdf8", paleto: "#37291c", gravata: "#765039", oculos: true, calca: "#1e1913" };
const ADVOGADO = { pele: "#8d5a3b", cabelo: "#1e1913", camisa: "#fffdf8", paleto: "#5c3e2b", gravata: "#3b281c", calca: "#2a1f16" };

// Câmera: lista de posições {f, s (zoom), x, y (ponto em foco)}. corte: true = troca seca.
function useCamera(chaves) {
  const f = useCurrentFrame();
  let i = 0;
  while (i < chaves.length - 1 && chaves[i + 1].f <= f) i++;
  const a = chaves[i];
  const b = chaves[i + 1];
  let s = a.s;
  let x = a.x;
  let y = a.y;
  if (b && !b.corte) {
    const t = interpolate(f, [a.f, b.f], [0, 1], { ...C, easing: b.rapido ? Easing.bezier(0.7, 0, 0.3, 1) : SUAVE });
    s = a.s + (b.s - a.s) * t;
    x = a.x + (b.x - a.x) * t;
    y = a.y + (b.y - a.y) * t;
  }
  return { transformOrigin: "0 0", translate: `${960 - x * s}px ${540 - y * s}px`, scale: `${s}` };
}

function Palco({ camera, fundo, children }) {
  return (
    <AbsoluteFill style={{ background: fundo, overflow: "hidden" }}>
      <AbsoluteFill style={camera}>
        <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0, overflow: "visible" }}>
          {children}
        </svg>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}

// Etiqueta de filmagem: cena e plano (o que muda conforme os cortes).
function Plaquinha({ cena, planos }) {
  const f = useCurrentFrame();
  let plano = planos[0][1];
  for (const [quando, nome] of planos) if (f >= quando) plano = nome;
  return (
    <div style={{ position: "absolute", left: 40, bottom: 36, display: "flex", gap: 12, fontFamily: SANS, fontWeight: 700, fontSize: 24, letterSpacing: 1.5, zIndex: 50 }}>
      <span style={{ background: "rgba(30, 20, 12, 0.78)", color: COR.creme, padding: "10px 18px", borderRadius: 10 }}>{cena}</span>
      <span style={{ background: "rgba(255, 253, 248, 0.88)", color: COR.marromTinta, padding: "10px 18px", borderRadius: 10 }}>{plano}</span>
    </div>
  );
}

function MolduraCelular({ x = 725, y = 60, largura = 470, altura = 960, children, giro = 0 }) {
  return (
    <div style={{ position: "absolute", left: x, top: y, width: largura, height: altura, borderRadius: 70, background: COR.marromTinta, padding: 16, boxShadow: "0 40px 90px rgba(30, 20, 12, 0.35)", rotate: `${giro}deg` }}>
      <div style={{ position: "relative", width: "100%", height: "100%", borderRadius: 56, overflow: "hidden", background: COR.fundo }}>{children}</div>
    </div>
  );
}

function Toque({ x, y, quando }) {
  const f = useCurrentFrame();
  const onda = interpolate(f, [quando, quando + 14], [0, 1], C);
  if (f < quando - 10 || f > quando + 22) return null;
  return (
    <div style={{ position: "absolute", left: x - 40, top: y - 40, width: 80, height: 80, borderRadius: "50%", background: "rgba(255,253,248,0.8)", boxShadow: "0 6px 20px rgba(0,0,0,0.3)", scale: `${f >= quando ? 1 - onda * 0.2 : 1}`, opacity: interpolate(f, [quando + 12, quando + 22], [1, 0], C), zIndex: 30 }} />
  );
}

/* ---------------- Cena 1: a demissão ---------------- */
function CenaDemissao() {
  const f = useCurrentFrame();
  const camera = useCamera([
    { f: 0, s: 1, x: 960, y: 540 },
    { f: 120, s: 1.9, x: 1350, y: 430, corte: true },
    { f: 262, s: 1.9, x: 650, y: 470, corte: true },
    { f: 272, s: 3.6, x: 650, y: 470, rapido: true },
  ]);
  const choque = f >= 262;
  return (
    <AbsoluteFill>
      <Palco camera={camera} fundo="#efe2d0">
        <rect x={0} y={820} width={1920} height={260} fill="#a07a58" />
        <rect x={1180} y={160} width={420} height={300} rx={10} fill="#fffdf8" stroke="#c89b6a" strokeWidth={14} />
        <line x1={1390} x2={1390} y1={160} y2={460} stroke="#c89b6a" strokeWidth={10} />
        <rect x={300} y={300} width={120} height={160} rx={8} fill="#c89b6a" opacity={0.5} />
        <Pessoa x={1350} y={560} {...CHEFE} expressao={f > 120 ? "triste" : "neutro"} bracoE={30} bracoD={-30} />
        <rect x={1100} y={640} width={560} height={40} rx={8} fill="#5c3e2b" />
        <rect x={1130} y={680} width={500} height={200} fill="#765039" />
        <Pessoa x={650} y={574} {...FUNCIONARIO} expressao={choque ? (f > 340 ? "triste" : "choque") : "neutro"} espelhar />
      </Palco>
      <Balao x={1080} y={190} texto="Fecha a porta, por favor." aparece={20} some={110} largura={460} lado="direita" />
      <Balao x={500} y={130} texto="A gente vai ter que te desligar." aparece={150} some={250} largura={620} lado="direita" />
      {f >= 420 && <AbsoluteFill style={{ background: "#000" }} />}
      <Plaquinha cena="CENA 1 · O ESCRITÓRIO" planos={[[0, "plano aberto"], [120, "plano médio no chefe"], [262, "crash zoom no rosto"], [420, "silêncio"]]} />
    </AbsoluteFill>
  );
}

/* ---------------- Cena 2: em casa ---------------- */
function Contas() {
  const papeis = [
    [180, 200, -6], [330, 170, 4], [470, 230, -3], [250, 360, 7], [410, 380, -8], [560, 330, 3], [150, 520, 5], [320, 540, -4], [480, 500, 6],
  ];
  return (
    <g>
      {papeis.map(([x, y, r], i) => (
        <g key={i} transform={`rotate(${r} ${x} ${y})`}>
          <rect x={x - 60} y={y - 75} width={120} height={150} fill="#fffdf8" stroke="#dccbb0" strokeWidth={3} />
          <text x={x} y={y - 25} textAnchor="middle" fontFamily="IBM Plex Sans" fontWeight={700} fontSize={26} fill="#765039">
            R$
          </text>
          {[0, 1, 2].map((k) => (
            <rect key={k} x={x - 40} y={y + k * 18} width={80 - k * 18} height={6} rx={3} fill="#dccbb0" />
          ))}
        </g>
      ))}
    </g>
  );
}

const POSTS = ["#dccbb0", "#c89b6a", "#e6d3b8", "#a07a58"];

function TelaFeed() {
  const f = useCurrentFrame();
  // rola o feed rápido e para no Reels da Nocturis
  const rolagem = interpolate(f, [0, 80], [0, 4 * 520], { ...C, easing: Easing.bezier(0.2, 0.6, 0.3, 1) });
  return (
    <div style={{ position: "absolute", inset: 0, background: "#fffdf8" }}>
      <div style={{ translate: `0 ${-rolagem}px` }}>
        {POSTS.map((cor, i) => (
          <div key={i} style={{ height: 520, padding: "20px 0" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "0 20px 12px" }}>
              <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#dccbb0" }} />
              <div style={{ width: 140, height: 12, borderRadius: 6, background: "#e6d3b8" }} />
            </div>
            <div style={{ height: 420, background: cor }} />
          </div>
        ))}
        <div style={{ height: 928, position: "relative", background: "#000" }}>
          <Sequence from={80} layout="none">
            <Video src={staticFile("reels.mp4")} muted style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </Sequence>
        </div>
      </div>
    </div>
  );
}

function CenaCasa() {
  const f = useCurrentFrame();
  const anda = interpolate(f, [0, 80], [2050, 1150], { ...C, easing: Easing.out(Easing.quad) });
  const sentou = f >= 110;
  const camera = useCamera([
    { f: 0, s: 1, x: 960, y: 540 },
    { f: 160, s: 1.7, x: 820, y: 470, corte: true },
    { f: 480, s: 3.2, x: 760, y: 470, corte: true },
  ]);
  const mostraCelular = f >= 210 && f < 480;
  const mochila = interpolate(f, [86, 100], [0, 1], { ...C, easing: Easing.in(Easing.quad) });
  return (
    <AbsoluteFill>
      <Palco camera={camera} fundo="#e6d3b8">
        <rect x={0} y={800} width={1920} height={280} fill="#8a5e38" />
        <Contas />
        <rect x={1650} y={260} width={200} height={540} fill="#765039" />
        <circle cx={1680} cy={540} r={10} fill="#e6d3b8" />
        {/* sofá */}
        <rect x={560} y={560} width={620} height={110} rx={40} fill="#5c3e2b" />
        <rect x={540} y={650} width={660} height={130} rx={36} fill="#765039" />
        {f >= 86 && <rect x={sentou ? 1250 : anda + 60} y={600 + mochila * 150} width={90} height={120} rx={24} fill="#3b281c" transform={`rotate(${mochila * 70} ${sentou ? 1295 : anda + 105} ${660 + mochila * 150})`} />}
        {sentou ? (
          <Pessoa x={760} y={562} {...FUNCIONARIO} sentado expressao={f > 500 ? "neutro" : "cansado"} celular={f >= 170} bracoE={f >= 170 ? 105 : 20} />
        ) : (
          <Pessoa x={anda} y={554} {...FUNCIONARIO} expressao="cansado" espelhar bracoE={Math.sin(f / 5) * 15} bracoD={-Math.sin(f / 5) * 15} />
        )}
      </Palco>
      {mostraCelular && (
        <Sequence from={210} layout="none">
          <AbsoluteFill style={{ background: "rgba(30,20,12,0.55)" }}>
            <MolduraCelular>
              <TelaFeed />
            </MolduraCelular>
          </AbsoluteFill>
        </Sequence>
      )}
      <Balao x={560} y={110} texto="Peraí..." aparece={510} largura={260} lado="direita" />
      <Plaquinha cena="CENA 2 · EM CASA" planos={[[0, "plano aberto"], [160, "plano médio"], [210, "gravação de tela: o Reels da Nocturis aparece no feed"], [480, "close no rosto"]]} />
    </AbsoluteFill>
  );
}

/* ---------------- Cena 3: a triagem ---------------- */
function CenaTriagem() {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: COR.fundo }}>
      <div style={{ position: "absolute", left: 130, top: 400, width: 540, fontFamily: SERIF, fontSize: 56, lineHeight: 1.15, color: COR.texto, opacity: interpolate(f, [10, 30], [0, 1], C) }}>
        {f < 300 ? "Ele conta o que aconteceu, do jeito dele." : "E a Nocturis mostra os mais compatíveis."}
      </div>
      <MolduraCelular>
        <Sequence durationInFrames={300} layout="none">
          <TelaTriagem />
        </Sequence>
        <Sequence from={300} layout="none">
          <TelaResultado />
        </Sequence>
      </MolduraCelular>
      {/* reação dele, intercalada */}
      <div style={{ position: "absolute", right: 170, top: 330, width: 380, height: 380, borderRadius: "50%", overflow: "hidden", background: "#e6d3b8", border: `10px solid ${COR.fundo}`, boxShadow: "0 20px 50px rgba(30,20,12,0.2)" }}>
        <svg width={380} height={380} viewBox="0 0 380 380">
          <Pessoa x={190} y={330} escala={1.6} {...FUNCIONARIO} expressao={f > 430 ? "feliz" : f > 340 ? "neutro" : "cansado"} />
        </svg>
      </div>
      <Toque x={1059} y={671} quando={150} />
      <Plaquinha cena="CENA 3 · A TRIAGEM" planos={[[0, "gravação de tela + close do rosto intercalado"]]} />
    </AbsoluteFill>
  );
}

/* ---------------- Cena 4: o advogado ---------------- */
function TelaPedido() {
  const f = useCurrentFrame();
  const aceito = f >= 120;
  return (
    <div style={{ position: "absolute", inset: 0, padding: "60px 30px", display: "flex", flexDirection: "column", gap: 20, background: COR.fundo }}>
      <span style={{ fontFamily: SANS, fontWeight: 700, fontSize: 15, letterSpacing: 1.4, color: COR.marrom }}>NOVO PEDIDO DE CONTATO</span>
      <div style={{ borderRadius: 22, background: "#fff", padding: 24, boxShadow: "0 8px 24px rgba(59,40,28,0.12)", display: "flex", flexDirection: "column", gap: 12 }}>
        <span style={{ fontFamily: SANS, fontWeight: 700, fontSize: 13, letterSpacing: 1.2, color: COR.marrom }}>TRABALHISTA · HORAS EXTRAS</span>
        <span style={{ fontFamily: SERIF, fontSize: 28, color: COR.texto }}>Lucas, São Paulo/SP</span>
        <span style={{ fontFamily: SANS, fontSize: 17, lineHeight: 1.5, color: COR.textoSuave }}>
          "Fui demitido e a empresa não pagou minhas horas extras nem a rescisão. Trabalhei lá 3 anos."
        </span>
      </div>
      <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 19, textAlign: "center", padding: "16px 0", borderRadius: 14, color: COR.cremeClaro, background: aceito ? COR.marromFundo : COR.marrom }}>
        {aceito ? "✓ Pedido aceito" : "Aceitar"}
      </div>
      {!aceito && (
        <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 19, textAlign: "center", padding: "14px 0", borderRadius: 14, color: COR.marrom, border: `1.5px solid ${COR.marrom}` }}>Recusar</div>
      )}
    </div>
  );
}

function CenaAdvogado() {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const camera = useCamera([
    { f: 0, s: 1, x: 960, y: 540 },
    { f: 200, s: 1.25, x: 960, y: 500 },
    { f: 420, s: 3.1, x: 960, y: 420, corte: true },
  ]);
  const vibra = f > 200 && f < 236 ? Math.sin(f * 2.4) * 6 : 0;
  const aviso = spring({ frame: f - 204, fps, config: { damping: 12 } });
  const sorri = f > 450;
  return (
    <AbsoluteFill>
      <Palco camera={camera} fundo="#dccbb0">
        <rect x={0} y={820} width={1920} height={260} fill="#8a5e38" />
        {/* agenda vazia na parede */}
        <rect x={260} y={170} width={460} height={380} rx={14} fill="#fffdf8" />
        <rect x={260} y={170} width={460} height={60} rx={14} fill="#765039" />
        {Array.from({ length: 15 }).map((_, i) => (
          <rect key={i} x={285 + (i % 5) * 86} y={250 + Math.floor(i / 5) * 96} width={70} height={80} rx={6} fill="none" stroke="#e6d3b8" strokeWidth={3} />
        ))}
        <Pessoa x={960} y={540} {...ADVOGADO} expressao={sorri ? "feliz" : "triste"} bracoE={sorri ? 20 : 12} bracoD={-20} />
        <rect x={660} y={640} width={600} height={40} rx={8} fill="#3b281c" />
        <rect x={690} y={680} width={540} height={200} fill="#5c3e2b" />
        <rect x={1120 + vibra} y={608} width={80} height={36} rx={8} fill="#1e1913" />
      </Palco>
      {f >= 204 && f < 260 && (
        <div style={{ position: "absolute", left: 1150, top: 380, width: 520, padding: "22px 26px", borderRadius: 24, background: COR.cremeClaro, boxShadow: "0 20px 50px rgba(30,20,12,0.3)", fontFamily: SANS, scale: `${aviso}` }}>
          <div style={{ fontWeight: 700, fontSize: 28, color: COR.texto }}>Nocturis</div>
          <div style={{ fontSize: 26, color: COR.textoSuave }}>Novo pedido de contato: trabalhista</div>
        </div>
      )}
      {f >= 260 && f < 420 && (
        <Sequence from={260} layout="none">
          <AbsoluteFill style={{ background: "rgba(30,20,12,0.55)" }}>
            <MolduraCelular>
              <TelaPedido />
            </MolduraCelular>
            <Toque x={960} y={440} quando={120} />
          </AbsoluteFill>
        </Sequence>
      )}
      <Plaquinha cena="CENA 4 · O ADVOGADO" planos={[[0, "plano aberto, empurrando devagar"], [260, "gravação de tela: ele aceita o pedido"], [420, "close no rosto: o sorriso"]]} />
    </AbsoluteFill>
  );
}

/* ---------------- Cena 5: o encontro ---------------- */
function Detalhe({ tipo }) {
  const f = useCurrentFrame();
  const t = interpolate(f, [8, 40], [0, 1], { ...C, easing: SUAVE });
  return (
    <svg width={1920} height={1080} viewBox="0 0 1920 1080">
      <rect width={1920} height={1080} fill={tipo === "assina" || tipo === "fecha" ? "#e6d3b8" : "#dccbb0"} />
      <rect x={560} y={240} width={800} height={640} rx={10} fill="#fffdf8" />
      {[0, 1, 2, 3, 4].map((k) => (
        <rect key={k} x={640} y={330 + k * 60} width={640 - (k % 2) * 140} height={14} rx={7} fill="#e6d3b8" />
      ))}
      {tipo === "assina" && (
        <>
          <path d={`M 700 760 q 40 -60 80 0 t 80 0 t 80 0`} stroke="#3b281c" strokeWidth={6} fill="none" strokeDasharray={400} strokeDashoffset={400 * (1 - t)} />
          <rect x={700 + 240 * t} y={640} width={26} height={160} rx={10} fill="#765039" transform={`rotate(30 ${713 + 240 * t} 800)`} />
        </>
      )}
      {tipo === "carimba" && (
        <>
          <rect x={1020} y={interpolate(f, [8, 22, 34], [380, 660, 380], C)} width={180} height={140} rx={16} fill="#5c3e2b" />
          {f > 22 && <circle cx={1110} cy={790} r={70} fill="none" stroke="#765039" strokeWidth={8} opacity={0.8} />}
        </>
      )}
      {(tipo === "fecha" || tipo === "abre") && (
        <rect x={560} y={240} width={800 * (tipo === "fecha" ? t : 1 - t)} height={640} rx={10} fill="#765039" />
      )}
    </svg>
  );
}

const MONTAGEM = [
  ["assina", "ele assina"],
  ["carimba", "o advogado carimba"],
  ["fecha", "ele fecha a pasta"],
  ["abre", "o advogado abre a pasta"],
];

function CenaEncontro() {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      {f < 240 ? (
        <>
          <div style={{ position: "absolute", left: 0, top: 0, width: 955, height: 1080, overflow: "hidden", background: "#e6d3b8" }}>
            <svg width={955} height={1080} viewBox="0 0 955 1080">
              <rect y={800} width={955} height={280} fill="#8a5e38" />
              <Pessoa x={480} y={500} escala={1.25} {...FUNCIONARIO} expressao="neutro" bracoE={105} celular />
            </svg>
          </div>
          <div style={{ position: "absolute", left: 965, top: 0, width: 955, height: 1080, overflow: "hidden", background: "#dccbb0" }}>
            <svg width={955} height={1080} viewBox="0 0 955 1080">
              <rect y={800} width={955} height={280} fill="#8a5e38" />
              <Pessoa x={480} y={500} escala={1.25} {...ADVOGADO} expressao="feliz" bracoE={105} celular />
            </svg>
          </div>
          <Balao x={1180} y={90} texto="Me conta direitinho o que aconteceu." aparece={20} some={120} largura={560} />
          <Balao x={200} y={90} texto="Trabalhei três anos lá e no fim..." aparece={130} some={230} largura={560} />
        </>
      ) : (
        MONTAGEM.map(([tipo], i) => (
          <Sequence key={tipo} from={240 + i * 85} durationInFrames={i === MONTAGEM.length - 1 ? 510 - i * 85 : 85} layout="none">
            <AbsoluteFill>
              <Detalhe tipo={tipo} />
            </AbsoluteFill>
          </Sequence>
        ))
      )}
      {f >= 580 && (
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
          <div style={{ fontFamily: SERIF, fontSize: 70, color: COR.texto, background: "rgba(255,253,248,0.92)", padding: "30px 50px", borderRadius: 24, opacity: interpolate(f, [580, 600], [0, 1], C) }}>
            Ele foi orientado e entendeu os direitos dele.
          </div>
        </AbsoluteFill>
      )}
      <Plaquinha
        cena="CENA 5 · O ENCONTRO"
        planos={[[0, "tela dividida: ligação pelo WhatsApp"], ...MONTAGEM.map(([, nome], i) => [240 + i * 85, `detalhe com match cut: ${nome}`]), [580, "texto na tela"]]}
      />
    </AbsoluteFill>
  );
}

/* ---------------- Cena 6: final ---------------- */
function CenaFinal() {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sai = interpolate(f, [20, 180], [700, 1500], C);
  const texto = spring({ frame: f - 380, fps, config: { damping: 14 } });
  return (
    <AbsoluteFill>
      {f < 200 && (
        <svg width={1920} height={1080} viewBox="0 0 1920 1080">
          <rect width={1920} height={1080} fill="#f6eedf" />
          <circle cx={1600} cy={220} r={110} fill="#e6d3b8" />
          <rect x={0} y={820} width={1920} height={260} fill="#c89b6a" />
          <rect x={300} y={300} width={360} height={520} fill="#765039" />
          <rect x={410} y={520} width={140} height={300} fill="#3b281c" />
          <Pessoa x={sai} y={574} {...FUNCIONARIO} expressao="feliz" bracoE={Math.sin(f / 5) * 15} bracoD={-Math.sin(f / 5) * 15} />
        </svg>
      )}
      {f >= 200 && f < 330 && (
        <svg width={1920} height={1080} viewBox="0 0 1920 1080">
          <rect width={1920} height={1080} fill="#dccbb0" />
          <rect x={0} y={820} width={1920} height={260} fill="#8a5e38" />
          <rect x={260} y={170} width={460} height={380} rx={14} fill="#fffdf8" />
          <rect x={260} y={170} width={460} height={60} rx={14} fill="#765039" />
          {Array.from({ length: 15 }).map((_, i) => (
            <rect key={i} x={285 + (i % 5) * 86} y={250 + Math.floor(i / 5) * 96} width={70} height={80} rx={6} fill={f - 200 > i * 5 ? "#c89b6a" : "none"} stroke="#e6d3b8" strokeWidth={3} />
          ))}
          <Pessoa x={1100} y={540} {...ADVOGADO} expressao="feliz" bracoE={105} celular />
          <rect x={800} y={640} width={600} height={40} rx={8} fill="#3b281c" />
          <rect x={830} y={680} width={540} height={200} fill="#5c3e2b" />
        </svg>
      )}
      {f >= 330 && (
        <Sequence from={330} layout="none">
          <AbsoluteFill style={{ background: COR.marromFundo, alignItems: "center", justifyContent: "center", gap: 50 }}>
            <CorujaLogo largura={460} velocidade={1.6} />
            <div style={{ fontFamily: SERIF, fontSize: 62, color: COR.cremeClaro, opacity: texto, translate: `0 ${(1 - texto) * 30}px` }}>Encontre o advogado certo para o seu caso.</div>
            <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 36, letterSpacing: 2, color: "#e6d3b8", opacity: texto }}>nocturis.com.br</div>
          </AbsoluteFill>
        </Sequence>
      )}
      {f < 330 && <Plaquinha cena="CENA 6 · FINAL" planos={[[0, "plano aberto: ele sai de casa mais leve"], [200, "a agenda do advogado enchendo"]]} />}
    </AbsoluteFill>
  );
}

const CENAS = [
  [CenaDemissao, 450],
  [CenaCasa, 600],
  [CenaTriagem, 600],
  [CenaAdvogado, 600],
  [CenaEncontro, 750],
  [CenaFinal, 600],
];
export const DURACAO_PITCH = CENAS.reduce((t, [, d]) => t + d, 0);
const INICIO = CENAS.map((_, i) => CENAS.slice(0, i).reduce((t, [, d]) => t + d, 0));

function Som() {
  const efeitos = [
    ["sfx/impacto.wav", 262, 0.3, 60],
    ["sfx/clique.wav", INICIO[2] + 150, 0.6, 10],
    ["sfx/aviso.wav", INICIO[3] + 204, 0.8, 30],
    ["sfx/clique.wav", INICIO[3] + 380, 0.6, 10],
  ];
  const inicioMusica = INICIO[5] + 330;
  return (
    <>
      {efeitos.map(([arq, quando, vol, dur], i) => (
        <Sequence key={i} from={quando} durationInFrames={dur} layout="none">
          <Audio src={staticFile(arq)} volume={vol} />
        </Sequence>
      ))}
      <Sequence from={inicioMusica - 20} layout="none">
        <Audio src={staticFile("musica.mp3")} trimBefore={40} volume={(f) => interpolate(f, [0, 30, 230, 290], [0, 0.7, 0.7, 0], C)} />
      </Sequence>
    </>
  );
}

export function Pitch() {
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Som />
      {CENAS.map(([Comp, dur], i) => (
        <Sequence key={i} from={INICIO[i]} durationInFrames={dur}>
          <Comp />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
}
