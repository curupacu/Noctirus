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

function semear(uid, { advogado, usuario } = {}) {
  cell.fake.db._seed("advogados", uid, {
    areasAtuacao: [],
    localizacao: {},
    especialidades: [],
    verificado: false,
    ...advogado,
  });
  cell.fake.db._seed("users", uid, { nome: "Advogado " + uid, status: "ativo", ...usuario });
}

describe("GET /admin/advogados", () => {
  it("recusa sem token", async () => {
    const resposta = await request(app).get("/admin/advogados");
    expect(resposta.status).toBe(401);
  });

  it("recusa quem não é admin", async () => {
    const token = cell.fake.criarToken({ uid: "u1", role: "advogado" });
    const resposta = await request(app).get("/admin/advogados").set("Authorization", `Bearer ${token}`);
    expect(resposta.status).toBe(403);
  });

  it("admin vê inclusive advogados suspensos", async () => {
    semear("a1", { usuario: { status: "suspenso" } });
    const token = cell.fake.criarToken({ uid: "admin1", role: "admin" });
    const resposta = await request(app).get("/admin/advogados").set("Authorization", `Bearer ${token}`);
    expect(resposta.status).toBe(200);
    expect(resposta.body.map((a) => a.uid)).toEqual(["a1"]);
  });
});

describe("GET /advogados", () => {
  it("lista pública sem precisar de token", async () => {
    semear("a1", { advogado: { areasAtuacao: ["civel"] } });
    semear("a2", { advogado: { areasAtuacao: ["trabalhista"] } });
    const resposta = await request(app).get("/advogados");
    expect(resposta.status).toBe(200);
    expect(resposta.body).toHaveLength(2);
  });

  it("filtra por área via query string", async () => {
    semear("a1", { advogado: { areasAtuacao: ["civel"] } });
    semear("a2", { advogado: { areasAtuacao: ["trabalhista"] } });
    const resposta = await request(app).get("/advogados?area=trabalhista");
    expect(resposta.body.map((a) => a.uid)).toEqual(["a2"]);
  });
});

describe("GET /advogados/:uid", () => {
  it("404 quando não existe", async () => {
    const resposta = await request(app).get("/advogados/nao-existe");
    expect(resposta.status).toBe(404);
  });

  it("retorna advogado com nome/status resolvidos do users", async () => {
    semear("a1", { usuario: { nome: "Fulano" } });
    const resposta = await request(app).get("/advogados/a1");
    expect(resposta.status).toBe(200);
    expect(resposta.body.nome).toBe("Fulano");
    expect(resposta.body.uid).toBe("a1");
  });
});

describe("PUT /advogados/:uid", () => {
  it("recusa sem token", async () => {
    const resposta = await request(app).put("/advogados/a1").send({});
    expect(resposta.status).toBe(401);
  });

  it("recusa quem não é advogado", async () => {
    const token = cell.fake.criarToken({ uid: "a1", role: "cliente" });
    const resposta = await request(app).put("/advogados/a1").set("Authorization", `Bearer ${token}`).send({});
    expect(resposta.status).toBe(403);
  });

  it("recusa editar o perfil de outro advogado", async () => {
    semear("a1");
    const token = cell.fake.criarToken({ uid: "a2", role: "advogado" });
    const resposta = await request(app)
      .put("/advogados/a1")
      .set("Authorization", `Bearer ${token}`)
      .send({ whatsapp: "11999999999" });
    expect(resposta.status).toBe(403);
  });

  it("recusa corpo sem nenhum campo reconhecido", async () => {
    semear("a1");
    const token = cell.fake.criarToken({ uid: "a1", role: "advogado" });
    const resposta = await request(app).put("/advogados/a1").set("Authorization", `Bearer ${token}`).send({});
    expect(resposta.status).toBe(400);
  });

  it("atualiza especialidades (filtrando fora da taxonomia) e whatsapp", async () => {
    semear("a1");
    const token = cell.fake.criarToken({ uid: "a1", role: "advogado" });
    const resposta = await request(app)
      .put("/advogados/a1")
      .set("Authorization", `Bearer ${token}`)
      .send({ especialidades: ["horas_extras", "invalida"], whatsapp: "11999999999" });

    expect(resposta.status).toBe(200);
    const advogado = (await cell.fake.db.collection("advogados").doc("a1").get()).data();
    expect(advogado.especialidades).toEqual(["horas_extras"]);
    expect(advogado.contatos.whatsapp).toBe("11999999999");
  });
});

describe("PATCH /advogados/:uid/verificar", () => {
  it("recusa quem não é admin", async () => {
    semear("a1");
    const token = cell.fake.criarToken({ uid: "a1", role: "advogado" });
    const resposta = await request(app)
      .patch("/advogados/a1/verificar")
      .set("Authorization", `Bearer ${token}`)
      .send({ verificado: true });
    expect(resposta.status).toBe(403);
  });

  it("recusa campo não booleano", async () => {
    semear("a1");
    const token = cell.fake.criarToken({ uid: "admin1", role: "admin" });
    const resposta = await request(app)
      .patch("/advogados/a1/verificar")
      .set("Authorization", `Bearer ${token}`)
      .send({ verificado: "sim" });
    expect(resposta.status).toBe(400);
  });

  it("admin aprova a OAB", async () => {
    semear("a1");
    const token = cell.fake.criarToken({ uid: "admin1", role: "admin" });
    const resposta = await request(app)
      .patch("/advogados/a1/verificar")
      .set("Authorization", `Bearer ${token}`)
      .send({ verificado: true });

    expect(resposta.status).toBe(200);
    const advogado = (await cell.fake.db.collection("advogados").doc("a1").get()).data();
    expect(advogado.verificado).toBe(true);
  });
});
