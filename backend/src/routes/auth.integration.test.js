import { beforeEach, describe, expect, it, vi } from "vitest";

// app.js -> routes/*.js -> lib/firebase-admin.js inicializa o app real do Firebase Admin
// (e quebra sem credenciais) só de ser importado por qualquer rota que use db/auth. `cell`
// existe fora do factory por causa do hoisting do vi.mock (ver docs do Vitest:
// vi.hoisted) — os métodos abaixo só resolvem `cell.fake` quando são *chamados* (dentro
// de um teste, depois do beforeEach), não quando o módulo é importado.
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

describe("POST /auth/completar-cadastro", () => {
  it("recusa sem token", async () => {
    const resposta = await request(app).post("/auth/completar-cadastro").send({ role: "cliente", nome: "X" });
    expect(resposta.status).toBe(401);
  });

  it("recusa papel inválido", async () => {
    const token = cell.fake.criarToken({ uid: "u1", role: null });
    const resposta = await request(app)
      .post("/auth/completar-cadastro")
      .set("Authorization", `Bearer ${token}`)
      .send({ role: "admin", nome: "X" });
    expect(resposta.status).toBe(400);
  });

  it("recusa sem nome", async () => {
    const token = cell.fake.criarToken({ uid: "u1", role: null });
    const resposta = await request(app)
      .post("/auth/completar-cadastro")
      .set("Authorization", `Bearer ${token}`)
      .send({ role: "cliente" });
    expect(resposta.status).toBe(400);
  });

  it("recusa se o cadastro já foi concluído pra esse uid", async () => {
    cell.fake.db._seed("users", "u1", { role: "cliente", nome: "Já existe" });
    const token = cell.fake.criarToken({ uid: "u1", role: null });
    const resposta = await request(app)
      .post("/auth/completar-cadastro")
      .set("Authorization", `Bearer ${token}`)
      .send({ role: "cliente", nome: "X" });
    expect(resposta.status).toBe(409);
  });

  it("cria um cliente com sucesso, sem criar advogados/curriculos", async () => {
    const token = cell.fake.criarToken({ uid: "u1", role: null, email: "c@example.com" });
    const resposta = await request(app)
      .post("/auth/completar-cadastro")
      .set("Authorization", `Bearer ${token}`)
      .send({ role: "cliente", nome: "Cliente Teste", telefone: "11999999999" });

    expect(resposta.status).toBe(201);
    expect(resposta.body).toEqual({ role: "cliente" });

    const usuario = await (await cell.fake.db.collection("users").doc("u1").get()).data();
    expect(usuario).toMatchObject({ role: "cliente", nome: "Cliente Teste", status: "ativo" });

    const advogado = await cell.fake.db.collection("advogados").doc("u1").get();
    expect(advogado.exists).toBe(false);
  });

  it("recusa OAB com formato inválido pra advogado", async () => {
    const token = cell.fake.criarToken({ uid: "u2", role: null });
    const resposta = await request(app)
      .post("/auth/completar-cadastro")
      .set("Authorization", `Bearer ${token}`)
      .send({ role: "advogado", nome: "Advogado Teste", oab: { numero: "12", uf: "SP" } });
    expect(resposta.status).toBe(400);
  });

  it("recusa OAB já cadastrada por outro advogado", async () => {
    cell.fake.db._seed("advogados", "outro", { oab: { numero: "123456", uf: "SP" } });
    const token = cell.fake.criarToken({ uid: "u2", role: null });
    const resposta = await request(app)
      .post("/auth/completar-cadastro")
      .set("Authorization", `Bearer ${token}`)
      .send({ role: "advogado", nome: "Advogado Teste", oab: { numero: "123456", uf: "SP" } });
    expect(resposta.status).toBe(409);
  });

  it("recusa área de atuação fora das válidas (civel/trabalhista)", async () => {
    const token = cell.fake.criarToken({ uid: "u3", role: null });
    const resposta = await request(app)
      .post("/auth/completar-cadastro")
      .set("Authorization", `Bearer ${token}`)
      .send({
        role: "advogado",
        nome: "Advogado Teste",
        oab: { numero: "123456", uf: "SP" },
        areasAtuacao: ["penal"],
      });
    expect(resposta.status).toBe(400);
  });

  it("cria um advogado com sucesso, filtrando especialidades fora da taxonomia", async () => {
    const token = cell.fake.criarToken({ uid: "u3", role: null, email: "a@example.com" });
    const resposta = await request(app)
      .post("/auth/completar-cadastro")
      .set("Authorization", `Bearer ${token}`)
      .send({
        role: "advogado",
        nome: "Advogado Teste",
        oab: { numero: "123456", uf: "sp" },
        areasAtuacao: ["civel"],
        especialidades: ["horas_extras", "categoria_inventada"],
        localizacao: { cidade: "São Paulo", uf: "SP" },
        whatsapp: "11988887777",
      });

    expect(resposta.status).toBe(201);

    const advogado = (await cell.fake.db.collection("advogados").doc("u3").get()).data();
    expect(advogado.oab).toEqual({ numero: "123456", uf: "SP" });
    expect(advogado.especialidades).toEqual(["horas_extras"]);
    expect(advogado.verificado).toBe(false);
    expect(advogado.contatos).toEqual({ whatsapp: "11988887777", email: "a@example.com" });

    const curriculo = await cell.fake.db.collection("curriculos").doc("u3").get();
    expect(curriculo.exists).toBe(true);
  });
});
