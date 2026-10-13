// Áreas atendidas — espelha AREAS em backend/src/services/triagem.js. O escopo do TCC é
// cível + trabalhista: multas/CNH ficam em cível e benefícios do INSS em trabalhista
// (decisão do grupo, 13/10/2026). Constante aqui pra não depender da API só pra um rótulo.
export const AREAS = {
  civel: {
    label: "Cível",
    descricao: "Compras, contratos, dívidas, família, herança, seguros, golpes, multas e CNH",
  },
  trabalhista: {
    label: "Trabalhista",
    descricao: "Emprego, demissão, salário e benefícios do INSS (aposentadoria, auxílio-doença, pensão por morte)",
  },
};

export const LABEL_AREA = {
  ...Object.fromEntries(Object.entries(AREAS).map(([valor, { label }]) => [valor, label])),
  indefinido: "Não identificada",
};

// Mesmo rótulo — ficou de quando havia áreas com nome longo; mantido pra não mexer nos usos.
export const LABEL_AREA_CURTO = LABEL_AREA;

export const OPCOES_AREA = Object.entries(AREAS).map(([valor, { label }]) => ({ valor, label }));
