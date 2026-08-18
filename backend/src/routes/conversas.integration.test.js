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

function semearPar() {
  cell.fake.db._seed("users", "c1", { nome: "Cliente Um", role: "cliente" });
  cell.fake.db._seed("users", "a1", { nome: "Advogado Um", role: "advogado" });
  cell.fake.db._seed("advogados", "a1", { areasAtuacao: ["trabalhista"] });
}

describe("POST /conversas/:comUid/mensagens", () => {
  it("recusa sem token", async () => {
    const resposta = await request(app).post("/conversas/a1/mensagens").send({ texto: "Olá!" });
    expect(resposta.status).toBe(401);
  });

  it("404 quando o outro usuário não existe", async () => {
    const token = cell.fake.criarToken({ uid: "c1", role: "cliente" });
    const resposta = await request(app)
      .post("/conversas/nao-existe/mensagens")
      .set("Authorization", `Bearer ${token}`)
      .send({ texto: "Olá!" });
    expect(resposta.status).toBe(404);
  });

  it("recusa texto fora da lista fixa (cliente)", async () => {
    semearPar();
    const token = cell.fake.criarToken({ uid: "c1", role: "cliente" });
    const resposta = await request(app)
      .post("/conversas/a1/mensagens")
      .set("Authorization", `Bearer ${token}`)
      .send({ texto: "qualquer coisa que eu escrevi na hora" });
    expect(resposta.status).toBe(400);
  });

  it("recusa cliente mandando mensagem da lista do advogado", async () => {
    semearPar();
    const token = cell.fake.criarToken({ uid: "c1", role: "cliente" });
    const resposta = await request(app)
      .post("/conversas/a1/mensagens")
      .set("Authorization", `Bearer ${token}`)
      .send({ texto: "Estou ocupado esse mês, mas posso te atender em breve." });
    expect(resposta.status).toBe(400);
  });

  it("cliente envia mensagem válida, vinculada aos dois uids certos", async () => {
    semearPar();
    const token = cell.fake.criarToken({ uid: "c1", role: "cliente" });
    const resposta = await request(app)
      .post("/conversas/a1/mensagens")
      .set("Authorization", `Bearer ${token}`)
      .send({ texto: "Olá!" });

    expect(resposta.status).toBe(201);
    expect(resposta.body).toMatchObject({
      clienteId: "c1",
      advogadoId: "a1",
      remetente: "cliente",
      texto: "Olá!",
    });
  });

  it("mensagem de área usa a área de atuação do advogado de verdade", async () => {
    semearPar();
    const token = cell.fake.criarToken({ uid: "c1", role: "cliente" });
    const resposta = await request(app)
      .post("/conversas/a1/mensagens")
      .set("Authorization", `Bearer ${token}`)
      .send({ texto: "Tenho uma questão trabalhista e preciso de ajuda." });
    expect(resposta.status).toBe(201);
  });

  it("advogado responde com mensagem válida da própria lista", async () => {
    semearPar();
    const token = cell.fake.criarToken({ uid: "a1", role: "advogado" });
    const resposta = await request(app)
      .post("/conversas/c1/mensagens")
      .set("Authorization", `Bearer ${token}`)
      .send({ texto: "Estou ocupado esse mês, mas posso te atender em breve." });

    expect(resposta.status).toBe(201);
    expect(resposta.body).toMatchObject({ clienteId: "c1", advogadoId: "a1", remetente: "advogado" });
  });
});

describe("GET /conversas/:comUid/mensagens", () => {
  it("recusa sem token", async () => {
    const resposta = await request(app).get("/conversas/a1/mensagens");
    expect(resposta.status).toBe(401);
  });

  it("retorna a conversa em ordem cronológica, das duas pontas", async () => {
    semearPar();
    cell.fake.db._seed("mensagensChat", "m1", {
      conversaId: "c1_a1",
      clienteId: "c1",
      advogadoId: "a1",
      remetente: "cliente",
      texto: "Olá!",
      createdAt: "2026-08-18T10:00:00.000Z",
    });
    cell.fake.db._seed("mensagensChat", "m2", {
      conversaId: "c1_a1",
      clienteId: "c1",
      advogadoId: "a1",
      remetente: "advogado",
      texto: "Vamos conversar por WhatsApp?",
      createdAt: "2026-08-18T10:05:00.000Z",
    });
    cell.fake.db._seed("mensagensChat", "m3", {
      conversaId: "outro_a1",
      clienteId: "outro",
      advogadoId: "a1",
      remetente: "cliente",
      texto: "Oi, tudo bem?",
      createdAt: "2026-08-18T09:00:00.000Z",
    });

    const token = cell.fake.criarToken({ uid: "c1", role: "cliente" });
    const resposta = await request(app).get("/conversas/a1/mensagens").set("Authorization", `Bearer ${token}`);

    expect(resposta.status).toBe(200);
    expect(resposta.body.map((m) => m.id)).toEqual(["m1", "m2"]);
  });
});

describe("GET /conversas/minhas", () => {
  it("traz só a última mensagem de cada conversa do usuário logado", async () => {
    semearPar();
    cell.fake.db._seed("mensagensChat", "m1", {
      conversaId: "c1_a1",
      clienteId: "c1",
      advogadoId: "a1",
      remetente: "cliente",
      texto: "Olá!",
      createdAt: "2026-08-18T10:00:00.000Z",
    });
    cell.fake.db._seed("mensagensChat", "m2", {
      conversaId: "c1_a1",
      clienteId: "c1",
      advogadoId: "a1",
      remetente: "advogado",
      texto: "Vamos conversar por WhatsApp?",
      createdAt: "2026-08-18T10:05:00.000Z",
    });

    const token = cell.fake.criarToken({ uid: "a1", role: "advogado" });
    const resposta = await request(app).get("/conversas/minhas").set("Authorization", `Bearer ${token}`);

    expect(resposta.status).toBe(200);
    expect(resposta.body).toHaveLength(1);
    expect(resposta.body[0]).toMatchObject({
      comUid: "c1",
      nome: "Cliente Um",
      ultimaMensagem: "Vamos conversar por WhatsApp?",
      ultimoRemetente: "advogado",
    });
  });
});
