import { GoogleGenAI } from "@google/genai";

// Primeira pergunta guiada (RF008) — sempre feita. A segunda pergunta depende da
// resposta desta (ver PERGUNTAS_SEGUNDA_ETAPA), porque "qual é o seu papel" só faz
// sentido pra caso trabalhista — pra família/herança ou consumo, o que importa é o
// assunto específico, não um "papel".
export const PERGUNTA_PRINCIPAL = {
  id: "situacao",
  pergunta: "Qual situação descreve melhor o seu problema?",
  opcoes: [
    { valor: "trabalho", label: "Emprego, demissão, salário ou algo do meu trabalho" },
    { valor: "contrato_consumo", label: "Contrato, compra, dívida ou problema com uma empresa" },
    { valor: "familia_heranca", label: "Família, herança, pensão ou divórcio" },
    { valor: "outro", label: "Nenhuma das opções acima / não sei" },
  ],
};

// Chaveado pelo valor escolhido em "situacao". "outro" não tem segunda pergunta —
// nesse caso a classificação depende só da descrição livre.
export const PERGUNTAS_SEGUNDA_ETAPA = {
  trabalho: {
    id: "papel",
    pergunta: "Qual é o seu papel nessa situação?",
    opcoes: [
      { valor: "empregado", label: "Sou (ou fui) empregado" },
      { valor: "empregador", label: "Sou empregador" },
    ],
  },
  familia_heranca: {
    id: "tipo_familia",
    pergunta: "Qual é o assunto principal?",
    opcoes: [
      { valor: "divorcio", label: "Divórcio ou separação" },
      { valor: "pensao", label: "Pensão alimentícia" },
      { valor: "guarda", label: "Guarda de filhos" },
      { valor: "heranca", label: "Herança ou partilha de bens" },
      { valor: "outro", label: "Outro assunto de família" },
    ],
  },
  contrato_consumo: {
    id: "tipo_consumo",
    pergunta: "Qual é o assunto principal?",
    opcoes: [
      { valor: "compra_defeituosa", label: "Compra com defeito ou serviço mal feito" },
      { valor: "cobranca_indevida", label: "Cobrança indevida ou dívida" },
      { valor: "emprestimo", label: "Empréstimo ou financiamento" },
      { valor: "aluguel", label: "Aluguel ou imóvel" },
      { valor: "outro", label: "Outro assunto de contrato/consumo" },
    ],
  },
};

// Taxonomia fixa de subcategorias por área (não é texto livre — mantém o
// vocabulário controlado pra dar pra usar em matching mais pra frente). O cliente
// vê essas categorias no resultado e pode adicionar/remover dentro dessa lista.
export const CATEGORIAS_POR_AREA = {
  civel: [
    { valor: "familia", label: "Família (divórcio, guarda, pensão)" },
    { valor: "heranca", label: "Herança e sucessões" },
    { valor: "contratos_dividas", label: "Contratos, dívidas e empréstimos" },
    { valor: "consumo", label: "Relações de consumo (compra, defeito, cobrança)" },
    { valor: "vizinhanca_propriedade", label: "Vizinhança e propriedade" },
    { valor: "indenizacao", label: "Indenização por danos" },
    { valor: "outro_civel", label: "Outro assunto cível" },
  ],
  trabalhista: [
    { valor: "demissao_rescisao", label: "Demissão / rescisão" },
    { valor: "verbas_nao_pagas", label: "Verbas não pagas (FGTS, férias, 13º, hora extra)" },
    { valor: "assedio", label: "Assédio moral ou sexual" },
    { valor: "sem_carteira", label: "Trabalho sem carteira assinada" },
    { valor: "outro_trabalhista", label: "Outro direito trabalhista" },
  ],
};

const PALAVRAS_TRABALHISTA = [
  "demiss", "demit", "salario", "salário", "trabalh", "emprego", "carteira assinada",
  "hora extra", "rescis", "patrao", "patrão", "clt", "fgts", "ferias", "férias",
  "mandado embora", "mandada embora", "assedio moral", "assédio moral",
];

const PALAVRAS_CIVEL = [
  "contrato", "divida", "dívida", "compr", "consumidor", "heranca", "herança",
  "divorcio", "divórcio", "pensao", "pensão", "familia", "família", "aluguel",
  "vizinho", "indeniza", "defeito", "emprestimo", "empréstimo", "juros",
];

// Palavras-chave por subcategoria — usadas pra detectar categorias dentro da área já
// classificada (RF008: mostrar pro cliente o que foi identificado no caso dele).
const PALAVRAS_POR_CATEGORIA = {
  familia: ["divorcio", "divórcio", "pensao aliment", "pensão aliment", "pensao", "pensão", "guarda dos filhos", "guarda do filho", "separacao", "separação", "casamento"],
  heranca: ["heranca", "herança", "partilha", "sucessao", "sucessão", "inventario", "inventário"],
  contratos_dividas: ["contrato", "divida", "dívida", "emprestimo", "empréstimo", "juros", "financiamento", "aluguel", "despejo"],
  consumo: ["compr", "defeito", "consumidor", "garantia", "cobranca indevida", "cobrança indevida", "produto", "servico mal", "serviço mal"],
  vizinhanca_propriedade: ["vizinho", "muro", "terreno", "invasao", "invasão", "propriedade"],
  indenizacao: ["indeniza", "dano moral", "dano material", "acidente"],
  demissao_rescisao: ["demiss", "demit", "rescis", "mandado embora", "mandada embora", "justa causa"],
  verbas_nao_pagas: ["fgts", "ferias", "férias", "decimo terceiro", "décimo terceiro", "hora extra", "salario atrasado", "salário atrasado", "verbas"],
  assedio: ["assedio", "assédio"],
  sem_carteira: ["sem carteira", "carteira nao assinada", "carteira não assinada", "informal", "sem registro"],
};

