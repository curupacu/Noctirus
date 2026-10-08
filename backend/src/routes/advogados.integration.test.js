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
const enviarEmailMock = vi.hoisted(() => vi.fn().mockResolvedValue({ enviado: true }));
vi.mock("../lib/email.js", () => ({
  enviarEmail: (...args) => enviarEmailMock(...args),
}));

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
    situacaoOab: "em_analise",
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
    semear("a1", { advogado: { areasAtuacao: ["civel"], situacaoOab: "aprovado" } });
    semear("a2", { advogado: { areasAtuacao: ["trabalhista"], situacaoOab: "aprovado" } });
    const resposta = await request(app).get("/advogados");
    expect(resposta.status).toBe(200);
    expect(resposta.body).toHaveLength(2);
  });

  it("não lista advogado com OAB em análise, recusada ou revogada", async () => {
    semear("a1", { advogado: { situacaoOab: "aprovado" } });
    semear("a2", { advogado: { situacaoOab: "em_analise" } });
    semear("a3", { advogado: { situacaoOab: "recusado" } });
    semear("a4", { advogado: { situacaoOab: "revogado" } });
    const resposta = await request(app).get("/advogados");
    expect(resposta.body.map((a) => a.uid)).toEqual(["a1"]);
  });

  it("filtra por área via query string", async () => {
    semear("a1", { advogado: { areasAtuacao: ["civel"], situacaoOab: "aprovado" } });
    semear("a2", { advogado: { areasAtuacao: ["trabalhista"], situacaoOab: "aprovado" } });
    const resposta = await request(app).get("/advogados?area=trabalhista");
    expect(resposta.body.map((a) => a.uid)).toEqual(["a2"]);
  });
});

