import { describe, expect, it, vi } from "vitest";

// auth.js importa `auth` de firebase-admin.js, que inicializa o app real (e quebra sem
// credenciais) só de ser importado. requireRole não usa Firebase Auth diretamente, então
// um stub vazio é suficiente pra rodar sem precisar de service-account.json.
vi.mock("../lib/firebase-admin.js", () => ({ auth: {} }));

const { requireRole } = await import("./auth.js");

function mockRes() {
  const res = {};
  res.status = vi.fn(() => res);
  res.json = vi.fn(() => res);
  return res;
}

describe("requireRole", () => {
  it("chama next() quando o papel do usuário está na lista permitida", () => {
    const req = { user: { role: "admin" } };
    const res = mockRes();
    const next = vi.fn();

    requireRole("admin")(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(res.status).not.toHaveBeenCalled();
  });

  it("aceita quando o papel bate com uma entre várias permitidas", () => {
    const req = { user: { role: "advogado" } };
    const res = mockRes();
    const next = vi.fn();

    requireRole("cliente", "advogado")(req, res, next);

    expect(next).toHaveBeenCalledOnce();
  });

  it("responde 403 quando o papel não está na lista permitida", () => {
    const req = { user: { role: "cliente" } };
    const res = mockRes();
    const next = vi.fn();

    requireRole("admin")(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it("responde 403 quando não há usuário autenticado", () => {
    const req = {};
    const res = mockRes();
    const next = vi.fn();

    requireRole("admin")(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
  });
});
