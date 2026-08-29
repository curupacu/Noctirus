import { beforeEach, describe, expect, it, vi } from "vitest";

const cell = vi.hoisted(() => ({ fake: null }));
const enviarEmailMock = vi.fn().mockResolvedValue({ enviado: true });

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

function semearPar() {
  cell.fake.db._seed("users", "c1", { nome: "Cliente Um", role: "cliente", email: "cliente-um@example.com" });
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

  it("cliente consegue responder sim/não a uma pergunta do advogado", async () => {
    semearPar();
    const token = cell.fake.criarToken({ uid: "c1", role: "cliente" });
    const resposta = await request(app)
      .post("/conversas/a1/mensagens")
      .set("Authorization", `Bearer ${token}`)
      .send({ texto: "Sim, pode ser!" });
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

  it("advogado também consegue responder sim/não rápido", async () => {
    semearPar();
    const token = cell.fake.criarToken({ uid: "a1", role: "advogado" });
    const resposta = await request(app)
      .post("/conversas/c1/mensagens")
      .set("Authorization", `Bearer ${token}`)
      .send({ texto: "Combinado!" });
    expect(resposta.status).toBe(201);
  });

  it("cliente manda triagemId válido e a mensagem fica vinculada à triagem", async () => {
    semearPar();
    cell.fake.db._seed("triagens", "t1", { clienteId: "c1", areaClassificada: "trabalhista" });
    const token = cell.fake.criarToken({ uid: "c1", role: "cliente" });
    const resposta = await request(app)
      .post("/conversas/a1/mensagens")
      .set("Authorization", `Bearer ${token}`)
      .send({ texto: "Olá!", triagemId: "t1" });

    expect(resposta.status).toBe(201);
    expect(resposta.body.triagemId).toBe("t1");
  });

  it("ignora triagemId de outro cliente (não deixa vincular triagem alheia)", async () => {
    semearPar();
    cell.fake.db._seed("triagens", "t1", { clienteId: "outro-cliente", areaClassificada: "trabalhista" });
    const token = cell.fake.criarToken({ uid: "c1", role: "cliente" });
    const resposta = await request(app)
      .post("/conversas/a1/mensagens")
      .set("Authorization", `Bearer ${token}`)
      .send({ texto: "Olá!", triagemId: "t1" });

    expect(resposta.status).toBe(201);
    expect(resposta.body.triagemId).toBeUndefined();
  });

  it("ignora triagemId inexistente sem derrubar o envio", async () => {
    semearPar();
    const token = cell.fake.criarToken({ uid: "c1", role: "cliente" });
    const resposta = await request(app)
      .post("/conversas/a1/mensagens")
      .set("Authorization", `Bearer ${token}`)
      .send({ texto: "Olá!", triagemId: "nao-existe" });

    expect(resposta.status).toBe(201);
    expect(resposta.body.triagemId).toBeUndefined();
  });
});

describe("notificação por e-mail quando o advogado responde", () => {
  it("advogado responde pela primeira vez → notifica o cliente por e-mail", async () => {
    semearPar();
    const token = cell.fake.criarToken({ uid: "a1", role: "advogado" });
    const resposta = await request(app)
      .post("/conversas/c1/mensagens")
      .set("Authorization", `Bearer ${token}`)
      .send({ texto: "Combinado!" });

    expect(resposta.status).toBe(201);
    expect(enviarEmailMock).toHaveBeenCalledTimes(1);
    expect(enviarEmailMock).toHaveBeenCalledWith(
      expect.objectContaining({ to: "cliente-um@example.com", subject: expect.stringContaining("Advogado Um") }),
    );
  });

  it("cliente enviando mensagem nunca dispara notificação (só resposta do advogado notifica)", async () => {
    semearPar();
    const token = cell.fake.criarToken({ uid: "c1", role: "cliente" });
    const resposta = await request(app)
      .post("/conversas/a1/mensagens")
      .set("Authorization", `Bearer ${token}`)
      .send({ texto: "Olá!" });

    expect(resposta.status).toBe(201);
    expect(enviarEmailMock).not.toHaveBeenCalled();
  });

  it("advogado manda várias mensagens seguidas sem o cliente responder → notifica só a primeira", async () => {
    semearPar();
    const token = cell.fake.criarToken({ uid: "a1", role: "advogado" });

    await request(app)
      .post("/conversas/c1/mensagens")
      .set("Authorization", `Bearer ${token}`)
      .send({ texto: "Combinado!" });
    await request(app)
      .post("/conversas/c1/mensagens")
      .set("Authorization", `Bearer ${token}`)
      .send({ texto: "Sim, sem problema." });

    expect(enviarEmailMock).toHaveBeenCalledTimes(1);
  });

  it("cliente responde depois do advogado → próxima resposta do advogado notifica de novo", async () => {
    semearPar();
    const tokenAdvogado = cell.fake.criarToken({ uid: "a1", role: "advogado" });
    const tokenCliente = cell.fake.criarToken({ uid: "c1", role: "cliente" });

    await request(app)
      .post("/conversas/c1/mensagens")
      .set("Authorization", `Bearer ${tokenAdvogado}`)
      .send({ texto: "Combinado!" });
    await request(app)
      .post("/conversas/a1/mensagens")
      .set("Authorization", `Bearer ${tokenCliente}`)
      .send({ texto: "Sim, pode ser!" });
    await request(app)
      .post("/conversas/c1/mensagens")
      .set("Authorization", `Bearer ${tokenAdvogado}`)
      .send({ texto: "Sim, sem problema." });

    expect(enviarEmailMock).toHaveBeenCalledTimes(2);
  });

  it("cliente sem e-mail cadastrado → não quebra o envio da mensagem, só não notifica", async () => {
    cell.fake.db._seed("users", "c1", { nome: "Cliente Sem Email", role: "cliente" });
    cell.fake.db._seed("users", "a1", { nome: "Advogado Um", role: "advogado" });
    cell.fake.db._seed("advogados", "a1", { areasAtuacao: ["trabalhista"] });

    const token = cell.fake.criarToken({ uid: "a1", role: "advogado" });
    const resposta = await request(app)
      .post("/conversas/c1/mensagens")
      .set("Authorization", `Bearer ${token}`)
      .send({ texto: "Combinado!" });

    expect(resposta.status).toBe(201);
    expect(enviarEmailMock).not.toHaveBeenCalled();
  });

  it("falha no envio do e-mail não derruba a resposta da rota", async () => {
    semearPar();
    enviarEmailMock.mockRejectedValueOnce(new Error("falha de rede"));
    const token = cell.fake.criarToken({ uid: "a1", role: "advogado" });
    const resposta = await request(app)
      .post("/conversas/c1/mensagens")
      .set("Authorization", `Bearer ${token}`)
      .send({ texto: "Combinado!" });

    expect(resposta.status).toBe(201);
  });
});

describe("notificação em tempo real (sininho) quando alguém manda mensagem", () => {
  it("cliente manda mensagem → notifica o advogado", async () => {
    semearPar();
    const token = cell.fake.criarToken({ uid: "c1", role: "cliente" });
    await request(app)
      .post("/conversas/a1/mensagens")
      .set("Authorization", `Bearer ${token}`)
      .send({ texto: "Olá!" });

    const snapshot = await cell.fake.db.collection("notificacoes").get();
    expect(snapshot.docs).toHaveLength(1);
    expect(snapshot.docs[0].data()).toMatchObject({
      destinatarioId: "a1",
      tipo: "nova_mensagem",
      texto: "Cliente Um: Olá!",
      link: "/conversas/c1",
      lida: false,
    });
  });

  it("advogado responde → notifica o cliente", async () => {
    semearPar();
    const token = cell.fake.criarToken({ uid: "a1", role: "advogado" });
    await request(app)
      .post("/conversas/c1/mensagens")
      .set("Authorization", `Bearer ${token}`)
      .send({ texto: "Combinado!" });

    const snapshot = await cell.fake.db.collection("notificacoes").get();
    expect(snapshot.docs).toHaveLength(1);
    expect(snapshot.docs[0].data()).toMatchObject({
      destinatarioId: "c1",
      tipo: "nova_mensagem",
      texto: "Advogado Um: Combinado!",
      link: "/advogados/a1/contato",
    });
  });
});

describe("GET /conversas/:comUid/triagem", () => {
  it("recusa sem token", async () => {
    const resposta = await request(app).get("/conversas/c1/triagem");
    expect(resposta.status).toBe(401);
  });

  it("recusa cliente (só advogado vê o contexto da triagem)", async () => {
    const token = cell.fake.criarToken({ uid: "c1", role: "cliente" });
    const resposta = await request(app).get("/conversas/a1/triagem").set("Authorization", `Bearer ${token}`);
    expect(resposta.status).toBe(403);
  });

  it("retorna null quando não há triagem vinculada", async () => {
    semearPar();
    const token = cell.fake.criarToken({ uid: "a1", role: "advogado" });
    const resposta = await request(app).get("/conversas/c1/triagem").set("Authorization", `Bearer ${token}`);
    expect(resposta.status).toBe(200);
    expect(resposta.body).toBeNull();
  });

  it("retorna null quando a triagem existe mas o cliente não deu opt-in", async () => {
    semearPar();
    cell.fake.db._seed("triagens", "t1", {
      clienteId: "c1",
      areaClassificada: "trabalhista",
      descricao: "Descrição sensível do caso",
      compartilharComAdvogado: false,
    });
    cell.fake.db._seed("mensagensChat", "m1", {
      conversaId: "c1_a1",
      clienteId: "c1",
      advogadoId: "a1",
      remetente: "cliente",
      texto: "Olá!",
      triagemId: "t1",
      createdAt: "2026-08-18T10:00:00.000Z",
    });

    const token = cell.fake.criarToken({ uid: "a1", role: "advogado" });
    const resposta = await request(app).get("/conversas/c1/triagem").set("Authorization", `Bearer ${token}`);
    expect(resposta.status).toBe(200);
    expect(resposta.body).toBeNull();
  });

  it("retorna área e descrição quando o cliente deu opt-in", async () => {
    semearPar();
    cell.fake.db._seed("triagens", "t1", {
      clienteId: "c1",
      areaClassificada: "trabalhista",
      descricao: "Fui demitido sem justa causa",
      compartilharComAdvogado: true,
    });
    cell.fake.db._seed("mensagensChat", "m1", {
      conversaId: "c1_a1",
      clienteId: "c1",
      advogadoId: "a1",
      remetente: "cliente",
      texto: "Olá!",
      triagemId: "t1",
      createdAt: "2026-08-18T10:00:00.000Z",
    });

    const token = cell.fake.criarToken({ uid: "a1", role: "advogado" });
    const resposta = await request(app).get("/conversas/c1/triagem").set("Authorization", `Bearer ${token}`);
    expect(resposta.status).toBe(200);
    expect(resposta.body).toMatchObject({
      areaClassificada: "trabalhista",
      descricao: "Fui demitido sem justa causa",
    });
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

  it("resolve a foto do outro lado na coleção certa por papel", async () => {
    // Foto de advogado mora em "advogados" (pública); foto de cliente mora no próprio
    // doc de "users" — são coleções diferentes, então tem que resolver direito nos dois
    // sentidos da mesma conversa, não só num deles.
    semearPar();
    cell.fake.db._seed("advogados", "a1", { areasAtuacao: ["trabalhista"], foto: "https://foto-advogado.jpg" });
    cell.fake.db._seed("users", "c1", {
      nome: "Cliente Um",
      role: "cliente",
      email: "cliente-um@example.com",
      foto: "https://foto-cliente.jpg",
    });
    cell.fake.db._seed("mensagensChat", "m1", {
      conversaId: "c1_a1",
      clienteId: "c1",
      advogadoId: "a1",
      remetente: "cliente",
      texto: "Olá!",
      createdAt: "2026-08-18T10:00:00.000Z",
    });

    const tokenAdvogado = cell.fake.criarToken({ uid: "a1", role: "advogado" });
    const comoAdvogado = await request(app)
      .get("/conversas/minhas")
      .set("Authorization", `Bearer ${tokenAdvogado}`);
    expect(comoAdvogado.body[0].foto).toBe("https://foto-cliente.jpg");

    const tokenCliente = cell.fake.criarToken({ uid: "c1", role: "cliente" });
    const comoCliente = await request(app)
      .get("/conversas/minhas")
      .set("Authorization", `Bearer ${tokenCliente}`);
    expect(comoCliente.body[0].foto).toBe("https://foto-advogado.jpg");
  });
});
