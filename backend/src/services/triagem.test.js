import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const generateContentMock = vi.fn();
const groqCreateMock = vi.fn();

vi.mock("@google/genai", () => ({
  GoogleGenAI: vi.fn().mockImplementation(function () {
    return { models: { generateContent: generateContentMock } };
  }),
}));

vi.mock("groq-sdk", () => ({
  default: vi.fn().mockImplementation(function () {
    return { chat: { completions: { create: groqCreateMock } } };
  }),
}));

const {
  CATEGORIAS_POR_AREA,
  TODAS_CATEGORIAS,
  PERGUNTAS_ETAPA1,
  PERGUNTAS_ETAPA2,
  classificar,
  classificarPorRegras,
  montarDescricao,
} = await import("./triagem.js");

function respostaGemini(dados) {
  return { text: JSON.stringify(dados) };
}

function respostaGroq(dados) {
  return { choices: [{ message: { content: JSON.stringify(dados) } }] };
}

// classificarPorRegras é o fallback usado sempre que a IA falha, demora ou tem baixa
// confiança (RNF003) — é literalmente o que garante que a triagem nunca trava. Merece
// mais cobertura do que o caminho da IA, que depende de uma chave externa.
describe("classificarPorRegras", () => {
  it("identifica a área trabalhista pelas palavras-chave (etapa 1)", () => {
    const resultado = classificarPorRegras({
      descricao: "Fui demitido sem justa causa e não pagaram minhas horas extras.",
    });
    expect(resultado.areaClassificada).toBe("trabalhista");
    expect(resultado.origem).toBe("regras");
  });

  it("identifica a área cível pelas palavras-chave (etapa 1)", () => {
    const resultado = classificarPorRegras({ descricao: "Comprei um produto com defeito e a loja não quer trocar." });
    expect(resultado.areaClassificada).toBe("civel");
  });

  it("fica indefinido quando não há palavra-chave reconhecível", () => {
    const resultado = classificarPorRegras({ descricao: "preciso de ajuda com uma coisa" });
    expect(resultado.areaClassificada).toBe("indefinido");
    expect(resultado.categorias).toEqual([]);
  });

  it("com área fixa (etapa 2), respeita a área e só procura a especialidade dentro dela", () => {
    const resultado = classificarPorRegras({
      descricao: "Comprei um produto com defeito, mas o problema é com a empresa onde trabalho.",
      areaFixa: "trabalhista",
    });
    expect(resultado.areaClassificada).toBe("trabalhista");
    expect(resultado.categorias.every((c) => CATEGORIAS_POR_AREA.trabalhista.some((t) => t.valor === c))).toBe(true);
  });

  it("detecta subcategorias específicas a partir da descrição", () => {
    const resultado = classificarPorRegras({
      descricao: "Fui demitido sem justa causa e não pagaram minhas horas extras.",
      areaFixa: "trabalhista",
    });
    expect(resultado.categorias).toContain("demissao_sem_justa_causa");
    expect(resultado.categorias).toContain("horas_extras");
  });

  it("sempre tem pelo menos uma categoria quando a área é conhecida, mesmo sem palavra-chave específica", () => {
    const resultado = classificarPorRegras({ descricao: "problema no trabalho", areaFixa: "trabalhista" });
    expect(resultado.categorias).toEqual(["outro_trabalhista"]);
  });

  it("sugere advogado pra empregador quando o cliente se descreve como patrão", () => {
    const resultado = classificarPorRegras({
      descricao: "Sou o dono de uma padaria e meu funcionário entrou na justiça.",
      areaFixa: "trabalhista",
    });
    expect(resultado.tipoAdvogadoSugerido).toMatch(/empregador/i);
  });

  it("sugere advogado pro trabalhador por padrão", () => {
    const resultado = classificarPorRegras({ descricao: "não recebi minhas verbas", areaFixa: "trabalhista" });
    expect(resultado.tipoAdvogadoSugerido).toMatch(/trabalhador/i);
  });
});

