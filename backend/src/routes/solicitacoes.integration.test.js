import { beforeEach, describe, expect, it, vi } from "vitest";

const cell = vi.hoisted(() => ({ fake: null }));
const enviarEmailMock = vi.hoisted(() => vi.fn().mockResolvedValue({ enviado: true }));

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

const CONTATOS = { whatsapp: "11988887777", email: "adv@example.com" };

beforeEach(() => {
  cell.fake = criarFakeFirebase();
  enviarEmailMock.mockClear();
  cell.fake.db._seed("users", "c1", { role: "cliente", nome: "Cliente Um", email: "c1@example.com" });
  cell.fake.db._seed("users", "a1", { role: "advogado", nome: "Dra. Ana", email: "a1@example.com" });
  cell.fake.db._seed("advogados", "a1", { situacaoOab: "aprovado", contatos: CONTATOS, foto: null });
  cell.fake.db._seed("triagens", "t1", {
    clienteId: "c1",
    areaClassificada: "trabalhista",
    especialidade: "horas_extras",
    categorias: ["horas_extras"],
    descricao: "O que aconteceu? Não pagam minhas horas extras.",
  });
});

const token = (uid, role) => cell.fake.criarToken({ uid, role });

function pedir(corpo, uid = "c1") {
  return request(app)
    .post("/solicitacoes")
    .set("Authorization", `Bearer ${token(uid, "cliente")}`)
    .send({ advogadoId: "a1", triagemId: "t1", autorizaCompartilhar: true, ...corpo });
}

function responder(id, acao, uid = "a1") {
  return request(app)
    .patch(`/solicitacoes/${id}`)
    .set("Authorization", `Bearer ${token(uid, "advogado")}`)
    .send({ acao });
}

async function notificacoesDe(uid) {
  const snap = await cell.fake.db.collection("notificacoes").where("destinatarioId", "==", uid).get();
  return snap.docs.map((d) => d.data());
}

describe("POST /solicitacoes (RF010)", () => {
  it("só cliente pode pedir contato", async () => {
    const resposta = await request(app)
      .post("/solicitacoes")
      .set("Authorization", `Bearer ${token("a1", "advogado")}`)
      .send({ advogadoId: "a1", triagemId: "t1", autorizaCompartilhar: true });
    expect(resposta.status).toBe(403);
  });

  it("exige a autorização pra enviar as respostas da triagem", async () => {
    expect((await pedir({ autorizaCompartilhar: false })).status).toBe(400);
    expect((await pedir({ autorizaCompartilhar: undefined })).status).toBe(400);
  });

  it("recusa advogado sem OAB aprovada", async () => {
    cell.fake.db._seed("advogados", "a2", { situacaoOab: "em_analise" });
    expect((await pedir({ advogadoId: "a2" })).status).toBe(404);
  });

  it("recusa triagem de outro cliente", async () => {
    cell.fake.db._seed("triagens", "t2", { clienteId: "outro", areaClassificada: "civel" });
    expect((await pedir({ triagemId: "t2" })).status).toBe(404);
  });

  it("registra na hora, guarda a cópia do caso autorizado e avisa o advogado", async () => {
    const resposta = await pedir();

    expect(resposta.status).toBe(201);
    expect(resposta.body).toMatchObject({
      clienteId: "c1",
      advogadoId: "a1",
      triagemId: "t1",
      area: "trabalhista",
      especialidade: "horas_extras",
      descricao: "O que aconteceu? Não pagam minhas horas extras.",
      situacao: "pendente",
    });
    expect(resposta.body.autorizouCompartilharEm).toEqual(expect.any(String));

    const avisos = await notificacoesDe("a1");
    expect(avisos).toHaveLength(1);
    expect(avisos[0]).toMatchObject({ tipo: "solicitacao_nova", link: "/solicitacoes" });
    expect(enviarEmailMock).toHaveBeenCalledWith(expect.objectContaining({ to: "a1@example.com" }));
  });

  it("não deixa repetir o pedido enquanto está pendente ou depois de aceito", async () => {
    const primeiro = await pedir();
    const repetido = await pedir();
    expect(repetido.status).toBe(409);
    expect(repetido.body.id).toBe(primeiro.body.id);

    await responder(primeiro.body.id, "aceitar");
    expect((await pedir()).status).toBe(409);
  });

  it("depois de uma recusa, pode pedir de novo", async () => {
    const primeiro = await pedir();
    await responder(primeiro.body.id, "recusar");
    expect((await pedir()).status).toBe(201);
  });

  it("o pedido vale mesmo se o e-mail falhar", async () => {
    enviarEmailMock.mockRejectedValueOnce(new Error("Resend fora do ar"));
    expect((await pedir()).status).toBe(201);
  });
});

