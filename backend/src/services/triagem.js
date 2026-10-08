import { GoogleGenAI } from "@google/genai";
import Groq from "groq-sdk";

// Triagem em duas etapas (RF005): todas as perguntas são abertas, respondidas com as
// palavras do próprio cliente. A etapa 1 é igual pra todo mundo e serve pra identificar a
// ÁREA (RF006); a etapa 2 depende da área identificada e serve pra identificar a
// ESPECIALIDADE (RF007). O texto das perguntas mora só aqui — o frontend lê de
// GET /triagem/perguntas, então revisar uma pergunta é mudar uma linha deste arquivo.
// `ajuda` vira o exemplo dentro do campo; `minimo` é o tamanho mínimo da resposta.
export const PERGUNTAS_ETAPA1 = [
  {
    id: "oque",
    pergunta: "O que aconteceu?",
    ajuda: "Conte com suas palavras, do jeito que você contaria pra um amigo.",
    minimo: 20,
    maximo: 2000,
  },
  {
    id: "envolvidos",
    pergunta: "Com quem é o problema?",
    ajuda: "Ex.: a empresa onde trabalho ou trabalhei, uma loja, um banco, meu ex-marido, um vizinho.",
    minimo: 3,
    maximo: 300,
  },
  {
    id: "quando",
    pergunta: "Quando isso aconteceu (ou começou)?",
    ajuda: "Ex.: mês passado, faz dois anos, ainda está acontecendo.",
    minimo: 2,
    maximo: 200,
  },
];

export const PERGUNTAS_ETAPA2 = {
  trabalhista: [
    {
      id: "vinculo",
      pergunta: "Como era (ou é) o seu trabalho lá?",
      ajuda: "Ex.: carteira assinada há 3 anos como vendedor; trabalhava sem registro; sou o dono da empresa.",
      minimo: 3,
      maximo: 500,
    },
    {
      id: "saida",
      pergunta: "Você ainda trabalha lá? Se saiu, como foi a saída?",
      ajuda: "Ex.: fui mandado embora sem justa causa; pedi demissão; ainda trabalho lá.",
      minimo: 3,
      maximo: 500,
    },
    {
      id: "direitos",
      pergunta: "O que você acha que não foi pago ou não foi respeitado?",
      ajuda: "Ex.: rescisão, FGTS, horas extras, férias, fui humilhado pelo chefe, sofri um acidente.",
      minimo: 3,
      maximo: 1000,
    },
  ],
  civel: [
    {
      id: "assunto",
      pergunta: "Sobre o que é o problema?",
      ajuda: "Ex.: uma compra, uma dívida, aluguel, pensão, divórcio, herança, plano de saúde, acidente de carro.",
      minimo: 3,
      maximo: 500,
    },
    {
      id: "documentos",
      pergunta: "Existe contrato, nota fiscal, boleto ou outro documento envolvido? Qual?",
      ajuda: "Ex.: tenho o contrato de aluguel; tenho a nota fiscal; não tenho nada por escrito.",
      minimo: 2,
      maximo: 500,
    },
    {
      id: "objetivo",
      pergunta: "O que você gostaria que fosse resolvido?",
      ajuda: "Ex.: receber meu dinheiro de volta, regularizar a pensão, dividir os bens.",
      minimo: 3,
      maximo: 500,
    },
  ],
};

// Junta perguntas e respostas num texto só ("Pergunta: resposta"), que é o que vai pra IA
// e o que fica salvo em `descricao` (o advogado lê isso quando o cliente autoriza).
export function montarDescricao(perguntas, respostas = {}) {
  return perguntas
    .filter((p) => (respostas[p.id] || "").trim())
    .map((p) => `${p.pergunta} ${respostas[p.id].trim()}`)
    .join("\n");
}

