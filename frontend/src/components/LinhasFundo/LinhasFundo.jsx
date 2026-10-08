import "./LinhasFundo.css";

// As linhas curvas quase invisíveis do fundo do hero e da seção "Sobre" da Home e do
// painel das telas de entrada — detalhe do protótipo do Figma. SVG esticado na faixa
// inteira, traço em creme com opacidade baixa.
export function LinhasFundo() {
  return (
    <svg
      className="linhas-fundo"
      viewBox="0 0 1440 800"
      preserveAspectRatio="none"
      fill="none"
      aria-hidden="true"
    >
      <path d="M-40 640C220 560 380 700 620 600S1000 360 1480 420" />
      <path d="M-40 700C240 620 420 760 660 650S1040 430 1480 500" />
      <path d="M-40 760C260 690 460 820 700 710S1080 500 1480 580" />
      <path d="M-40 180C300 260 520 80 820 150S1240 300 1480 210" />
      <path d="M-40 240C320 320 540 140 840 210S1260 360 1480 280" />
    </svg>
  );
}