describe("PATCH /solicitacoes/:id (RF013)", () => {
  it("só o advogado do pedido responde", async () => {
    const { body } = await pedir();
    cell.fake.db._seed("users", "a2", { role: "advogado", nome: "Outro" });
    expect((await responder(body.id, "aceitar", "a2")).status).toBe(404);
  });

  it("recusa ação inválida", async () => {
    const { body } = await pedir();
    expect((await responder(body.id, "talvez")).status).toBe(400);
  });

  it("aceita, registra a data e avisa o cliente", async () => {
    const { body } = await pedir();
    const resposta = await responder(body.id, "aceitar");

    expect(resposta.status).toBe(200);
    const salvo = (await cell.fake.db.collection("solicitacoes").doc(body.id).get()).data();
    expect(salvo.situacao).toBe("aceita");
    expect(salvo.respondidaEm).toEqual(expect.any(String));

    const avisos = await notificacoesDe("c1");
    expect(avisos[0]).toMatchObject({ tipo: "solicitacao_aceita", link: "/minhas-solicitacoes" });
    expect(avisos[0].texto).toContain("Dra. Ana");
  });

  it("recusa e também avisa o cliente", async () => {
    const { body } = await pedir();
    await responder(body.id, "recusar");
    const avisos = await notificacoesDe("c1");
    expect(avisos[0].tipo).toBe("solicitacao_recusada");
  });

  it("não deixa responder duas vezes", async () => {
    const { body } = await pedir();
    await responder(body.id, "aceitar");
    expect((await responder(body.id, "recusar")).status).toBe(409);
  });
});

describe("GET /solicitacoes/minhas (RF014)", () => {
  it("lista os pedidos do cliente com advogado, data e situação, mais recente primeiro", async () => {
    cell.fake.db._seed("solicitacoes", "antiga", {
      clienteId: "c1",
      advogadoId: "a1",
      situacao: "recusada",
      area: "civel",
      createdAt: "2026-10-01T00:00:00.000Z",
    });
    await pedir();

    const resposta = await request(app)
      .get("/solicitacoes/minhas")
      .set("Authorization", `Bearer ${token("c1", "cliente")}`);

    expect(resposta.status).toBe(200);
    expect(resposta.body.map((s) => s.situacao)).toEqual(["pendente", "recusada"]);
    expect(resposta.body[0]).toMatchObject({ advogadoId: "a1", advogadoNome: "Dra. Ana" });
  });

  it("WhatsApp/e-mail do advogado só aparecem depois do aceite", async () => {
    const { body } = await pedir();
    const ver = () =>
      request(app).get("/solicitacoes/minhas").set("Authorization", `Bearer ${token("c1", "cliente")}`);

    expect((await ver()).body[0].contatos).toBeNull();
    await responder(body.id, "aceitar");
    expect((await ver()).body[0].contatos).toEqual(CONTATOS);
  });

  it("não mostra pedido de outro cliente", async () => {
    cell.fake.db._seed("solicitacoes", "s9", { clienteId: "outro", advogadoId: "a1", createdAt: "x" });
    const resposta = await request(app)
      .get("/solicitacoes/minhas")
      .set("Authorization", `Bearer ${token("c1", "cliente")}`);
    expect(resposta.body).toEqual([]);
  });
});

describe("GET /solicitacoes/recebidas", () => {
  it("o advogado vê o caso autorizado, mas o nome do cliente só depois de aceitar", async () => {
    const { body } = await pedir();
    const ver = () =>
      request(app).get("/solicitacoes/recebidas").set("Authorization", `Bearer ${token("a1", "advogado")}`);

    const antes = (await ver()).body[0];
    expect(antes).toMatchObject({ area: "trabalhista", descricao: expect.stringContaining("horas extras") });
    expect(antes.clienteNome).toBeNull();

    await responder(body.id, "aceitar");
    expect((await ver()).body[0].clienteNome).toBe("Cliente Um");
  });

  it("só cliente não pode ver a lista do advogado", async () => {
    const resposta = await request(app)
      .get("/solicitacoes/recebidas")
      .set("Authorization", `Bearer ${token("c1", "cliente")}`);
    expect(resposta.status).toBe(403);
  });
});
