import { beforeEach, describe, expect, it, vi } from "vitest";

const cell = vi.hoisted(() => ({ fake: null }));
const enviarEmailMock = vi.hoisted(() => vi.fn().mockResolvedValue({ enviado: true }));

vi.mock("../lib/firebase-admin.js", () => ({
  db: { collection: (...args) => cell.fake.db.collection(...args) },
  auth: {
    verifyIdToken: (...args) => cell.fake.auth.verifyIdToken(...args),
    generatePasswordResetLink: (...args) => cell.fake.auth.generatePasswordResetLink(...args),
  },
}));

vi.mock("../lib/email.js", () => ({
  enviarEmail: (...args) => enviarEmailMock(...args),
}));

import { criarFakeFirebase } from "../test-utils/fakeFirebase.js";

const request = (await import("supertest")).default;
const { app } = await import("../app.js");

beforeEach(() => {
  cell.fake = criarFakeFirebase();
  enviarEmailMock.mockClear();
});

describe("POST /auth/recuperar-senha", () => {
  it("manda o e-mail da Nocturis com o link em português pra quem tem conta", async () => {
    cell.fake.auth._registrarEmail("maria@example.com");
    const resposta = await request(app).post("/auth/recuperar-senha").send({ email: " Maria@Example.com " });

    expect(resposta.status).toBe(200);
    expect(enviarEmailMock).toHaveBeenCalledTimes(1);
    const { to, subject, html } = enviarEmailMock.mock.calls[0][0];
    expect(to).toBe("maria@example.com");
    expect(subject).toContain("senha nova");
    expect(html).toContain("lang=pt-BR");
    expect(html).toContain("Criar senha nova");
  });

  it("responde igual pra e-mail sem conta (não revela quem usa a Nocturis) e não manda nada", async () => {
    const resposta = await request(app).post("/auth/recuperar-senha").send({ email: "ninguem@example.com" });
    expect(resposta.status).toBe(200);
    expect(resposta.body).toEqual({ ok: true });
    expect(enviarEmailMock).not.toHaveBeenCalled();
  });

  it("recusa e-mail inválido", async () => {
    const resposta = await request(app).post("/auth/recuperar-senha").send({ email: "nao-e-email" });
    expect(resposta.status).toBe(400);
  });
});
