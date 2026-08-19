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
  // Garante que a classificação usa o fallback por regras nos testes (sem depender de
  // chave/rede do Gemini) — RNF003, o mesmo caminho que já é coberto em
  // services/triagem.test.js.
  delete process.env.GEMINI_API_KEY;
});

describe("GET /triagem/perguntas", () => {
  it("responde sem precisar de token", async () => {
    const resposta = await request(app).get("/triagem/perguntas");
    expect(resposta.status).toBe(200);
    expect(resposta.body.principal).toBeDefined();
    expect(resposta.body.categorias).toBeDefined();
  });
});

describe("POST /triagem/classificar", () => {
  it("recusa sem token", async () => {
    const resposta = await request(app).post("/triagem/classificar").send({ descricao: "abc abc abc" });
    expect(resposta.status).toBe(401);
  });

  it("recusa quem não é cliente", async () => {
    const token = cell.fake.criarToken({ uid: "a1", role: "advogado" });
    const resposta = await request(app)
      .post("/triagem/classificar")
      .set("Authorization", `Bearer ${token}`)
      .send({ descricao: "Fui demitido sem justa causa" });
    expect(resposta.status).toBe(403);
  });

  it("recusa descrição curta demais", async () => {
    const token = cell.fake.criarToken({ uid: "c1", role: "cliente" });
    const resposta = await request(app)
      .post("/triagem/classificar")
      .set("Authorization", `Bearer ${token}`)
      .send({ descricao: "curta" });
    expect(resposta.status).toBe(400);
  });

  it("classifica pelo fallback de regras e grava a triagem vinculada ao cliente", async () => {
    const token = cell.fake.criarToken({ uid: "c1", role: "cliente" });
    const resposta = await request(app)
      .post("/triagem/classificar")
      .set("Authorization", `Bearer ${token}`)
      .send({
        respostas: { situacao: "trabalho", papel: "empregado" },
        descricao: "Fui demitido sem justa causa e não pagaram minhas horas extras.",
      });

    expect(resposta.status).toBe(201);
    expect(resposta.body.areaClassificada).toBe("trabalhista");
    expect(resposta.body.origem).toBe("regras");
    expect(resposta.body.advogados).toBeDefined();

    const triagem = (await cell.fake.db.collection("triagens").doc(resposta.body.id).get()).data();
    expect(triagem.clienteId).toBe("c1");
  });

  it("compartilharComAdvogado é falso por padrão, e vira true só com opt-in explícito", async () => {
    const token = cell.fake.criarToken({ uid: "c1", role: "cliente" });

    const semOptIn = await request(app)
      .post("/triagem/classificar")
      .set("Authorization", `Bearer ${token}`)
      .send({ descricao: "Fui demitido sem justa causa e não pagaram minhas horas extras." });
    expect(semOptIn.body.compartilharComAdvogado).toBe(false);

    const comOptIn = await request(app)
      .post("/triagem/classificar")
      .set("Authorization", `Bearer ${token}`)
      .send({
        descricao: "Fui demitido sem justa causa e não pagaram minhas horas extras.",
        compartilharComAdvogado: true,
      });
    expect(comOptIn.body.compartilharComAdvogado).toBe(true);
  });

  it("soma o contador de sugestão dos advogados compatíveis", async () => {
    cell.fake.db._seed("advogados", "adv1", {
      areasAtuacao: ["trabalhista"],
      localizacao: {},
      especialidades: [],
      verificado: false,
    });
    cell.fake.db._seed("users", "adv1", { nome: "Advogado Um", status: "ativo" });

    const token = cell.fake.criarToken({ uid: "c1", role: "cliente" });
    const resposta = await request(app)
      .post("/triagem/classificar")
      .set("Authorization", `Bearer ${token}`)
      .send({
        respostas: { situacao: "trabalho", papel: "empregado" },
        descricao: "Fui demitido sem justa causa e não pagaram minhas horas extras.",
      });

    expect(resposta.status).toBe(201);
    expect(resposta.body.advogados.find((a) => a.uid === "adv1").vezesSugerido).toBe(1);

    const advogado = (await cell.fake.db.collection("advogados").doc("adv1").get()).data();
    expect(advogado.vezesSugerido).toBe(1);
  });
});

describe("GET /triagem/historico", () => {
  it("recusa sem token", async () => {
    const resposta = await request(app).get("/triagem/historico");
    expect(resposta.status).toBe(401);
  });

  it("retorna só as triagens do próprio cliente", async () => {
    cell.fake.db._seed("triagens", "t1", { clienteId: "c1", createdAt: "2026-01-01T00:00:00.000Z" });
    cell.fake.db._seed("triagens", "t2", { clienteId: "c2", createdAt: "2026-01-02T00:00:00.000Z" });
    const token = cell.fake.criarToken({ uid: "c1", role: "cliente" });
    const resposta = await request(app).get("/triagem/historico").set("Authorization", `Bearer ${token}`);
    expect(resposta.status).toBe(200);
    expect(resposta.body.map((t) => t.id)).toEqual(["t1"]);
  });
});

describe("GET /triagem/:id", () => {
  it("404 quando a triagem não existe", async () => {
    const token = cell.fake.criarToken({ uid: "c1", role: "cliente" });
    const resposta = await request(app).get("/triagem/nao-existe").set("Authorization", `Bearer ${token}`);
    expect(resposta.status).toBe(404);
  });

  it("404 quando a triagem é de outro cliente (não vaza dado de terceiro)", async () => {
    cell.fake.db._seed("triagens", "t1", { clienteId: "outro-cliente", areaClassificada: "civel" });
    const token = cell.fake.criarToken({ uid: "c1", role: "cliente" });
    const resposta = await request(app).get("/triagem/t1").set("Authorization", `Bearer ${token}`);
    expect(resposta.status).toBe(404);
  });

  it("retorna a triagem do próprio cliente com advogados compatíveis", async () => {
    cell.fake.db._seed("triagens", "t1", {
      clienteId: "c1",
      areaClassificada: "civel",
      categorias: [],
    });
    const token = cell.fake.criarToken({ uid: "c1", role: "cliente" });
    const resposta = await request(app).get("/triagem/t1").set("Authorization", `Bearer ${token}`);
    expect(resposta.status).toBe(200);
    expect(resposta.body.advogados).toBeDefined();
  });
});
