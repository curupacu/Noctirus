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

describe("GET /contatos/meus", () => {
  it("recusa sem token", async () => {
    const resposta = await request(app).get("/contatos/meus");
    expect(resposta.status).toBe(401);
  });

  it("recusa quem não é cliente", async () => {
    const token = cell.fake.criarToken({ uid: "a1", role: "advogado" });
    const resposta = await request(app).get("/contatos/meus").set("Authorization", `Bearer ${token}`);
    expect(resposta.status).toBe(403);
  });

  it("retorna só os contatos do próprio cliente, com nome/foto do advogado resolvidos", async () => {
    cell.fake.db._seed("contatosCliente", "c1_a1", {
      clienteId: "c1",
      advogadoId: "a1",
      status: "Chamei no WhatsApp",
      ultimoContatoEm: "2026-08-01T00:00:00.000Z",
    });
    cell.fake.db._seed("contatosCliente", "c1_a2", {
      clienteId: "c1",
      advogadoId: "a2",
      status: null,
      ultimoContatoEm: "2026-08-02T00:00:00.000Z",
    });
    cell.fake.db._seed("contatosCliente", "outro_a1", {
      clienteId: "outro",
      advogadoId: "a1",
      ultimoContatoEm: "2026-08-03T00:00:00.000Z",
    });
    cell.fake.db._seed("users", "a1", { nome: "Advogada Um", status: "ativo" });
    cell.fake.db._seed("advogados", "a1", { foto: "https://foto/a1.jpg" });
    cell.fake.db._seed("users", "a2", { nome: "Advogado Dois", status: "suspenso" });

    const token = cell.fake.criarToken({ uid: "c1", role: "cliente" });
    const resposta = await request(app).get("/contatos/meus").set("Authorization", `Bearer ${token}`);

    expect(resposta.status).toBe(200);
    expect(resposta.body).toHaveLength(2);
    // Mais recente primeiro.
    expect(resposta.body[0]).toMatchObject({
      advogadoId: "a2",
      advogadoNome: "Advogado Dois",
      advogadoSuspenso: true,
    });
    expect(resposta.body[1]).toMatchObject({
      advogadoId: "a1",
      advogadoNome: "Advogada Um",
      advogadoFoto: "https://foto/a1.jpg",
      status: "Chamei no WhatsApp",
      advogadoSuspenso: false,
    });
  });
});

describe("PATCH /contatos/meus/:advogadoId", () => {
  it("recusa status fora da lista pré-pronta", async () => {
    cell.fake.db._seed("contatosCliente", "c1_a1", { clienteId: "c1", advogadoId: "a1" });
    const token = cell.fake.criarToken({ uid: "c1", role: "cliente" });
    const resposta = await request(app)
      .patch("/contatos/meus/a1")
      .set("Authorization", `Bearer ${token}`)
      .send({ status: "qualquer coisa" });
    expect(resposta.status).toBe(400);
  });

  it("404 quando o cliente nunca contatou esse advogado", async () => {
    const token = cell.fake.criarToken({ uid: "c1", role: "cliente" });
    const resposta = await request(app)
      .patch("/contatos/meus/nunca-contatado")
      .set("Authorization", `Bearer ${token}`)
      .send({ status: "Aguardando resposta" });
    expect(resposta.status).toBe(404);
  });

  it("atualiza o status marcado pelo cliente", async () => {
    cell.fake.db._seed("contatosCliente", "c1_a1", { clienteId: "c1", advogadoId: "a1", status: null });
    const token = cell.fake.criarToken({ uid: "c1", role: "cliente" });
    const resposta = await request(app)
      .patch("/contatos/meus/a1")
      .set("Authorization", `Bearer ${token}`)
      .send({ status: "Já conversamos" });

    expect(resposta.status).toBe(200);
    const doc = await cell.fake.db.collection("contatosCliente").doc("c1_a1").get();
    expect(doc.data().status).toBe("Já conversamos");
  });

  it("aceita status null pra limpar a etiqueta", async () => {
    cell.fake.db._seed("contatosCliente", "c1_a1", { clienteId: "c1", advogadoId: "a1", status: "Mandei e-mail" });
    const token = cell.fake.criarToken({ uid: "c1", role: "cliente" });
    const resposta = await request(app)
      .patch("/contatos/meus/a1")
      .set("Authorization", `Bearer ${token}`)
      .send({ status: null });

    expect(resposta.status).toBe(200);
    const doc = await cell.fake.db.collection("contatosCliente").doc("c1_a1").get();
    expect(doc.data().status).toBeNull();
  });

  it("não deixa um cliente mexer no contato de outro", async () => {
    cell.fake.db._seed("contatosCliente", "outro_a1", { clienteId: "outro", advogadoId: "a1" });
    const token = cell.fake.criarToken({ uid: "c1", role: "cliente" });
    const resposta = await request(app)
      .patch("/contatos/meus/a1")
      .set("Authorization", `Bearer ${token}`)
      .send({ status: "Já conversamos" });
    expect(resposta.status).toBe(404);
  });
});

describe("DELETE /contatos/meus/:advogadoId", () => {
  it("remove só o rastreio do cliente, sem tocar no log de contatos usado nas métricas", async () => {
    cell.fake.db._seed("contatosCliente", "c1_a1", { clienteId: "c1", advogadoId: "a1" });
    cell.fake.db._seed("contatos", "x1", { advogadoId: "a1", canal: "whatsapp" });

    const token = cell.fake.criarToken({ uid: "c1", role: "cliente" });
    const resposta = await request(app).delete("/contatos/meus/a1").set("Authorization", `Bearer ${token}`);

    expect(resposta.status).toBe(200);
    const doc = await cell.fake.db.collection("contatosCliente").doc("c1_a1").get();
    expect(doc.exists).toBe(false);
    const contatoOriginal = await cell.fake.db.collection("contatos").doc("x1").get();
    expect(contatoOriginal.exists).toBe(true);
  });

  it("404 quando não existe esse rastreio", async () => {
    const token = cell.fake.criarToken({ uid: "c1", role: "cliente" });
    const resposta = await request(app).delete("/contatos/meus/a1").set("Authorization", `Bearer ${token}`);
    expect(resposta.status).toBe(404);
  });
});