// Taxonomia fixa de subcategorias por área (não é texto livre — mantém o
// vocabulário controlado pra dar pra usar em matching mais pra frente). O cliente
// vê essas categorias no resultado e pode adicionar/remover dentro dessa lista.
export const CATEGORIAS_POR_AREA = {
  civel: [
    { valor: "familia_divorcio", label: "Divórcio e separação" },
    { valor: "familia_pensao", label: "Pensão alimentícia" },
    { valor: "familia_guarda", label: "Guarda e visitas de filhos" },
    { valor: "familia_uniao_estavel", label: "União estável" },
    { valor: "heranca_inventario", label: "Inventário e partilha de bens" },
    { valor: "heranca_testamento", label: "Testamento e sucessão" },
    { valor: "dividas_cobranca", label: "Cobrança indevida e nome negativado" },
    { valor: "emprestimo_financiamento", label: "Empréstimo e financiamento" },
    { valor: "aluguel_imoveis", label: "Aluguel, despejo e locação" },
    { valor: "consumo_produto_servico", label: "Produto com defeito ou serviço mal feito" },
    { valor: "plano_saude", label: "Plano de saúde (negativa de cobertura)" },
    { valor: "banco_cartao", label: "Banco, cartão de crédito e tarifas abusivas" },
    { valor: "vizinhanca_condominio", label: "Vizinhança e condomínio" },
    { valor: "indenizacao_dano_moral", label: "Indenização por dano moral" },
    { valor: "acidente_transito", label: "Acidente de trânsito" },
    { valor: "erro_medico", label: "Erro médico e direito à saúde" },
    { valor: "outro_civel", label: "Outro assunto cível" },
  ],
  trabalhista: [
    { valor: "demissao_sem_justa_causa", label: "Demissão sem justa causa" },
    { valor: "demissao_justa_causa", label: "Justa causa contestada" },
    { valor: "pedido_demissao", label: "Pedido de demissão e verbas" },
    { valor: "rescisao_indireta", label: "Rescisão indireta (falta grave do empregador)" },
    { valor: "verbas_rescisorias", label: "Verbas rescisórias não pagas" },
    { valor: "fgts_multa", label: "FGTS e multa de 40%" },
    { valor: "ferias_decimo_terceiro", label: "Férias e décimo terceiro não pagos" },
    { valor: "horas_extras", label: "Horas extras não pagas" },
    { valor: "equiparacao_salarial", label: "Equiparação salarial e desvio de função" },
    { valor: "assedio_moral", label: "Assédio moral" },
    { valor: "assedio_sexual", label: "Assédio sexual" },
    { valor: "acidente_trabalho", label: "Acidente de trabalho e doença ocupacional" },
    { valor: "sem_carteira", label: "Trabalho sem carteira assinada" },
    { valor: "jornada_intervalo", label: "Jornada excessiva e intervalo não respeitado" },
    { valor: "estabilidade_gestante", label: "Estabilidade gestante ou acidentária" },
    { valor: "outro_trabalhista", label: "Outro direito trabalhista" },
  ],
};

const PALAVRAS_TRABALHISTA = [
  "demiss", "demit", "salario", "salário", "trabalh", "emprego", "carteira assinada",
  "hora extra", "rescis", "patrao", "patrão", "clt", "fgts", "ferias", "férias",
  "mandado embora", "mandada embora", "assedio moral", "assédio moral", "assedio sexual",
  "assédio sexual", "acidente de trabalho", "doenca ocupacional", "doença ocupacional",
  "equiparacao salarial", "equiparação salarial", "gestante", "estabilidade", "intervalo",
  "jornada", "terceirizado", "vinculo empregaticio", "vínculo empregatício",
  // Achados rodando scripts/avaliar-triagem.js com casos reais: quem descreve assédio
  // moral raramente usa esse termo técnico, descreve o que o chefe faz — mesmo ajuste já
  // existia em PALAVRAS_POR_CATEGORIA.assedio_moral, mas faltava aqui na lista que decide
  // a ÁREA (sem entrar aqui, nem chega a testar a categoria).
  "chefe", "humilha", "humilhação", "humilhacao", "constrangimento",
];

const PALAVRAS_CIVEL = [
  "contrato", "divida", "dívida", "compr", "consumidor", "heranca", "herança",
  "divorcio", "divórcio", "pensao", "pensão", "familia", "família", "aluguel",
  "vizinho", "indeniza", "defeito", "emprestimo", "empréstimo", "juros",
  "plano de saude", "plano de saúde", "cartao de credito", "cartão de crédito",
  "condominio", "condomínio", "acidente de transito", "acidente de trânsito",
  "bati o carro", "capotei", "erro medico", "erro médico", "testamento",
  "uniao estavel", "união estável",
];

