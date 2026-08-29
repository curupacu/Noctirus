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

describe("POST /denuncias", () => {
  it("recusa sem token", async () => {
    const resposta = await request(app).post("/denuncias").send({ descricao: "problema grave o bastante" });
    expect(resposta.status).toBe(401);
  });

  it("recusa admin denunciando (papel não permitido)", async () => {
    const token = cell.fake.criarToken({ uid: "adm1", role: "admin" });
    const resposta = await request(app)
      .post("/denuncias")
      .set("Authorization", `Bearer ${token}`)
      .send({ descricao: "problema grave o bastante" });
    expect(resposta.status).toBe(403);
  });

  it("recusa descrição com menos de 10 caracteres", async () => {
    const token = cell.fake.criarToken({ uid: "c1", role: "cliente" });
    const resposta = await request(app)
      .post("/denuncias")
      .set("Authorization", `Bearer ${token}`)
      .send({ descricao: "curta" });
    expect(resposta.status).toBe(400);
  });

  // O frontend (AdminDenunciasPage) renderiza provaUrl direto num <a href> — sem validar
  // o protocolo, um valor "javascript:..." executava no navegador do admin ao clicar.
  it("recusa provaUrl que não seja um link http(s)", async () => {
    const token = cell.fake.criarToken({ uid: "c1", role: "cliente" });
    const resposta = await request(app)
      .post("/denuncias")
      .set("Authorization", `Bearer ${token}`)
      .send({
        descricao: "Cobrou por um serviço que nunca prestou.",
        provaUrl: "javascript:alert(document.cookie)",
      });
    expect(resposta.status).toBe(400);
  });

  it("aceita provaUrl http(s) válida", async () => {
    const token = cell.fake.criarToken({ uid: "c1", role: "cliente" });
    const resposta = await request(app)
      .post("/denuncias")
      .set("Authorization", `Bearer ${token}`)
      .send({
        descricao: "Cobrou por um serviço que nunca prestou.",
        provaUrl: "https://exemplo.com/print.png",
      });
    expect(resposta.status).toBe(201);
    expect(resposta.body.provaUrl).toBe("https://exemplo.com/print.png");
  });

  it("registra a denúncia vinculada ao autor logado", async () => {
    const token = cell.fake.criarToken({ uid: "c1", role: "cliente" });
    const resposta = await request(app)
      .post("/denuncias")
      .set("Authorization", `Bearer ${token}`)
      .send({ alvoId: "a1", descricao: "Cobrou por um serviço que nunca prestou." });

    expect(resposta.status).toBe(201);
    expect(resposta.body.autorId).toBe("c1");
    expect(resposta.body.autorTipo).toBe("cliente");
    expect(resposta.body.status).toBe("aberta");

    const denuncia = (await cell.fake.db.collection("denuncias").doc(resposta.body.id).get()).data();
    expect(denuncia.alvoId).toBe("a1");
  });
});

describe("GET /denuncias/minhas", () => {
  it("recusa sem token", async () => {
    const resposta = await request(app).get("/denuncias/minhas");
    expect(resposta.status).toBe(401);
  });

  it("retorna só as denúncias do próprio autor, mais recentes primeiro", async () => {
    cell.fake.db._seed("denuncias", "d1", { autorId: "c1", createdAt: "2026-01-01T00:00:00.000Z" });
    cell.fake.db._seed("denuncias", "d2", { autorId: "c1", createdAt: "2026-01-02T00:00:00.000Z" });
    cell.fake.db._seed("denuncias", "d3", { autorId: "outro", createdAt: "2026-01-03T00:00:00.000Z" });
    const token = cell.fake.criarToken({ uid: "c1", role: "cliente" });
    const resposta = await request(app).get("/denuncias/minhas").set("Authorization", `Bearer ${token}`);
    expect(resposta.status).toBe(200);
    expect(resposta.body.map((d) => d.id)).toEqual(["d2", "d1"]);
  });
});

