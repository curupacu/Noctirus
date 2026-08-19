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

const { CATEGORIAS_POR_AREA, TODAS_CATEGORIAS, classificar, classificarPorRegras } = await import("./triagem.js");

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
  it("classifica como trabalhista quando a primeira pergunta aponta trabalho", () => {
    const resultado = classificarPorRegras({
      respostas: { situacao: "trabalho", papel: "empregado" },
      descricao: "qualquer coisa",
    });
    expect(resultado.areaClassificada).toBe("trabalhista");
    expect(resultado.origem).toBe("regras");
  });

  it("classifica como cível quando a primeira pergunta aponta contrato/consumo", () => {
    const resultado = classificarPorRegras({
      respostas: { situacao: "contrato_consumo" },
      descricao: "qualquer coisa",
    });
    expect(resultado.areaClassificada).toBe("civel");
  });

  it("classifica como cível quando a primeira pergunta aponta família/herança", () => {
    const resultado = classificarPorRegras({
      respostas: { situacao: "familia_heranca" },
      descricao: "qualquer coisa",
    });
    expect(resultado.areaClassificada).toBe("civel");
  });

  it("sem pergunta guiada, cai pra palavras-chave da descrição (trabalhista)", () => {
    const resultado = classificarPorRegras({
      respostas: { situacao: "outro" },
      descricao: "Fui demitido sem justa causa e não pagaram minhas horas extras.",
    });
    expect(resultado.areaClassificada).toBe("trabalhista");
  });

  it("sem pergunta guiada, cai pra palavras-chave da descrição (cível)", () => {
    const resultado = classificarPorRegras({
      respostas: { situacao: "outro" },
      descricao: "Comprei um produto com defeito e a loja não quer trocar.",
    });
    expect(resultado.areaClassificada).toBe("civel");
  });

  it("fica indefinido quando não há pergunta guiada nem palavra-chave reconhecível", () => {
    const resultado = classificarPorRegras({
      respostas: { situacao: "outro" },
      descricao: "preciso de ajuda com uma coisa",
    });
    expect(resultado.areaClassificada).toBe("indefinido");
    expect(resultado.categorias).toEqual([]);
  });

  it("detecta subcategorias específicas a partir da descrição", () => {
    const resultado = classificarPorRegras({
      respostas: { situacao: "trabalho", papel: "empregado" },
      descricao: "Fui demitido sem justa causa e não pagaram minhas horas extras.",
    });
    expect(resultado.categorias).toContain("demissao_sem_justa_causa");
    expect(resultado.categorias).toContain("horas_extras");
  });

  it("sempre tem pelo menos uma categoria quando a área é conhecida, mesmo sem palavra-chave específica", () => {
    const resultado = classificarPorRegras({
      respostas: { situacao: "trabalho", papel: "empregado" },
      descricao: "problema no trabalho",
    });
    expect(resultado.categorias.length).toBeGreaterThan(0);
    expect(resultado.categorias).toContain("outro_trabalhista");
  });

  it("sugere advogado pra empregador quando a resposta indica isso", () => {
    const resultado = classificarPorRegras({
      respostas: { situacao: "trabalho", papel: "empregador" },
      descricao: "quero demitir um funcionário",
    });
    expect(resultado.tipoAdvogadoSugerido).toMatch(/empregador/i);
  });

  it("sugere advogado pro trabalhador por padrão (sem resposta de papel)", () => {
    const resultado = classificarPorRegras({
      respostas: { situacao: "trabalho" },
      descricao: "não recebi minhas verbas",
    });
    expect(resultado.tipoAdvogadoSugerido).toMatch(/trabalhador/i);
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

    const resultado = await classificar({ respostas: {}, descricao: "Faço muitas horas extras e nunca recebo por elas." });

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

    const resultado = await classificar({ respostas: {}, descricao: "Comprei um produto com defeito e a loja não troca." });

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

    const resultado = await classificar({ respostas: {}, descricao: "Meu plano de saúde negou um exame urgente." });

    expect(resultado.provedor).toBe("groq");
    expect(resultado.categorias).toContain("plano_saude");
  });

  it("Gemini e Groq falham → cai no fallback por regras", async () => {
    generateContentMock.mockRejectedValueOnce(new Error("erro de rede"));
    groqCreateMock.mockRejectedValueOnce(new Error("erro de rede"));

    const resultado = await classificar({
      respostas: { situacao: "trabalho", papel: "empregado" },
      descricao: "Fui demitido sem justa causa e não pagaram minhas horas extras.",
    });

    expect(resultado.origem).toBe("regras");
    expect(resultado.areaClassificada).toBe("trabalhista");
  });

  it("sem GROQ_API_KEY configurada, Gemini falhando cai direto pras regras", async () => {
    delete process.env.GROQ_API_KEY;
    generateContentMock.mockRejectedValueOnce(new Error("erro de rede"));

    const resultado = await classificar({
      respostas: { situacao: "contrato_consumo" },
      descricao: "Comprei um produto com defeito e a loja não quer trocar.",
    });

    expect(resultado.origem).toBe("regras");
    expect(groqCreateMock).not.toHaveBeenCalled();
  });
});
