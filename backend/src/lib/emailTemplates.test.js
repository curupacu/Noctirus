import { describe, expect, it } from "vitest";
import { templateNovaResposta } from "./emailTemplates.js";

describe("templateNovaResposta", () => {
  it("inclui o nome do advogado e o link da conversa", () => {
    const html = templateNovaResposta({
      advogadoNome: "Roseane Menezes",
      advogadoFoto: null,
      linkConversa: "https://nocturis.com.br/advogados/a1/contato",
    });
    expect(html).toContain("Roseane Menezes");
    expect(html).toContain("https://nocturis.com.br/advogados/a1/contato");
  });

  it("usa a foto de verdade quando existe", () => {
    const html = templateNovaResposta({
      advogadoNome: "Advogado Teste",
      advogadoFoto: "https://res.cloudinary.com/foo/bar.jpg",
      linkConversa: "https://nocturis.com.br/advogados/a1/contato",
    });
    expect(html).toContain("https://res.cloudinary.com/foo/bar.jpg");
  });

  it("cai pras iniciais quando não tem foto (nunca inicial em fundo dourado)", () => {
    const html = templateNovaResposta({
      advogadoNome: "Roseane Menezes",
      advogadoFoto: null,
      linkConversa: "https://nocturis.com.br/advogados/a1/contato",
    });
    expect(html).toContain("RM");
    expect(html).not.toContain("res.cloudinary.com");
  });

  it("é HTML válido o bastante pra ter doctype e não vazar chaves de template", () => {
    const html = templateNovaResposta({
      advogadoNome: "Alguém",
      advogadoFoto: null,
      linkConversa: "https://nocturis.com.br/advogados/a1/contato",
    });
    expect(html).toMatch(/^<!doctype html>/i);
    expect(html).not.toContain("${");
  });
});
