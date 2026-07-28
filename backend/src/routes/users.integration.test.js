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

describe("GET /users/me", () => {
  it("recusa sem token", async () => {
    const resposta = await request(app).get("/users/me");
    expect(resposta.status).toBe(401);
  });

  it("404 quando o cadastro não existe no Firestore", async () => {
    const token = cell.fake.criarToken({ uid: "u1", role: "cliente" });
    const resposta = await request(app).get("/users/me").set("Authorization", `Bearer ${token}`);
    expect(resposta.status).toBe(404);
  });

  it("retorna os próprios dados", async () => {
    cell.fake.db._seed("users", "u1", { role: "cliente", nome: "Fulano" });
    const token = cell.fake.criarToken({ uid: "u1", role: "cliente" });
    const resposta = await request(app).get("/users/me").set("Authorization", `Bearer ${token}`);
    expect(resposta.status).toBe(200);
    expect(resposta.body.nome).toBe("Fulano");
  });
});

describe("PUT /users/me", () => {
  it("recusa corpo vazio", async () => {
    cell.fake.db._seed("users", "u1", { nome: "Fulano" });
    const token = cell.fake.criarToken({ uid: "u1", role: "cliente" });
    const resposta = await request(app).put("/users/me").set("Authorization", `Bearer ${token}`).send({});
    expect(resposta.status).toBe(400);
  });

  it("atualiza nome/telefone", async () => {
    cell.fake.db._seed("users", "u1", { nome: "Fulano" });
    const token = cell.fake.criarToken({ uid: "u1", role: "cliente" });
    const resposta = await request(app)
      .put("/users/me")
      .set("Authorization", `Bearer ${token}`)
      .send({ nome: "Fulano Editado", telefone: "11999999999" });
    expect(resposta.status).toBe(200);
    const usuario = (await cell.fake.db.collection("users").doc("u1").get()).data();
    expect(usuario.nome).toBe("Fulano Editado");
    expect(usuario.telefone).toBe("11999999999");
  });
});

describe("GET /admin/users", () => {
  it("recusa quem não é admin", async () => {
    const token = cell.fake.criarToken({ uid: "u1", role: "cliente" });
    const resposta = await request(app).get("/admin/users").set("Authorization", `Bearer ${token}`);
    expect(resposta.status).toBe(403);
  });

  it("lista clientes e advogados, mas não admins", async () => {
    cell.fake.db._seed("users", "c1", { role: "cliente", nome: "Cliente" });
    cell.fake.db._seed("users", "a1", { role: "advogado", nome: "Advogado" });
    cell.fake.db._seed("users", "adm1", { role: "admin", nome: "Admin" });
    const token = cell.fake.criarToken({ uid: "adm1", role: "admin" });
    const resposta = await request(app).get("/admin/users").set("Authorization", `Bearer ${token}`);
    expect(resposta.status).toBe(200);
    expect(resposta.body.map((u) => u.uid).sort()).toEqual(["a1", "c1"]);
  });
});

describe("PATCH /admin/users/:uid/suspender", () => {
  it("recusa campo não booleano", async () => {
    cell.fake.db._seed("users", "c1", { role: "cliente" });
    const token = cell.fake.criarToken({ uid: "adm1", role: "admin" });
    const resposta = await request(app)
      .patch("/admin/users/c1/suspender")
      .set("Authorization", `Bearer ${token}`)
      .send({ suspenso: "sim" });
    expect(resposta.status).toBe(400);
  });

  it("404 quando o usuário não existe", async () => {
    const token = cell.fake.criarToken({ uid: "adm1", role: "admin" });
    const resposta = await request(app)
      .patch("/admin/users/nao-existe/suspender")
      .set("Authorization", `Bearer ${token}`)
      .send({ suspenso: true });
    expect(resposta.status).toBe(404);
  });

  it("recusa suspender outro admin", async () => {
    cell.fake.db._seed("users", "adm2", { role: "admin" });
    const token = cell.fake.criarToken({ uid: "adm1", role: "admin" });
    const resposta = await request(app)
      .patch("/admin/users/adm2/suspender")
      .set("Authorization", `Bearer ${token}`)
      .send({ suspenso: true });
    expect(resposta.status).toBe(403);
  });

  it("suspende um usuário com conta na Auth (desativa o login de verdade)", async () => {
    cell.fake.db._seed("users", "c1", { role: "cliente", status: "ativo" });
    cell.fake.auth._registrarUsuario("c1");
    const token = cell.fake.criarToken({ uid: "adm1", role: "admin" });
    const resposta = await request(app)
      .patch("/admin/users/c1/suspender")
      .set("Authorization", `Bearer ${token}`)
      .send({ suspenso: true });
    expect(resposta.status).toBe(200);
    const usuario = (await cell.fake.db.collection("users").doc("c1").get()).data();
    expect(usuario.status).toBe("suspenso");
  });

  it("suspende um advogado do seed sem conta na Auth, sem quebrar (ignora auth/user-not-found)", async () => {
    cell.fake.db._seed("users", "a1", { role: "advogado", status: "ativo" });
    // Não chama auth._registrarUsuario("a1") — simula advogado fictício do seed, sem login.
    const token = cell.fake.criarToken({ uid: "adm1", role: "admin" });
    const resposta = await request(app)
      .patch("/admin/users/a1/suspender")
      .set("Authorization", `Bearer ${token}`)
      .send({ suspenso: true });
    expect(resposta.status).toBe(200);
    const usuario = (await cell.fake.db.collection("users").doc("a1").get()).data();
    expect(usuario.status).toBe("suspenso");
  });
});

describe("DELETE /admin/users/:uid", () => {
  it("recusa remover outro admin", async () => {
    cell.fake.db._seed("users", "adm2", { role: "admin" });
    const token = cell.fake.criarToken({ uid: "adm1", role: "admin" });
    const resposta = await request(app).delete("/admin/users/adm2").set("Authorization", `Bearer ${token}`);
    expect(resposta.status).toBe(403);
  });

  it("remove um advogado (Auth + Firestore, incluindo advogados/curriculos)", async () => {
    cell.fake.db._seed("users", "a1", { role: "advogado" });
    cell.fake.db._seed("advogados", "a1", { areasAtuacao: [] });
    cell.fake.db._seed("curriculos", "a1", { formacao: [] });
    cell.fake.auth._registrarUsuario("a1");
    const token = cell.fake.criarToken({ uid: "adm1", role: "admin" });

    const resposta = await request(app).delete("/admin/users/a1").set("Authorization", `Bearer ${token}`);
    expect(resposta.status).toBe(200);

    expect((await cell.fake.db.collection("users").doc("a1").get()).exists).toBe(false);
    expect((await cell.fake.db.collection("advogados").doc("a1").get()).exists).toBe(false);
    expect((await cell.fake.db.collection("curriculos").doc("a1").get()).exists).toBe(false);
  });

  it("remove um cliente sem tentar apagar advogados/curriculos", async () => {
    cell.fake.db._seed("users", "c1", { role: "cliente" });
    cell.fake.auth._registrarUsuario("c1");
    const token = cell.fake.criarToken({ uid: "adm1", role: "admin" });

    const resposta = await request(app).delete("/admin/users/c1").set("Authorization", `Bearer ${token}`);
    expect(resposta.status).toBe(200);
    expect((await cell.fake.db.collection("users").doc("c1").get()).exists).toBe(false);
  });
});
