import { describe, expect, it } from "vitest";
import { corDoAvatar } from "./avatarColor";
import { textoLocalizacao } from "./localizacao";
import { ehDemonstracao, labelSituacaoOab, oabAprovada } from "./situacaoOab";
import { linkWhatsapp } from "./solicitacoes";

// Testes das funções puras do frontend (as telas dependem delas pra mostrar selo de OAB,
// localização e o link do WhatsApp liberado depois do aceite).
describe("situação da OAB", () => {
  it("só considera aprovado quem tem situacaoOab 'aprovado'", () => {
    expect(oabAprovada({ situacaoOab: "aprovado" })).toBe(true);
    expect(oabAprovada({ situacaoOab: "revogado" })).toBe(false);
    expect(oabAprovada(null)).toBe(false);
  });

  it("perfil de demonstração nunca aparece como 'OAB verificada'", () => {
    const demo = { situacaoOab: "aprovado", demonstracao: true };
    expect(ehDemonstracao(demo)).toBe(true);
    expect(labelSituacaoOab(demo)).toBe("Perfil de demonstração");
    expect(labelSituacaoOab({ situacaoOab: "aprovado" })).toBe("OAB verificada");
  });

  it("sem situação conhecida, mostra 'em análise'", () => {
    expect(labelSituacaoOab({})).toBe("OAB em análise");
  });
});

describe("textoLocalizacao", () => {
  it("junta cidade e UF, ou usa o que tiver", () => {
    expect(textoLocalizacao({ cidade: "São Paulo", uf: "SP" })).toBe("São Paulo/SP");
    expect(textoLocalizacao({ uf: "SP" })).toBe("SP");
    expect(textoLocalizacao(null)).toBe(null);
  });
});

describe("linkWhatsapp", () => {
  it("monta o link com o DDI do Brasil quando falta", () => {
    expect(linkWhatsapp("(11) 98888-7777")).toBe("https://wa.me/5511988887777");
    expect(linkWhatsapp("5511988887777")).toBe("https://wa.me/5511988887777");
    expect(linkWhatsapp("")).toBe(null);
  });
});

describe("corDoAvatar", () => {
  it("é estável pra mesma pessoa e sempre uma cor da marca", () => {
    expect(corDoAvatar("abc")).toBe(corDoAvatar("abc"));
    expect(corDoAvatar("abc")).toMatch(/^#[0-9A-F]{6}$/);
  });
});
