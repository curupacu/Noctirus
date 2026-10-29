import { loadFont as carregarIbmPlex } from "@remotion/google-fonts/IBMPlexSans";
import { loadFont as carregarBaskerville } from "@remotion/google-fonts/LibreBaskerville";

// Mesmas cores e fontes do site (frontend/src/styles/tokens.css): só marrom, bege e creme.
export const COR = {
  noite: "#1f150e",
  marrom: "#765039",
  marromFundo: "#5c3e2b",
  marromTinta: "#3b281c",
  bege: "#efe2d0",
  bordaBege: "#e4d6c2",
  creme: "#f6eedf",
  cremeClaro: "#fffdf8",
  fundo: "#fcf9f4",
  texto: "#2a1f16",
  textoSuave: "#5e4e3b",
  textoFraco: "#8c7d66",
};

export const { fontFamily: SERIF } = carregarBaskerville("normal", { weights: ["400"], subsets: ["latin", "latin-ext"] });
export const { fontFamily: SANS } = carregarIbmPlex("normal", { weights: ["400", "600", "700"], subsets: ["latin", "latin-ext"] });
