import { describe, expect, it } from "vitest";
import { templateAviso, templateNovaResposta } from "./emailTemplates.js";

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

  // Achado da auditoria de segurança (F2): o nome do advogado ia sem escape pro HTML do
  // e-mail — um nome com marcação HTML chegava intacto na caixa de entrada do cliente.
  it("escapa HTML no nome do advogado (evita injeção no e-mail)", () => {
    const html = templateNovaResposta({
      advogadoNome: '<img src=x onerror="alert(1)">',
      advogadoFoto: null,
      linkConversa: "https://nocturis.com.br/advogados/a1/contato",
    });
    expect(html).not.toContain("<img src=x onerror");
    expect(html).toContain("&lt;img src=x onerror=&quot;alert(1)&quot;&gt;");
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

describe("templateAviso", () => {
  it("monta título, parágrafos e botão com link", () => {
    const html = templateAviso({
      titulo: "Sua OAB foi verificada",
      paragrafos: ["Seu perfil já aparece pros clientes."],
      botaoTexto: "Ver meu painel",
      link: "https://nocturis.com.br/perfil",
    });
    expect(html).toContain("Sua OAB foi verificada");
    expect(html).toContain("Seu perfil já aparece pros clientes.");
    expect(html).toContain("https://nocturis.com.br/perfil");
  });

  it("escapa o motivo digitado pelo admin", () => {
    const html = templateAviso({ titulo: "Aviso", paragrafos: ['Motivo: <img src=x onerror="alert(1)">'] });
    expect(html).not.toContain("<img src=x");
    expect(html).toContain("&lt;img src=x");
  });
});
