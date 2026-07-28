import { beforeEach, describe, expect, it, vi } from "vitest";

const cell = vi.hoisted(() => ({ fake: null }));

vi.mock("../lib/firebase-admin.js", () => ({
  db: {
    collection: (...args) => cell.fake.db.collection(...args),
    batch: (...args) => cell.fake.db.batch(...args),
  },
  auth: {
    verifyIdToken: (...args) => cell.fake.auth.verifyIdToken(...args),
    setCustomUserClaims: (...args) => cell.fake.auth.setCustomUserClaims(...args),
    updateUser: (...args) => cell.fake.auth.updateUser(...args),
    deleteUser: (...args) => cell.fake.auth.deleteUser(...args),
  },
}));

import { criarFakeFirebase } from "../test-utils/fakeFirebase.js";

const request = (await import("supertest")).default;
const { app } = await import("../app.js");

beforeEach(() => {
  cell.fake = criarFakeFirebase();
});

describe("GET /curriculos/:uid", () => {
  it("404 quando não existe", async () => {
    const resposta = await request(app).get("/curriculos/nao-existe");
    expect(resposta.status).toBe(404);
  });

  it("retorna o currículo público, sem precisar de token", async () => {
    cell.fake.db._seed("curriculos", "a1", { formacao: ["Direito - USP"], cursos: [] });
    const resposta = await request(app).get("/curriculos/a1");
    expect(resposta.status).toBe(200);
    expect(resposta.body.formacao).toEqual(["Direito - USP"]);
  });
});

describe("PUT /curriculos/:uid", () => {
  it("recusa sem token", async () => {
    const resposta = await request(app).put("/curriculos/a1").send({ formacao: [] });
    expect(resposta.status).toBe(401);
  });

  it("recusa quem não é advogado", async () => {
    const token = cell.fake.criarToken({ uid: "a1", role: "cliente" });
    const resposta = await request(app)
      .put("/curriculos/a1")
      .set("Authorization", `Bearer ${token}`)
      .send({ formacao: [] });
    expect(resposta.status).toBe(403);
  });

  it("recusa editar o currículo de outro advogado", async () => {
    cell.fake.db._seed("curriculos", "a1", {});
    const token = cell.fake.criarToken({ uid: "a2", role: "advogado" });
    const resposta = await request(app)
      .put("/curriculos/a1")
      .set("Authorization", `Bearer ${token}`)
      .send({ formacao: [] });
    expect(resposta.status).toBe(403);
  });

  it("recusa campo que não é lista", async () => {
    cell.fake.db._seed("curriculos", "a1", {});
    const token = cell.fake.criarToken({ uid: "a1", role: "advogado" });
    const resposta = await request(app)
      .put("/curriculos/a1")
      .set("Authorization", `Bearer ${token}`)
      .send({ formacao: "Direito - USP" });
    expect(resposta.status).toBe(400);
  });

  it("recusa corpo sem nenhum campo reconhecido", async () => {
    cell.fake.db._seed("curriculos", "a1", {});
    const token = cell.fake.criarToken({ uid: "a1", role: "advogado" });
    const resposta = await request(app).put("/curriculos/a1").set("Authorization", `Bearer ${token}`).send({});
    expect(resposta.status).toBe(400);
  });

  it("atualiza os campos do próprio currículo", async () => {
    cell.fake.db._seed("curriculos", "a1", { formacao: [] });
    const token = cell.fake.criarToken({ uid: "a1", role: "advogado" });
    const resposta = await request(app)
      .put("/curriculos/a1")
      .set("Authorization", `Bearer ${token}`)
      .send({ formacao: ["Direito - USP (2020)"], experiencias: ["Escritório X, 2021-2023"] });

    expect(resposta.status).toBe(200);
    const curriculo = (await cell.fake.db.collection("curriculos").doc("a1").get()).data();
    expect(curriculo.formacao).toEqual(["Direito - USP (2020)"]);
    expect(curriculo.experiencias).toEqual(["Escritório X, 2021-2023"]);
  });
});