// Segunda etapa mapeia direto pra uma categoria, quando o valor escolhido já diz o
// assunto (ex.: "pensão" → categoria "familia"). "outro" não mapeia — nesse caso só a
// descrição decide.
const CATEGORIA_DA_SEGUNDA_ETAPA = {
  divorcio: "familia",
  pensao: "familia",
  guarda: "familia",
  heranca: "heranca",
  compra_defeituosa: "consumo",
  cobranca_indevida: "contratos_dividas",
  emprestimo: "contratos_dividas",
  aluguel: "contratos_dividas",
};

function contarOcorrencias(texto, palavras) {
  const alvo = texto.toLowerCase();
  return palavras.reduce((total, palavra) => (alvo.includes(palavra) ? total + 1 : total), 0);
}

// Detecta subcategorias dentro da área já classificada, cruzando palavras-chave da
// descrição com a resposta da segunda etapa (quando ela já aponta uma categoria).
function detectarCategorias({ area, respostas, descricao }) {
  const categoriasDaArea = CATEGORIAS_POR_AREA[area];
  if (!categoriasDaArea) return [];

  const alvo = descricao.toLowerCase();
  const encontradas = new Set();

  for (const { valor } of categoriasDaArea) {
    const palavras = PALAVRAS_POR_CATEGORIA[valor] || [];
    if (palavras.some((palavra) => alvo.includes(palavra))) {
      encontradas.add(valor);
    }
  }

  const respostaSegundaEtapa = respostas.tipo_familia || respostas.tipo_consumo;
  const categoriaDireta = CATEGORIA_DA_SEGUNDA_ETAPA[respostaSegundaEtapa];
  if (categoriaDireta && categoriasDaArea.some((c) => c.valor === categoriaDireta)) {
    encontradas.add(categoriaDireta);
  }

  if (encontradas.size === 0) {
    encontradas.add(area === "civel" ? "outro_civel" : "outro_trabalhista");
  }

  return [...encontradas];
}

const LABEL_CATEGORIA = Object.fromEntries(
  Object.values(CATEGORIAS_POR_AREA)
    .flat()
    .map(({ valor, label }) => [valor, label]),
);

function sugerirTipoAdvogado({ area, respostas, categorias }) {
  if (area === "trabalhista") {
    const base = respostas.papel === "empregador"
      ? "Advogado trabalhista para empregador"
      : "Advogado trabalhista para direitos do trabalhador";
    const principal = categorias.find((c) => c !== "outro_trabalhista");
    return principal ? `${base} — ${LABEL_CATEGORIA[principal]}` : base;
  }
  if (area === "civel") {
    const principal = categorias.find((c) => c !== "outro_civel");
    return principal ? `Advogado cível — ${LABEL_CATEGORIA[principal]}` : "Advogado cível";
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

  const categorias = area === "indefinido" ? [] : detectarCategorias({ area, respostas, descricao });

  return {
    areaClassificada: area,
    categorias,
    tipoAdvogadoSugerido: sugerirTipoAdvogado({ area, respostas, categorias }),
    origem: "regras",
  };
}

const MODELO_GEMINI = process.env.GEMINI_MODEL || "gemini-2.5-flash-lite";
const TIMEOUT_MS = 5000;
const CONFIANCA_MINIMA = 0.5;
export const TODAS_CATEGORIAS = Object.values(CATEGORIAS_POR_AREA).flatMap((lista) => lista.map((c) => c.valor));

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
    'Se o caso não for cível nem trabalhista, ou faltar informação, use area = "indefinido" e categorias = [].',
    "Escolha 'categorias' só entre estas opções, e só as que realmente se aplicam ao caso:",
    `Categorias cíveis: ${CATEGORIAS_POR_AREA.civel.map((c) => c.valor).join(", ")}`,
    `Categorias trabalhistas: ${CATEGORIAS_POR_AREA.trabalhista.map((c) => c.valor).join(", ")}`,
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
          categorias: { type: "array", items: { type: "string", enum: TODAS_CATEGORIAS } },
          tipoAdvogadoSugerido: { type: "string" },
          confianca: { type: "number" },
          justificativa: { type: "string" },
        },
        required: ["area", "categorias", "tipoAdvogadoSugerido", "confianca", "justificativa"],
      },
    },
  });

  const dados = JSON.parse(resposta.text);
  if (!["civel", "trabalhista", "indefinido"].includes(dados.area)) {
    throw new Error("Resposta da IA fora do formato esperado");
  }

  const categoriasValidas = (CATEGORIAS_POR_AREA[dados.area] || []).map((c) => c.valor);
  const categorias = (dados.categorias || []).filter((c) => categoriasValidas.includes(c));

  return {
    areaClassificada: dados.area,
    categorias,
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
