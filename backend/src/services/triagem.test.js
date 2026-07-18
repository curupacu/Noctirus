import { describe, expect, it } from "vitest";
import { CATEGORIAS_POR_AREA, TODAS_CATEGORIAS, classificarPorRegras } from "./triagem.js";

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
