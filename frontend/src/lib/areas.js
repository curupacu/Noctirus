// Áreas atendidas — espelha AREAS em backend/src/services/triagem.js (Previdenciário e
// Trânsito entraram em 13/10/2026). Mantido aqui como constante pra não depender de uma
// chamada à API só pra mostrar um rótulo.
export const AREAS = {
  civel: { label: "Cível", descricao: "Compras, contratos, dívidas, aluguel, família, herança, seguros, golpes" },
  trabalhista: { label: "Trabalhista", descricao: "Emprego, demissão, salário, direitos de quem trabalha ou contrata" },
  previdenciario: { label: "Previdenciário (INSS)", descricao: "Aposentadoria, auxílio-doença, BPC/LOAS, pensão por morte" },
  transito: { label: "Trânsito", descricao: "Multas, CNH suspensa ou cassada, Lei Seca, veículo apreendido" },
};

export const LABEL_AREA = {
  ...Object.fromEntries(Object.entries(AREAS).map(([valor, { label }]) => [valor, label])),
  indefinido: "Não identificada",
};

// Rótulo curto (sem o "(INSS)"), pra frases e listas apertadas.
export const LABEL_AREA_CURTO = { ...LABEL_AREA, previdenciario: "Previdenciário" };

export const OPCOES_AREA = Object.entries(AREAS).map(([valor, { label }]) => ({ valor, label }));
