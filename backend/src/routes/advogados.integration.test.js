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

// Fake do Cloudinary — os testes não devem depender de rede nem gastar cota de
// verdade. `upload_stream` chama o callback com uma URL fixa assim que o stream
// termina, imitando o formato de resposta real (secure_url).
const URL_FOTO_FAKE = "https://res.cloudinary.com/fake/image/upload/fake.jpg";
vi.mock("../lib/cloudinary.js", () => ({
  cloudinary: {
    uploader: {
      upload_stream: (_opcoes, callback) => ({
        end: () => callback(null, { secure_url: URL_FOTO_FAKE }),
      }),
    },
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

describe("POST /advogados/:uid/foto", () => {
  it("recusa sem token", async () => {
    const resposta = await request(app).post("/advogados/a1/foto");
    expect(resposta.status).toBe(401);
  });

  it("recusa editar foto de outro advogado", async () => {
    semear("a1");
    const token = cell.fake.criarToken({ uid: "a2", role: "advogado" });
    const resposta = await request(app)
      .post("/advogados/a1/foto")
      .set("Authorization", `Bearer ${token}`)
      .attach("foto", Buffer.from("bytes-de-imagem-fake"), { filename: "foto.jpg", contentType: "image/jpeg" });
    expect(resposta.status).toBe(403);
  });

  it("recusa sem arquivo nenhum", async () => {
    semear("a1");
    const token = cell.fake.criarToken({ uid: "a1", role: "advogado" });
    const resposta = await request(app).post("/advogados/a1/foto").set("Authorization", `Bearer ${token}`);
    expect(resposta.status).toBe(400);
  });

  it("recusa arquivo que não é imagem", async () => {
    semear("a1");
    const token = cell.fake.criarToken({ uid: "a1", role: "advogado" });
    const resposta = await request(app)
      .post("/advogados/a1/foto")
      .set("Authorization", `Bearer ${token}`)
      .attach("foto", Buffer.from("não é imagem"), { filename: "arquivo.txt", contentType: "text/plain" });
    expect(resposta.status).toBe(400);
  });

  it("faz upload e salva a url no advogado", async () => {
    semear("a1");
    const token = cell.fake.criarToken({ uid: "a1", role: "advogado" });
    const resposta = await request(app)
      .post("/advogados/a1/foto")
      .set("Authorization", `Bearer ${token}`)
      .attach("foto", Buffer.from("bytes-de-imagem-fake"), { filename: "foto.jpg", contentType: "image/jpeg" });

    expect(resposta.status).toBe(200);
    expect(resposta.body.foto).toBe(URL_FOTO_FAKE);

    const advogado = (await cell.fake.db.collection("advogados").doc("a1").get()).data();
    expect(advogado.foto).toBe(URL_FOTO_FAKE);
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

describe("POST /advogados/:uid/contato", () => {
  it("recusa canal inválido", async () => {
    semear("a1");
    const resposta = await request(app).post("/advogados/a1/contato").send({ canal: "telefone" });
    expect(resposta.status).toBe(400);
  });

  it("404 quando o advogado não existe", async () => {
    const resposta = await request(app).post("/advogados/nao-existe/contato").send({ canal: "whatsapp" });
    expect(resposta.status).toBe(404);
  });

  it("registra o contato sem exigir token (RF008/RF010: perfil é público)", async () => {
    semear("a1");
    const resposta = await request(app).post("/advogados/a1/contato").send({ canal: "whatsapp" });
    expect(resposta.status).toBe(201);

    const snap = await cell.fake.db.collection("contatos").where("advogadoId", "==", "a1").get();
    expect(snap.docs).toHaveLength(1);
    expect(snap.docs[0].data().canal).toBe("whatsapp");
  });

  it("não cria contatosCliente quando anônimo", async () => {
    semear("a1");
    await request(app).post("/advogados/a1/contato").send({ canal: "whatsapp" });
    const doc = await cell.fake.db.collection("contatosCliente").doc("c1_a1").get();
    expect(doc.exists).toBe(false);
  });

  it("upserta contatosCliente quando o clique vem de um cliente logado", async () => {
    semear("a1");
    const token = cell.fake.criarToken({ uid: "c1", role: "cliente" });
    const resposta = await request(app)
      .post("/advogados/a1/contato")
      .set("Authorization", `Bearer ${token}`)
      .send({ canal: "whatsapp" });
    expect(resposta.status).toBe(201);

    const doc = await cell.fake.db.collection("contatosCliente").doc("c1_a1").get();
    expect(doc.exists).toBe(true);
    expect(doc.data()).toMatchObject({ clienteId: "c1", advogadoId: "a1", status: null });
  });

  it("preserva o status já marcado ao contatar de novo o mesmo advogado", async () => {
    semear("a1");
    cell.fake.db._seed("contatosCliente", "c1_a1", {
      clienteId: "c1",
      advogadoId: "a1",
      status: "Aguardando resposta",
      criadoEm: "2026-08-01T00:00:00.000Z",
      ultimoContatoEm: "2026-08-01T00:00:00.000Z",
    });
    const token = cell.fake.criarToken({ uid: "c1", role: "cliente" });
    await request(app)
      .post("/advogados/a1/contato")
      .set("Authorization", `Bearer ${token}`)
      .send({ canal: "email" });

    const doc = await cell.fake.db.collection("contatosCliente").doc("c1_a1").get();
    expect(doc.data().status).toBe("Aguardando resposta");
    expect(doc.data().criadoEm).toBe("2026-08-01T00:00:00.000Z");
    expect(doc.data().ultimoContatoEm).not.toBe("2026-08-01T00:00:00.000Z");
  });
});

describe("GET /advogados/:uid/metricas", () => {
  it("recusa sem token", async () => {
    const resposta = await request(app).get("/advogados/a1/metricas");
    expect(resposta.status).toBe(401);
  });

  it("recusa ver métricas de outro advogado", async () => {
    const token = cell.fake.criarToken({ uid: "a2", role: "advogado" });
    const resposta = await request(app).get("/advogados/a1/metricas").set("Authorization", `Bearer ${token}`);
    expect(resposta.status).toBe(403);
  });

  it("admin também pode ver", async () => {
    const token = cell.fake.criarToken({ uid: "admin1", role: "admin" });
    const resposta = await request(app).get("/advogados/a1/metricas").set("Authorization", `Bearer ${token}`);
    expect(resposta.status).toBe(200);
  });

  it("soma contatos por canal e calcula a média das notas de feedback", async () => {
    cell.fake.db._seed("contatos", "c1", { advogadoId: "a1", canal: "whatsapp" });
    cell.fake.db._seed("contatos", "c2", { advogadoId: "a1", canal: "whatsapp" });
    cell.fake.db._seed("contatos", "c3", { advogadoId: "a1", canal: "email" });
    cell.fake.db._seed("feedbacks", "f1", { advogadoId: "a1", nota: 5 });
    cell.fake.db._seed("feedbacks", "f2", { advogadoId: "a1", nota: 3 });

    const token = cell.fake.criarToken({ uid: "a1", role: "advogado" });
    const resposta = await request(app).get("/advogados/a1/metricas").set("Authorization", `Bearer ${token}`);

    expect(resposta.status).toBe(200);
    expect(resposta.body.contatos).toEqual({ total: 3, whatsapp: 2, email: 1 });
    expect(resposta.body.feedbacks).toEqual({ total: 2, mediaNota: 4 });
  });

  it("mediaNota vem null quando ainda não tem feedback nenhum", async () => {
    const token = cell.fake.criarToken({ uid: "a1", role: "advogado" });
    const resposta = await request(app).get("/advogados/a1/metricas").set("Authorization", `Bearer ${token}`);
    expect(resposta.body.feedbacks).toEqual({ total: 0, mediaNota: null });
  });
});

describe("POST /advogados/:uid/feedback", () => {
  it("recusa quem não é cliente", async () => {
    semear("a1");
    const token = cell.fake.criarToken({ uid: "a2", role: "advogado" });
    const resposta = await request(app)
      .post("/advogados/a1/feedback")
      .set("Authorization", `Bearer ${token}`)
      .send({ nota: 5 });
    expect(resposta.status).toBe(403);
  });

  it("recusa nota fora do intervalo 1-5", async () => {
    semear("a1");
    const token = cell.fake.criarToken({ uid: "c1", role: "cliente" });
    const resposta = await request(app)
      .post("/advogados/a1/feedback")
      .set("Authorization", `Bearer ${token}`)
      .send({ nota: 6 });
    expect(resposta.status).toBe(400);
  });

  it("registra a avaliação vinculada ao cliente logado", async () => {
    semear("a1");
    const token = cell.fake.criarToken({ uid: "c1", role: "cliente" });
    const resposta = await request(app)
      .post("/advogados/a1/feedback")
      .set("Authorization", `Bearer ${token}`)
      .send({ nota: 4, comentario: "Atendimento rápido e claro." });

    expect(resposta.status).toBe(201);
    expect(resposta.body.autorId).toBe("c1");

    const feedback = (await cell.fake.db.collection("feedbacks").doc(resposta.body.id).get()).data();
    expect(feedback.advogadoId).toBe("a1");
    expect(feedback.nota).toBe(4);
  });
});

describe("GET /advogados/:uid/feedback", () => {
  it("recusa ver feedback de outro advogado", async () => {
    const token = cell.fake.criarToken({ uid: "a2", role: "advogado" });
    const resposta = await request(app).get("/advogados/a1/feedback").set("Authorization", `Bearer ${token}`);
    expect(resposta.status).toBe(403);
  });

  it("lista sem expor quem escreveu, mais recente primeiro", async () => {
    cell.fake.db._seed("feedbacks", "f1", {
      advogadoId: "a1",
      autorId: "c1",
      nota: 5,
      comentario: "Ótimo",
      createdAt: "2026-01-01T00:00:00.000Z",
    });
    cell.fake.db._seed("feedbacks", "f2", {
      advogadoId: "a1",
      autorId: "c2",
      nota: 3,
      comentario: "Ok",
      createdAt: "2026-01-02T00:00:00.000Z",
    });

    const token = cell.fake.criarToken({ uid: "a1", role: "advogado" });
    const resposta = await request(app).get("/advogados/a1/feedback").set("Authorization", `Bearer ${token}`);

    expect(resposta.status).toBe(200);
    expect(resposta.body.map((f) => f.id)).toEqual(["f2", "f1"]);
    expect(resposta.body[0].autorId).toBeUndefined();
  });
});
