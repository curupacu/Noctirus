import { GoogleGenAI } from "@google/genai";

// Árvore de perguntas guiadas (RF008) — versão inicial, a afinar com casos reais no
// Sprint 6. As respostas usam esses mesmos "valor" tanto no front quanto no fallback
// por regras abaixo.
export const PERGUNTAS_GUIADAS = [
  {
    id: "situacao",
    pergunta: "Qual situação descreve melhor o seu problema?",
    opcoes: [
      { valor: "trabalho", label: "Emprego, demissão, salário ou algo do meu trabalho" },
      { valor: "contrato_consumo", label: "Contrato, compra, dívida ou problema com uma empresa" },
      { valor: "familia_heranca", label: "Família, herança, pensão ou divórcio" },
      { valor: "outro", label: "Nenhuma das opções acima / não sei" },
    ],
  },
  {
    id: "papel",
    pergunta: "Qual é o seu papel nessa situação?",
    opcoes: [
      { valor: "empregado", label: "Sou (ou fui) empregado" },
      { valor: "empregador", label: "Sou empregador" },
      { valor: "consumidor", label: "Sou cliente/consumidor" },
      { valor: "outro", label: "Nenhuma das opções acima" },
    ],
  },
];

const PALAVRAS_TRABALHISTA = [
  "demiss", "salario", "salário", "trabalh", "emprego", "carteira assinada",
  "hora extra", "rescis", "patrao", "patrão", "clt", "fgts", "ferias", "férias",
];

const PALAVRAS_CIVEL = [
  "contrato", "divida", "dívida", "compra", "consumidor", "heranca", "herança",
  "divorcio", "divórcio", "pensao", "pensão", "familia", "família", "aluguel",
  "vizinho", "indeniza",
];

function contarOcorrencias(texto, palavras) {
  const alvo = texto.toLowerCase();
  return palavras.reduce((total, palavra) => (alvo.includes(palavra) ? total + 1 : total), 0);
}

function sugerirTipoAdvogado({ area, respostas }) {
  if (area === "trabalhista") {
    return respostas.papel === "empregador"
      ? "Advogado trabalhista para empregador"
      : "Advogado trabalhista para direitos do trabalhador";
  }
  if (area === "civel") {
    if (respostas.situacao === "familia_heranca") return "Advogado cível — família e sucessões";
    if (respostas.situacao === "contrato_consumo" || respostas.papel === "consumidor") {
      return "Advogado cível — contratos e relações de consumo";
    }
    return "Advogado cível";
  }
  return "Não foi possível identificar a área — recomendamos falar com um advogado generalista";
}

// Fallback usado se a IA falhar, demorar mais de 5s, ou vier com baixa confiança (RNF003).
export function classificarPorRegras({ respostas = {}, descricao = "" }) {
  let area = "indefinido";

  if (respostas.situacao === "trabalho") {
    area = "trabalhista";
  } else if (["contrato_consumo", "familia_heranca"].includes(respostas.situacao)) {
    area = "civel";
  } else {
    const pontosTrabalhista = contarOcorrencias(descricao, PALAVRAS_TRABALHISTA);
    const pontosCivel = contarOcorrencias(descricao, PALAVRAS_CIVEL);
    if (pontosTrabalhista > pontosCivel) area = "trabalhista";
    else if (pontosCivel > pontosTrabalhista) area = "civel";
  }

  return {
    areaClassificada: area,
    tipoAdvogadoSugerido: sugerirTipoAdvogado({ area, respostas }),
    origem: "regras",
  };
}

const MODELO_GEMINI = process.env.GEMINI_MODEL || "gemini-2.5-flash-lite";
const TIMEOUT_MS = 5000;
const CONFIANCA_MINIMA = 0.5;

let cliente = null;
function clienteGemini() {
  if (!process.env.GEMINI_API_KEY) return null;
  if (!cliente) cliente = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  return cliente;
}

async function classificarPorIA({ respostas, descricao }) {
  const ai = clienteGemini();
  if (!ai) throw new Error("GEMINI_API_KEY não configurada");

  const prompt = [
    "Você é um triador jurídico de uma plataforma que só atende as áreas cível e trabalhista.",
    "A IA orienta, não decide sozinha — responda SOMENTE com o JSON pedido, sem texto fora dele.",
    'Se o caso não for cível nem trabalhista, ou faltar informação, use area = "indefinido".',
    `Respostas do questionário guiado: ${JSON.stringify(respostas)}`,
    `Descrição do cliente: ${descricao}`,
  ].join("\n");

  const resposta = await ai.models.generateContent({
    model: MODELO_GEMINI,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: "object",
        properties: {
          area: { type: "string", enum: ["civel", "trabalhista", "indefinido"] },
          tipoAdvogadoSugerido: { type: "string" },
          confianca: { type: "number" },
          justificativa: { type: "string" },
        },
        required: ["area", "tipoAdvogadoSugerido", "confianca", "justificativa"],
      },
    },
  });

  const dados = JSON.parse(resposta.text);
  if (!["civel", "trabalhista", "indefinido"].includes(dados.area)) {
    throw new Error("Resposta da IA fora do formato esperado");
  }

  return {
    areaClassificada: dados.area,
    tipoAdvogadoSugerido: dados.tipoAdvogadoSugerido,
    confianca: dados.confianca,
    justificativa: dados.justificativa,
    origem: "ia",
  };
}

function comTimeout(promessa, ms) {
  return Promise.race([
    promessa,
    new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), ms)),
  ]);
}

// Orquestra IA + fallback: se a IA falhar, estourar o tempo ou vier com baixa confiança,
// cai pro resultado das regras — a triagem nunca trava (RNF003).
export async function classificar({ respostas, descricao }) {
  try {
    const resultado = await comTimeout(classificarPorIA({ respostas, descricao }), TIMEOUT_MS);
    if (resultado.confianca < CONFIANCA_MINIMA) {
      return classificarPorRegras({ respostas, descricao });
    }
    return resultado;
  } catch {
    return classificarPorRegras({ respostas, descricao });
  }
}
