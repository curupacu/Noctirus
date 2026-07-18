import { describe, expect, it, vi } from "vitest";

// oab.js importa `db` de firebase-admin.js, que inicializa o app real (e quebra sem
// credenciais) só de ser importado. validarFormatoOab não usa Firestore, então um stub
// vazio é suficiente pra rodar sem precisar de service-account.json.
vi.mock("../lib/firebase-admin.js", () => ({ db: {} }));

const { validarFormatoOab } = await import("./oab.js");

describe("validarFormatoOab", () => {
  it("aceita número e UF válidos", () => {
    expect(validarFormatoOab({ numero: "123456", uf: "SP" })).toBeNull();
  });

  it("aceita o menor número válido (4 dígitos)", () => {
    expect(validarFormatoOab({ numero: "1234", uf: "SP" })).toBeNull();
  });

  it("aceita o maior número válido (7 dígitos)", () => {
    expect(validarFormatoOab({ numero: "1234567", uf: "SP" })).toBeNull();
  });

  it("aceita UF minúscula", () => {
    expect(validarFormatoOab({ numero: "123456", uf: "sp" })).toBeNull();
  });

  it("rejeita número com menos de 4 dígitos", () => {
    expect(validarFormatoOab({ numero: "123", uf: "SP" })).toMatch(/número/i);
  });

  it("rejeita número com mais de 7 dígitos", () => {
    expect(validarFormatoOab({ numero: "12345678", uf: "SP" })).toMatch(/número/i);
  });

  it("rejeita número não numérico", () => {
    expect(validarFormatoOab({ numero: "ABC123", uf: "SP" })).toMatch(/número/i);
  });

  it("rejeita número ausente", () => {
    expect(validarFormatoOab({ uf: "SP" })).toMatch(/número/i);
  });

  it("rejeita UF inválida", () => {
    expect(validarFormatoOab({ numero: "123456", uf: "XX" })).toMatch(/UF/i);
  });

  it("rejeita UF ausente", () => {
    expect(validarFormatoOab({ numero: "123456" })).toMatch(/UF/i);
  });
});