describe("GET /advogados/:uid", () => {
  it("404 quando não existe", async () => {
    const resposta = await request(app).get("/advogados/nao-existe");
    expect(resposta.status).toBe(404);
  });

  it("retorna advogado aprovado com o nome resolvido do users", async () => {
    semear("a1", { usuario: { nome: "Fulano" }, advogado: { situacaoOab: "aprovado" } });
    const resposta = await request(app).get("/advogados/a1");
    expect(resposta.status).toBe(200);
    expect(resposta.body.nome).toBe("Fulano");
    expect(resposta.body.uid).toBe("a1");
  });

  it("perfil de advogado não aprovado fica indisponível pro público", async () => {
    semear("a1");
    const resposta = await request(app).get("/advogados/a1");
    expect(resposta.status).toBe(404);
    expect(resposta.body.erro).toBe("Perfil indisponível");
  });

  it("o próprio advogado e o admin veem o perfil mesmo em análise", async () => {
    semear("a1");
    const dono = cell.fake.criarToken({ uid: "a1", role: "advogado" });
    const admin = cell.fake.criarToken({ uid: "admin1", role: "admin" });
    expect((await request(app).get("/advogados/a1").set("Authorization", `Bearer ${dono}`)).status).toBe(200);
    expect((await request(app).get("/advogados/a1").set("Authorization", `Bearer ${admin}`)).status).toBe(200);
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

  // Achado da auditoria de segurança (F3): SVG pode embutir <script>. Só formato raster
  // é aceito, mesmo que o navegador identifique o arquivo como "image/*".
  it("recusa SVG (pode conter script embutido)", async () => {
    semear("a1");
    const token = cell.fake.criarToken({ uid: "a1", role: "advogado" });
    const resposta = await request(app)
      .post("/advogados/a1/foto")
      .set("Authorization", `Bearer ${token}`)
      .attach("foto", Buffer.from("<svg onload=\"alert(1)\"></svg>"), {
        filename: "foto.svg",
        contentType: "image/svg+xml",
      });
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

describe("PATCH /advogados/:uid/situacao-oab", () => {
  beforeEach(() => enviarEmailMock.mockClear());

  async function mudar(uid, corpo, papel = "admin") {
    const token = cell.fake.criarToken({ uid: papel === "admin" ? "admin1" : uid, role: papel });
    return request(app)
      .patch(`/advogados/${uid}/situacao-oab`)
      .set("Authorization", `Bearer ${token}`)
      .send(corpo);
  }

  async function lerAdvogado(uid) {
    return (await cell.fake.db.collection("advogados").doc(uid).get()).data();
  }

  it("recusa quem não é admin", async () => {
    semear("a1");
    const resposta = await mudar("a1", { situacao: "aprovado" }, "advogado");
    expect(resposta.status).toBe(403);
  });

  it("recusa situação que não existe (ou voltar pra em_analise na mão)", async () => {
    semear("a1");
    expect((await mudar("a1", { situacao: "verificado" })).status).toBe(400);
    expect((await mudar("a1", { situacao: "em_analise" })).status).toBe(400);
  });

  it("recusa recusar ou revogar sem motivo", async () => {
    semear("a1");
    expect((await mudar("a1", { situacao: "recusado" })).status).toBe(400);
    semear("a2", { advogado: { situacaoOab: "aprovado" } });
    expect((await mudar("a2", { situacao: "revogado", motivo: "x" })).status).toBe(400);
  });

  it("devolve 404 pra advogado inexistente", async () => {
    const resposta = await mudar("nao-existe", { situacao: "aprovado" });
    expect(resposta.status).toBe(404);
  });

  it("não deixa revogar quem nem foi aprovado, nem recusar quem já foi aprovado", async () => {
    semear("a1");
    expect((await mudar("a1", { situacao: "revogado", motivo: "Inscrição cancelada" })).status).toBe(409);
    semear("a2", { advogado: { situacaoOab: "aprovado" } });
    expect((await mudar("a2", { situacao: "recusado", motivo: "Número errado" })).status).toBe(409);
  });

  it("aprova, registra quem e quando, guarda no histórico e avisa o advogado", async () => {
    semear("a1", { usuario: { email: "a1@example.com" } });
    const resposta = await mudar("a1", { situacao: "aprovado", motivo: "ignorado" });

    expect(resposta.status).toBe(200);
    const advogado = await lerAdvogado("a1");
    expect(advogado.situacaoOab).toBe("aprovado");
    expect(advogado.situacaoOabMotivo).toBeNull();
    expect(advogado.situacaoOabPor).toBe("admin1");
    expect(advogado.historicoOab).toEqual([
      { situacao: "aprovado", motivo: null, em: expect.any(String), por: "admin1" },
    ]);

    const notificacoes = await cell.fake.db.collection("notificacoes").where("destinatarioId", "==", "a1").get();
    expect(notificacoes.docs).toHaveLength(1);
    expect(notificacoes.docs[0].data().tipo).toBe("situacao_oab");
    expect(enviarEmailMock).toHaveBeenCalledWith(
      expect.objectContaining({ to: "a1@example.com", subject: "Sua OAB foi verificada na Nocturis" }),
    );
  });

  it("recusa com motivo e o motivo chega no aviso", async () => {
    semear("a1", { usuario: { email: "a1@example.com" } });
    const resposta = await mudar("a1", { situacao: "recusado", motivo: "Número não encontrado no CNA" });

    expect(resposta.status).toBe(200);
    expect((await lerAdvogado("a1")).situacaoOabMotivo).toBe("Número não encontrado no CNA");
    const notificacoes = await cell.fake.db.collection("notificacoes").where("destinatarioId", "==", "a1").get();
    expect(notificacoes.docs[0].data().texto).toContain("Número não encontrado no CNA");
  });

  it("revoga quem estava aprovado e acumula o histórico", async () => {
    semear("a1", {
      advogado: {
        situacaoOab: "aprovado",
        historicoOab: [{ situacao: "aprovado", motivo: null, em: "2026-10-01T00:00:00.000Z", por: "admin1" }],
      },
    });
    const resposta = await mudar("a1", { situacao: "revogado", motivo: "Inscrição suspensa na OAB" });

    expect(resposta.status).toBe(200);
    const advogado = await lerAdvogado("a1");
    expect(advogado.situacaoOab).toBe("revogado");
    expect(advogado.historicoOab.map((h) => h.situacao)).toEqual(["aprovado", "revogado"]);
  });

  it("a decisão vale mesmo se o e-mail falhar", async () => {
    enviarEmailMock.mockRejectedValueOnce(new Error("Resend fora do ar"));
    semear("a1", { usuario: { email: "a1@example.com" } });
    const resposta = await mudar("a1", { situacao: "aprovado" });
    expect(resposta.status).toBe(200);
    expect((await lerAdvogado("a1")).situacaoOab).toBe("aprovado");
  });
});

describe("PUT /advogados/:uid corrigindo a OAB recusada", () => {
  async function corrigir(uid, oab) {
    const token = cell.fake.criarToken({ uid, role: "advogado" });
    return request(app).put(`/advogados/${uid}`).set("Authorization", `Bearer ${token}`).send({ oab });
  }

  it("só aceita trocar a OAB depois de uma recusa", async () => {
    semear("a1", { advogado: { situacaoOab: "aprovado", oab: { numero: "123456", uf: "SP" } } });
    const resposta = await corrigir("a1", { numero: "654321", uf: "SP" });
    expect(resposta.status).toBe(400);
  });

  it("recusa número em formato inválido", async () => {
    semear("a1", { advogado: { situacaoOab: "recusado" } });
    const resposta = await corrigir("a1", { numero: "12", uf: "SP" });
    expect(resposta.status).toBe(400);
  });

  it("recusa OAB que já é de outro advogado", async () => {
    semear("a1", { advogado: { situacaoOab: "recusado" } });
    semear("a2", { advogado: { oab: { numero: "654321", uf: "SP" } } });
    const resposta = await corrigir("a1", { numero: "654321", uf: "SP" });
    expect(resposta.status).toBe(409);
  });

  it("troca a OAB e volta o cadastro pra análise, sem motivo antigo", async () => {
    semear("a1", {
      advogado: { situacaoOab: "recusado", situacaoOabMotivo: "Número errado", oab: { numero: "111111", uf: "SP" } },
    });
    const resposta = await corrigir("a1", { numero: "222222", uf: "rj" });

    expect(resposta.status).toBe(200);
    const advogado = (await cell.fake.db.collection("advogados").doc("a1").get()).data();
    expect(advogado.oab).toEqual({ numero: "222222", uf: "RJ" });
    expect(advogado.situacaoOab).toBe("em_analise");
    expect(advogado.situacaoOabMotivo).toBeNull();
    expect(advogado.historicoOab.at(-1).situacao).toBe("em_analise");
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

  it("soma contatos por canal", async () => {
    cell.fake.db._seed("contatos", "c1", { advogadoId: "a1", canal: "whatsapp" });
    cell.fake.db._seed("contatos", "c2", { advogadoId: "a1", canal: "whatsapp" });
    cell.fake.db._seed("contatos", "c3", { advogadoId: "a1", canal: "email" });

    const token = cell.fake.criarToken({ uid: "a1", role: "advogado" });
    const resposta = await request(app).get("/advogados/a1/metricas").set("Authorization", `Bearer ${token}`);

    expect(resposta.status).toBe(200);
    expect(resposta.body.contatos).toEqual({ total: 3, whatsapp: 2, email: 1 });
  });
});