describe("GET /admin/denuncias", () => {
  it("recusa quem não é admin", async () => {
    const token = cell.fake.criarToken({ uid: "c1", role: "cliente" });
    const resposta = await request(app).get("/admin/denuncias").set("Authorization", `Bearer ${token}`);
    expect(resposta.status).toBe(403);
  });

  it("resolve nome/status do autor e do alvo", async () => {
    cell.fake.db._seed("denuncias", "d1", {
      autorId: "c1",
      alvoId: "a1",
      status: "aberta",
      createdAt: "2026-01-01T00:00:00.000Z",
    });
    cell.fake.db._seed("users", "c1", { nome: "Cliente Autor" });
    cell.fake.db._seed("users", "a1", { nome: "Advogado Alvo", status: "suspenso", role: "advogado" });

    const token = cell.fake.criarToken({ uid: "adm1", role: "admin" });
    const resposta = await request(app).get("/admin/denuncias").set("Authorization", `Bearer ${token}`);

    expect(resposta.status).toBe(200);
    expect(resposta.body[0]).toMatchObject({
      autorNome: "Cliente Autor",
      alvoNome: "Advogado Alvo",
      alvoStatus: "suspenso",
      alvoTipo: "advogado",
    });
  });
});

describe("PATCH /admin/denuncias/:id", () => {
  it("recusa status inválido", async () => {
    cell.fake.db._seed("denuncias", "d1", { status: "aberta" });
    const token = cell.fake.criarToken({ uid: "adm1", role: "admin" });
    const resposta = await request(app)
      .patch("/admin/denuncias/d1")
      .set("Authorization", `Bearer ${token}`)
      .send({ status: "invalido" });
    expect(resposta.status).toBe(400);
  });

  it("recusa corpo sem nenhum campo", async () => {
    cell.fake.db._seed("denuncias", "d1", { status: "aberta" });
    const token = cell.fake.criarToken({ uid: "adm1", role: "admin" });
    const resposta = await request(app)
      .patch("/admin/denuncias/d1")
      .set("Authorization", `Bearer ${token}`)
      .send({});
    expect(resposta.status).toBe(400);
  });

  it("marca como resolvida com a decisão registrada", async () => {
    cell.fake.db._seed("denuncias", "d1", { status: "aberta" });
    const token = cell.fake.criarToken({ uid: "adm1", role: "admin" });
    const resposta = await request(app)
      .patch("/admin/denuncias/d1")
      .set("Authorization", `Bearer ${token}`)
      .send({ status: "resolvida", decisao: "Denúncia procedente." });

    expect(resposta.status).toBe(200);
    const denuncia = (await cell.fake.db.collection("denuncias").doc("d1").get()).data();
    expect(denuncia.status).toBe("resolvida");
    expect(denuncia.decisao).toBe("Denúncia procedente.");
  });

  it("resolver notifica o autor (sininho), mas marcar em análise não notifica", async () => {
    cell.fake.db._seed("denuncias", "d1", { status: "aberta", autorId: "c1" });
    const token = cell.fake.criarToken({ uid: "adm1", role: "admin" });

    await request(app)
      .patch("/admin/denuncias/d1")
      .set("Authorization", `Bearer ${token}`)
      .send({ status: "em_analise" });
    expect((await cell.fake.db.collection("notificacoes").get()).docs).toHaveLength(0);

    await request(app)
      .patch("/admin/denuncias/d1")
      .set("Authorization", `Bearer ${token}`)
      .send({ status: "resolvida" });

    const snapshot = await cell.fake.db.collection("notificacoes").get();
    expect(snapshot.docs).toHaveLength(1);
    expect(snapshot.docs[0].data()).toMatchObject({
      destinatarioId: "c1",
      tipo: "denuncia_resolvida",
      link: "/minhas-denuncias",
    });
  });
});