// Palavras-chave por subcategoria — usadas pra detectar categorias dentro da área já
// classificada (RF008: mostrar pro cliente o que foi identificado no caso dele).
const PALAVRAS_POR_CATEGORIA = {
  familia_divorcio: ["divorcio", "divórcio", "separacao", "separação", "fim do casamento", "termino do casamento", "término do casamento"],
  familia_pensao: ["pensao aliment", "pensão aliment", "pensao", "pensão"],
  familia_guarda: ["guarda dos filhos", "guarda do filho", "guarda compartilhada", "visitas", "regime de convivencia", "regime de convivência"],
  familia_uniao_estavel: ["uniao estavel", "união estável", "uniao estável", "companheiro", "companheira"],
  heranca_inventario: ["inventario", "inventário", "partilha", "sucessao", "sucessão", "heranca", "herança"],
  heranca_testamento: ["testamento", "testador", "legado", "herdeiro"],
  dividas_cobranca: ["cobranca indevida", "cobrança indevida", "nome sujo", "negativado", "negativacao", "negativação", "spc", "serasa", "divida", "dívida"],
  emprestimo_financiamento: ["emprestimo", "empréstimo", "financiamento", "juros abusivo", "juros"],
  aluguel_imoveis: ["aluguel", "despejo", "locacao", "locação", "fiador", "imovel", "imóvel"],
  consumo_produto_servico: ["compr", "defeito", "consumidor", "garantia", "produto", "servico mal", "serviço mal", "troca do produto"],
  plano_saude: ["plano de saude", "plano de saúde", "negativa de cobertura", "convenio medico", "convênio médico"],
  banco_cartao: ["cartao de credito", "cartão de crédito", "tarifa bancaria", "tarifa bancária", "banco", "conta corrente", "fatura"],
  vizinhanca_condominio: ["vizinho", "muro", "terreno", "invasao", "invasão", "propriedade", "condominio", "condomínio", "sindico", "síndico"],
  indenizacao_dano_moral: ["indeniza", "dano moral", "dano material"],
  acidente_transito: ["acidente de transito", "acidente de trânsito", "colisao", "colisão", "atropelamento", "dpvat", "bati o carro", "batida de carro", "capotei", "capotamento"],
  erro_medico: ["erro medico", "erro médico", "negligencia medica", "negligência médica", "cirurgia", "diagnostico errado", "diagnóstico errado"],
  demissao_sem_justa_causa: ["demiss", "demit", "mandado embora", "mandada embora", "sem justa causa"],
  demissao_justa_causa: ["por justa causa", "justa causa injusta", "contestar a justa causa"],
  pedido_demissao: ["pedi demissao", "pedi demissão", "pedido de demissao", "pedido de demissão", "me demiti"],
  rescisao_indireta: ["rescisao indireta", "rescisão indireta", "falta grave do empregador", "falta grave da empresa"],
  verbas_rescisorias: ["verbas rescisorias", "verbas rescisórias", "rescisao", "rescisão", "acerto rescisorio", "acerto rescisório"],
  fgts_multa: ["fgts", "multa de 40", "multa dos 40"],
  ferias_decimo_terceiro: ["ferias", "férias", "decimo terceiro", "décimo terceiro", "13o salario", "13º salário"],
  horas_extras: ["hora extra", "horas extras", "banco de horas"],
  equiparacao_salarial: ["equiparacao salarial", "equiparação salarial", "desvio de funcao", "desvio de função", "mesma funcao", "mesma função"],
  assedio_moral: ["assedio moral", "assédio moral", "humilha", "constrangimento"],
  assedio_sexual: ["assedio sexual", "assédio sexual"],
  acidente_trabalho: ["acidente de trabalho", "doenca ocupacional", "doença ocupacional", "cat", "auxilio doenca", "auxílio doença"],
  sem_carteira: ["sem carteira", "carteira nao assinada", "carteira não assinada", "informal", "sem registro"],
  jornada_intervalo: ["jornada excessiva", "jornada", "intervalo", "sem intervalo", "sem descanso"],
  estabilidade_gestante: ["gestante", "gravida", "grávida", "estabilidade", "acidentaria", "acidentária"],
};

function contarOcorrencias(texto, palavras) {
  const alvo = texto.toLowerCase();
  return palavras.reduce((total, palavra) => (alvo.includes(palavra) ? total + 1 : total), 0);
}