describe("perguntas da triagem", () => {
  it("etapa 1 é a mesma pra todo mundo e etapa 2 existe pras duas áreas", () => {
    expect(PERGUNTAS_ETAPA1.length).toBeGreaterThan(0);
    expect(Object.keys(PERGUNTAS_ETAPA2).sort()).toEqual(["civel", "trabalhista"]);
  });

  it("toda pergunta tem id único, texto, exemplo e limites de tamanho", () => {
    const todas = [...PERGUNTAS_ETAPA1, ...PERGUNTAS_ETAPA2.civel, ...PERGUNTAS_ETAPA2.trabalhista];
    for (const p of todas) {
      expect(p.id && p.pergunta && p.ajuda).toBeTruthy();
      expect(p.minimo).toBeLessThan(p.maximo);
    }
    for (const lista of [PERGUNTAS_ETAPA1, PERGUNTAS_ETAPA2.civel, PERGUNTAS_ETAPA2.trabalhista]) {
      expect(new Set(lista.map((p) => p.id)).size).toBe(lista.length);
    }
  });

  it("montarDescricao junta pergunta + resposta e ignora as vazias", () => {
    const texto = montarDescricao(PERGUNTAS_ETAPA1, { oque: "Fui demitido", quando: "  " });
    expect(texto).toBe("O que aconteceu? Fui demitido");
  });
});

// Checagens estruturais da taxonomia — travam contra regressão se alguém editar a lista
// de categorias sem querer (ex.: duplicar um valor ou desalinhar do que o CLAUDE.md
// documenta: 33 categorias, 17 cíveis + 16 trabalhistas).
describe("taxonomia de categorias", () => {
  it("tem 17 categorias cíveis e 16 trabalhistas (33 no total)", () => {
    expect(CATEGORIAS_POR_AREA.civel).toHaveLength(17);
    expect(CATEGORIAS_POR_AREA.trabalhista).toHaveLength(16);
    expect(TODAS_CATEGORIAS).toHaveLength(33);
  });

  it("não tem valores duplicados entre as áreas", () => {
    expect(new Set(TODAS_CATEGORIAS).size).toBe(TODAS_CATEGORIAS.length);
  });

  it("toda categoria tem valor e rótulo não vazios", () => {
    for (const categoria of Object.values(CATEGORIAS_POR_AREA).flat()) {
      expect(categoria.valor).toBeTruthy();
      expect(categoria.label).toBeTruthy();
    }
  });
});

