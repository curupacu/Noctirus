import { describe, expect, it, vi } from "vitest";

// app.js -> routes/*.js -> lib/firebase-admin.js inicializa o app real do Firebase Admin
// (e quebra sem credenciais) só de ser importado por qualquer rota que use db/auth — mesmo
// aqui, onde /health nem toca Firestore/Auth. Ver o mesmo mock nos outros
// *.integration.test.js (ex.: auth.integration.test.js).
vi.mock("../lib/firebase-admin.js", () => ({
  db: { collection: vi.fn(), batch: vi.fn() },
  auth: { verifyIdToken: vi.fn(), setCustomUserClaims: vi.fn(), updateUser: vi.fn(), deleteUser: vi.fn() },
}));

import request from "supertest";
import { app } from "../app.js";

describe("GET /health", () => {
  it("responde 200 com status ok", async () => {
    const resposta = await request(app).get("/health");
    expect(resposta.status).toBe(200);
    expect(resposta.body).toEqual({ status: "ok" });
  });
});