// Detecta subcategorias dentro da área já classificada pelas palavras-chave da descrição.
function detectarCategorias({ area, descricao }) {
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

// Quem descreve o caso do lado do patrão costuma dizer isso com essas palavras.
const PALAVRAS_EMPREGADOR = [
  "sou empregador", "sou o dono", "sou dono", "sou a dona", "minha empresa", "meu funcionario",
  "meu funcionário", "meus funcionarios", "meus funcionários", "minha funcionaria", "minha funcionária",
];

function sugerirTipoAdvogado({ area, descricao, categorias }) {
  if (area === "trabalhista") {
    const base = contarOcorrencias(descricao, PALAVRAS_EMPREGADOR) > 0
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
// `areaFixa` vem da etapa 2: a área já foi decidida na etapa 1, aqui só falta a especialidade.
export function classificarPorRegras({ descricao = "", areaFixa } = {}) {
  let area = areaFixa || "indefinido";

  if (!areaFixa) {
    const pontosTrabalhista = contarOcorrencias(descricao, PALAVRAS_TRABALHISTA);
    const pontosCivel = contarOcorrencias(descricao, PALAVRAS_CIVEL);
    if (pontosTrabalhista > pontosCivel) area = "trabalhista";
    else if (pontosCivel > pontosTrabalhista) area = "civel";
  }

  const categorias = area === "indefinido" ? [] : detectarCategorias({ area, descricao });

  return {
    areaClassificada: area,
    categorias,
    tipoAdvogadoSugerido: sugerirTipoAdvogado({ area, descricao, categorias }),
    origem: "regras",
  };
}

const MODELO_GEMINI = process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";
const MODELO_GROQ = process.env.GROQ_MODEL || "openai/gpt-oss-120b";
const TIMEOUT_MS = 5000;
const TIMEOUT_MS_GROQ = 4000;
const CONFIANCA_MINIMA = 0.5;
export const TODAS_CATEGORIAS = Object.values(CATEGORIAS_POR_AREA).flatMap((lista) => lista.map((c) => c.valor));
// Áreas de atuação que um advogado pode escolher — não inclui "indefinido", que é só
// resultado possível da classificação da triagem, nunca uma opção de cadastro.
export const AREAS_VALIDAS = Object.keys(CATEGORIAS_POR_AREA);

let clienteGeminiInstance = null;
function clienteGemini() {
  if (!process.env.GEMINI_API_KEY) return null;
  if (!clienteGeminiInstance) clienteGeminiInstance = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  return clienteGeminiInstance;
}

let clienteGroqInstance = null;
function clienteGroq() {
  if (!process.env.GROQ_API_KEY) return null;
  if (!clienteGroqInstance) clienteGroqInstance = new Groq({ apiKey: process.env.GROQ_API_KEY });
  return clienteGroqInstance;
}

// Prompt compartilhado pelas duas IAs (Gemini é a principal, Groq é o fallback antes das
// regras — ver RNF003 e o histórico de cota do Gemini no CLAUDE.md). Cada provedor pede o
// JSON de um jeito diferente (responseSchema vs. JSON mode), mas a instrução é a mesma.
function construirPromptTriagem({ descricao, areaFixa }) {
  const instrucaoArea = areaFixa
    ? [
        `A área do caso já foi identificada na primeira etapa: area = "${areaFixa}". Não mude a área.`,
        "Agora identifique a especialidade: escolha 'categorias' só entre estas opções, da mais pra menos aplicável:",
        `Categorias (${areaFixa}): ${CATEGORIAS_POR_AREA[areaFixa].map((c) => c.valor).join(", ")}`,
      ]
    : [
        'Se o caso não for cível nem trabalhista, ou faltar informação, use area = "indefinido" e categorias = [].',
        "Escolha 'categorias' só entre estas opções, e só as que realmente se aplicam ao caso:",
        `Categorias cíveis: ${CATEGORIAS_POR_AREA.civel.map((c) => c.valor).join(", ")}`,
        `Categorias trabalhistas: ${CATEGORIAS_POR_AREA.trabalhista.map((c) => c.valor).join(", ")}`,
      ];
  return [
    "Você é um triador jurídico de uma plataforma que só atende as áreas cível e trabalhista.",
    "A IA orienta, não decide sozinha — responda SOMENTE com o JSON pedido, sem texto fora dele.",
    ...instrucaoArea,
    `Respostas do cliente:\n${descricao}`,
  ].join("\n");
}

function interpretarRespostaIA(dados, areaFixa) {
  if (!["civel", "trabalhista", "indefinido"].includes(dados.area)) {
    throw new Error("Resposta da IA fora do formato esperado");
  }

  const area = areaFixa || dados.area;
  const categoriasValidas = (CATEGORIAS_POR_AREA[area] || []).map((c) => c.valor);
  const outro = area === "civel" ? "outro_civel" : "outro_trabalhista";
  let categorias = (dados.categorias || []).filter((c) => categoriasValidas.includes(c));
  // A IA às vezes manda "outro" junto com a especialidade certa (visto rodando
  // scripts/avaliar-triagem.js em 08/10) — "outro" só fica quando não sobra nada específico.
  if (categorias.some((c) => c !== outro)) categorias = categorias.filter((c) => c !== outro);
  // Área conhecida sempre sai com pelo menos uma especialidade (mesma regra do fallback).
  if (area !== "indefinido" && categorias.length === 0) categorias = [outro];

  return {
    areaClassificada: area,
    categorias,
    tipoAdvogadoSugerido: dados.tipoAdvogadoSugerido,
    confianca: dados.confianca,
    justificativa: dados.justificativa,
  };
}

async function classificarPorIA({ descricao, areaFixa }) {
  const ai = clienteGemini();
  if (!ai) throw new Error("GEMINI_API_KEY não configurada");

  const resposta = await ai.models.generateContent({
    model: MODELO_GEMINI,
    contents: construirPromptTriagem({ descricao, areaFixa }),
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
  return { ...interpretarRespostaIA(dados, areaFixa), origem: "ia", provedor: "gemini" };
}

// Segunda opinião antes de cair pro fallback por regras — só é chamada quando o Gemini
// falha, estoura o tempo ou vem com baixa confiança. Free tier do Groq (openai/gpt-oss-120b,
// ~1.000 req/dia) é uma margem bem maior do que a cota que o Gemini vinha entregando.
async function classificarPorGroq({ descricao, areaFixa }) {
  const groq = clienteGroq();
  if (!groq) throw new Error("GROQ_API_KEY não configurada");

  const prompt = [
    construirPromptTriagem({ descricao, areaFixa }),
    "Responda só com um JSON contendo exatamente estes campos: " +
      'area ("civel", "trabalhista" ou "indefinido"), categorias (lista de strings), ' +
      "tipoAdvogadoSugerido (string), confianca (número de 0 a 1) e justificativa (string).",
  ].join("\n");

  const resposta = await groq.chat.completions.create({
    model: MODELO_GROQ,
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
  });

  const dados = JSON.parse(resposta.choices[0].message.content);
  return { ...interpretarRespostaIA(dados, areaFixa), origem: "ia", provedor: "groq" };
}

function comTimeout(promessa, ms) {
  return Promise.race([
    promessa,
    new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), ms)),
  ]);
}

async function classificarPorGroqOuRegras({ descricao, areaFixa }) {
  try {
    const resultado = await comTimeout(classificarPorGroq({ descricao, areaFixa }), TIMEOUT_MS_GROQ);
    if (resultado.confianca < CONFIANCA_MINIMA) {
      return classificarPorRegras({ descricao, areaFixa });
    }
    return resultado;
  } catch (erro) {
    console.error("triagem: Groq falhou, usando fallback por regras —", erro.message || erro);
    return classificarPorRegras({ descricao, areaFixa });
  }
}

// Orquestra Gemini → Groq → regras: se o Gemini falhar, estourar o tempo ou vier com baixa
// confiança, tenta o Groq como segunda opinião antes de cair pro fallback por regras — a
// triagem nunca trava (RNF003). Sem `areaFixa` identifica a área (etapa 1); com ela,
// identifica a especialidade dentro dessa área (etapa 2).
export async function classificar({ descricao, areaFixa }) {
  try {
    const resultado = await comTimeout(classificarPorIA({ descricao, areaFixa }), TIMEOUT_MS);
    if (resultado.confianca < CONFIANCA_MINIMA) {
      return classificarPorGroqOuRegras({ descricao, areaFixa });
    }
    return resultado;
  } catch (erro) {
    // Antes esse erro era engolido em silêncio — rodando scripts/avaliar-triagem.js pela
    // primeira vez, isso escondeu que a IA estava estourando a cota do free tier (10
    // req/min) na maioria das chamadas. Loga o motivo real (sem derrubar a triagem, que
    // continua caindo no Groq e depois no fallback por regras normalmente — RNF003).
    console.error("triagem: Gemini falhou, tentando Groq —", erro.message || erro);
    return classificarPorGroqOuRegras({ descricao, areaFixa });
  }
}