// Orquestração Gemini → Groq → regras (RNF003, ver CLAUDE.md). O Groq só é chamado quando
// o Gemini falha, estoura o tempo ou vem com baixa confiança — mocka as duas IAs pra testar
// a cadeia de fallback sem depender de rede/chave de verdade.
describe("classificar (orquestração Gemini → Groq → regras)", () => {
  beforeEach(() => {
    process.env.GEMINI_API_KEY = "fake-gemini-key";
    process.env.GROQ_API_KEY = "fake-groq-key";
    generateContentMock.mockReset();
    groqCreateMock.mockReset();
  });

  afterEach(() => {
    delete process.env.GEMINI_API_KEY;
    delete process.env.GROQ_API_KEY;
  });

  it("usa o resultado do Gemini quando ele responde com confiança alta, sem chamar o Groq", async () => {
    generateContentMock.mockResolvedValueOnce(
      respostaGemini({
        area: "trabalhista",
        categorias: ["horas_extras"],
        tipoAdvogadoSugerido: "Advogado trabalhista",
        confianca: 0.95,
        justificativa: "Menciona horas extras não pagas",
      }),
    );

    const resultado = await classificar({ descricao: "Faço muitas horas extras e nunca recebo por elas." });

    expect(resultado.origem).toBe("ia");
    expect(resultado.provedor).toBe("gemini");
    expect(resultado.areaClassificada).toBe("trabalhista");
    expect(groqCreateMock).not.toHaveBeenCalled();
  });

  it("Gemini falha (erro ou timeout) → tenta o Groq e usa a resposta dele", async () => {
    generateContentMock.mockRejectedValueOnce(new Error("erro de rede"));
    groqCreateMock.mockResolvedValueOnce(
      respostaGroq({
        area: "civel",
        categorias: ["consumo_produto_servico"],
        tipoAdvogadoSugerido: "Advogado cível",
        confianca: 0.9,
        justificativa: "Produto com defeito",
      }),
    );

    const resultado = await classificar({ descricao: "Comprei um produto com defeito e a loja não troca." });

    expect(resultado.origem).toBe("ia");
    expect(resultado.provedor).toBe("groq");
    expect(resultado.areaClassificada).toBe("civel");
  });

  it("Gemini responde com baixa confiança → tenta o Groq antes de ir pras regras", async () => {
    generateContentMock.mockResolvedValueOnce(
      respostaGemini({ area: "civel", categorias: [], tipoAdvogadoSugerido: "x", confianca: 0.2, justificativa: "y" }),
    );
    groqCreateMock.mockResolvedValueOnce(
      respostaGroq({
        area: "civel",
        categorias: ["plano_saude"],
        tipoAdvogadoSugerido: "Advogado cível",
        confianca: 0.85,
        justificativa: "Negativa de cobertura",
      }),
    );

    const resultado = await classificar({ descricao: "Meu plano de saúde negou um exame urgente." });

    expect(resultado.provedor).toBe("groq");
    expect(resultado.categorias).toContain("plano_saude");
  });

  it("Gemini e Groq falham → cai no fallback por regras", async () => {
    generateContentMock.mockRejectedValueOnce(new Error("erro de rede"));
    groqCreateMock.mockRejectedValueOnce(new Error("erro de rede"));

    const resultado = await classificar({
      descricao: "Fui demitido sem justa causa e não pagaram minhas horas extras.",
    });

    expect(resultado.origem).toBe("regras");
    expect(resultado.areaClassificada).toBe("trabalhista");
  });

  it("sem GROQ_API_KEY configurada, Gemini falhando cai direto pras regras", async () => {
    delete process.env.GROQ_API_KEY;
    generateContentMock.mockRejectedValueOnce(new Error("erro de rede"));

    const resultado = await classificar({
      descricao: "Comprei um produto com defeito e a loja não quer trocar.",
    });

    expect(resultado.origem).toBe("regras");
    expect(groqCreateMock).not.toHaveBeenCalled();
  });
});

describe("classificar com área fixa (etapa 2)", () => {
  beforeEach(() => {
    process.env.GEMINI_API_KEY = "fake-gemini-key";
    generateContentMock.mockReset();
  });

  afterEach(() => {
    delete process.env.GEMINI_API_KEY;
  });

  it("mantém a área da etapa 1 mesmo se a IA responder outra, e descarta categoria de outra área", async () => {
    generateContentMock.mockResolvedValueOnce(
      respostaGemini({
        area: "civel",
        categorias: ["consumo_produto_servico", "horas_extras"],
        tipoAdvogadoSugerido: "Advogado",
        confianca: 0.9,
        justificativa: "x",
      }),
    );

    const resultado = await classificar({ descricao: "Faço hora extra e não recebo.", areaFixa: "trabalhista" });
    expect(resultado.areaClassificada).toBe("trabalhista");
    expect(resultado.categorias).toEqual(["horas_extras"]);
  });

  it("tira o \"outro\" quando a IA já achou uma especialidade de verdade", async () => {
    generateContentMock.mockResolvedValueOnce(
      respostaGemini({
        area: "civel",
        categorias: ["plano_saude", "outro_civel"],
        tipoAdvogadoSugerido: "x",
        confianca: 0.9,
        justificativa: "x",
      }),
    );
    const resultado = await classificar({ descricao: "O plano negou meu exame.", areaFixa: "civel" });
    expect(resultado.categorias).toEqual(["plano_saude"]);
  });

  it("o prompt avisa a IA que a área já foi decidida", async () => {
    generateContentMock.mockResolvedValueOnce(
      respostaGemini({ area: "civel", categorias: [], tipoAdvogadoSugerido: "x", confianca: 0.9, justificativa: "x" }),
    );

    const resultado = await classificar({ descricao: "Meu aluguel subiu demais.", areaFixa: "civel" });
    expect(generateContentMock.mock.calls[0][0].contents).toContain('area = "civel"');
    expect(resultado.categorias).toEqual(["outro_civel"]);
  });
});
