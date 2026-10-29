import { interpolate, useCurrentFrame } from "remotion";

// Bonequinho simples (cabeça, corpo, braços e pernas em formas chapadas) pro animatic do
// pitch. É só referência de enquadramento e ritmo pro grupo filmar depois com gente de verdade.
//
// expressao: neutro | feliz | triste | choque | cansado
// bracoE / bracoD: ângulo do braço em graus (0 = pra baixo, 90 = pra frente/lado)

const BOCAS = {
  neutro: "M -11 0 L 11 0",
  feliz: "M -14 -3 Q 0 13 14 -3",
  triste: "M -12 7 Q 0 -5 12 7",
  cansado: "M -10 3 Q 0 0 10 3",
};

function Rosto({ expressao, piscando }) {
  const sobrancelha = {
    neutro: [0, 0],
    feliz: [0, -2],
    triste: [-14, 4],
    choque: [0, -10],
    cansado: [-6, 3],
  }[expressao] || [0, 0];
  const olhoY = expressao === "cansado" ? 0.45 : 1;
  return (
    <g>
      {[-17, 17].map((dx, i) => (
        <g key={i}>
          <ellipse cx={dx} cy={-4} rx={5} ry={7 * olhoY * (piscando ? 0.12 : 1)} fill="#2a1f16" />
          <line
            x1={dx - 8}
            x2={dx + 8}
            y1={-18 + sobrancelha[1] + (i === 0 ? -sobrancelha[0] / 4 : sobrancelha[0] / 4) * 0}
            y2={-18 + sobrancelha[1]}
            stroke="#2a1f16"
            strokeWidth={4}
            strokeLinecap="round"
            transform={`rotate(${i === 0 ? sobrancelha[0] : -sobrancelha[0]} ${dx} ${-18 + sobrancelha[1]})`}
          />
        </g>
      ))}
      {expressao === "choque" ? (
        <ellipse cx={0} cy={24} rx={8} ry={11} fill="#2a1f16" />
      ) : (
        <path d={BOCAS[expressao] || BOCAS.neutro} transform="translate(0 24)" stroke="#2a1f16" strokeWidth={4} fill="none" strokeLinecap="round" />
      )}
    </g>
  );
}

function Cabelo({ tipo, cor }) {
  if (tipo === "careca") return <path d="M -46 -20 Q -48 -52 -20 -58" stroke={cor} strokeWidth={6} fill="none" opacity={0.5} />;
  if (tipo === "longo")
    return (
      <g fill={cor}>
        <path d="M -52 -10 Q -56 -66 0 -68 Q 56 -66 52 -10 L 54 60 Q 40 66 34 40 L 36 -20 Q 0 -40 -36 -20 L -34 40 Q -40 66 -54 60 Z" />
      </g>
    );
  return <path d="M -50 -12 Q -52 -66 0 -66 Q 52 -66 50 -12 Q 34 -40 0 -42 Q -30 -42 -50 -12 Z" fill={cor} />;
}

export function Pessoa({
  x = 0,
  y = 0,
  escala = 1,
  pele = "#c58c63",
  cabelo = "#2a1f16",
  tipoCabelo = "curto",
  camisa = "#c89b6a",
  calca = "#3b281c",
  paleto = null,
  gravata = null,
  oculos = false,
  expressao = "neutro",
  bracoE = 8,
  bracoD = -8,
  sentado = false,
  celular = false,
  espelhar = false,
  respira = true,
}) {
  const f = useCurrentFrame();
  const piscando = f % 110 > 104;
  const sobe = respira ? Math.sin(f / 18) * 2 : 0;
  const corpo = paleto || camisa;

  return (
    <g transform={`translate(${x} ${y}) scale(${espelhar ? -escala : escala} ${escala})`}>
      {/* pernas */}
      {sentado ? (
        <g fill={calca}>
          <rect x={-40} y={100} width={110} height={36} rx={18} />
          <rect x={-10} y={100} width={110} height={36} rx={18} opacity={0.85} />
          <rect x={70} y={110} width={30} height={100} rx={15} />
          <rect x={40} y={110} width={30} height={100} rx={15} opacity={0.85} />
        </g>
      ) : (
        <g fill={calca}>
          <rect x={-34} y={110} width={30} height={130} rx={15} />
          <rect x={4} y={110} width={30} height={130} rx={15} />
          <rect x={-40} y={232} width={40} height={14} rx={7} fill="#1e1913" />
          <rect x={4} y={232} width={40} height={14} rx={7} fill="#1e1913" />
        </g>
      )}

      <g transform={`translate(0 ${sobe})`}>
        {/* braço de trás */}
        <g transform={`rotate(${bracoD} 34 -2)`}>
          <rect x={22} y={-8} width={26} height={110} rx={13} fill={corpo} />
          <circle cx={35} cy={104} r={14} fill={pele} />
        </g>
        {/* tronco */}
        <rect x={-46} y={-14} width={92} height={136} rx={30} fill={corpo} />
        {paleto && <path d="M -12 -12 L 0 40 L 12 -12 Z" fill={camisa} />}
        {gravata && <path d="M -6 -6 L 6 -6 L 9 44 L 0 54 L -9 44 Z" fill={gravata} />}
        {/* pescoço e cabeça */}
        <rect x={-12} y={-30} width={24} height={22} fill={pele} />
        <g transform="translate(0 -84)">
          <circle r={52} fill={pele} />
          <Cabelo tipo={tipoCabelo} cor={cabelo} />
          <Rosto expressao={expressao} piscando={piscando} />
          {oculos && (
            <g stroke="#2a1f16" strokeWidth={3.5} fill="none">
              <circle cx={-17} cy={-4} r={13} />
              <circle cx={17} cy={-4} r={13} />
              <line x1={-4} x2={4} y1={-4} y2={-4} />
            </g>
          )}
        </g>
        {/* braço da frente */}
        <g transform={`rotate(${bracoE} -34 -2)`}>
          <rect x={-48} y={-8} width={26} height={110} rx={13} fill={corpo} />
          <circle cx={-35} cy={104} r={14} fill={pele} />
          {celular && <rect x={-50} y={84} width={30} height={50} rx={6} fill="#1e1913" />}
        </g>
      </g>
    </g>
  );
}

// Balão de fala.
export function Balao({ x, y, texto, aparece, some = 100000, largura = 520, lado = "esquerda" }) {
  const f = useCurrentFrame();
  const s = interpolate(f, [aparece, aparece + 6, some, some + 5], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  if (s <= 0) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: largura,
        padding: "22px 28px",
        borderRadius: 26,
        background: "#fffdf8",
        boxShadow: "0 10px 30px rgba(30, 20, 12, 0.18)",
        fontFamily: "IBM Plex Sans, sans-serif",
        fontSize: 34,
        lineHeight: 1.35,
        color: "#2a1f16",
        scale: `${0.85 + s * 0.15}`,
        opacity: s,
        transformOrigin: lado === "esquerda" ? "10% 100%" : "90% 100%",
      }}
    >
      {texto}
      <div
        style={{
          position: "absolute",
          bottom: -18,
          [lado === "esquerda" ? "left" : "right"]: 50,
          width: 0,
          height: 0,
          borderLeft: "16px solid transparent",
          borderRight: "16px solid transparent",
          borderTop: "20px solid #fffdf8",
        }}
      />
    </div>
  );
}
