import { describe, expect, it } from "vitest";
import { templateAviso } from "./emailTemplates.js";

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
