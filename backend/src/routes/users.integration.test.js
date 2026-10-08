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

  it("cliente atualiza a própria cidade/UF", async () => {
    cell.fake.db._seed("users", "u1", { nome: "Fulano" });
    const token = cell.fake.criarToken({ uid: "u1", role: "cliente" });
    const resposta = await request(app)
      .put("/users/me")
      .set("Authorization", `Bearer ${token}`)
      .send({ localizacao: { cidade: "Campinas", uf: "sp" } });
    expect(resposta.status).toBe(200);
    const usuario = (await cell.fake.db.collection("users").doc("u1").get()).data();
    expect(usuario.localizacao).toEqual({ cidade: "Campinas", uf: "SP" });
  });

  it("recusa localização por aqui pra advogado (ela fica no perfil profissional)", async () => {
    cell.fake.db._seed("users", "a1", { nome: "Advogado" });
    const token = cell.fake.criarToken({ uid: "a1", role: "advogado" });
    const resposta = await request(app)
      .put("/users/me")
      .set("Authorization", `Bearer ${token}`)
      .send({ localizacao: { cidade: "Campinas", uf: "SP" } });
    expect(resposta.status).toBe(400);
  });
});

describe("POST /users/me/foto", () => {
  it("recusa sem token", async () => {
    const resposta = await request(app).post("/users/me/foto");
    expect(resposta.status).toBe(401);
  });

  it("recusa advogado (usa a própria rota, /advogados/:uid/foto)", async () => {
    const token = cell.fake.criarToken({ uid: "a1", role: "advogado" });
    const resposta = await request(app)
      .post("/users/me/foto")
      .set("Authorization", `Bearer ${token}`)
      .attach("foto", Buffer.from("bytes-de-imagem-fake"), { filename: "foto.jpg", contentType: "image/jpeg" });
    expect(resposta.status).toBe(403);
  });

  it("recusa sem arquivo nenhum", async () => {
    const token = cell.fake.criarToken({ uid: "c1", role: "cliente" });
    const resposta = await request(app).post("/users/me/foto").set("Authorization", `Bearer ${token}`);
    expect(resposta.status).toBe(400);
  });

  it("recusa arquivo que não é imagem", async () => {
    const token = cell.fake.criarToken({ uid: "c1", role: "cliente" });
    const resposta = await request(app)
      .post("/users/me/foto")
      .set("Authorization", `Bearer ${token}`)
      .attach("foto", Buffer.from("não é imagem"), { filename: "arquivo.txt", contentType: "text/plain" });
    expect(resposta.status).toBe(400);
  });

  it("recusa SVG (pode conter script embutido)", async () => {
    const token = cell.fake.criarToken({ uid: "c1", role: "cliente" });
    const resposta = await request(app)
      .post("/users/me/foto")
      .set("Authorization", `Bearer ${token}`)
      .attach("foto", Buffer.from('<svg onload="alert(1)"></svg>'), {
        filename: "foto.svg",
        contentType: "image/svg+xml",
      });
    expect(resposta.status).toBe(400);
  });

  it("faz upload e salva a url no próprio cadastro", async () => {
    cell.fake.db._seed("users", "c1", { role: "cliente", nome: "Cliente" });
    const token = cell.fake.criarToken({ uid: "c1", role: "cliente" });
    const resposta = await request(app)
      .post("/users/me/foto")
      .set("Authorization", `Bearer ${token}`)
      .attach("foto", Buffer.from("bytes-de-imagem-fake"), { filename: "foto.jpg", contentType: "image/jpeg" });

    expect(resposta.status).toBe(200);
    expect(resposta.body.foto).toBe(URL_FOTO_FAKE);

    const usuario = (await cell.fake.db.collection("users").doc("c1").get()).data();
    expect(usuario.foto).toBe(URL_FOTO_FAKE);
  });
});

describe("GET /users/me/dados", () => {
  it("recusa sem token", async () => {
    const resposta = await request(app).get("/users/me/dados");
    expect(resposta.status).toBe(401);
  });

  it("404 quando o cadastro não existe", async () => {
    const token = cell.fake.criarToken({ uid: "c1", role: "cliente" });
    const resposta = await request(app).get("/users/me/dados").set("Authorization", `Bearer ${token}`);
    expect(resposta.status).toBe(404);
  });

  it("junta cadastro, triagens e pedidos de contato do cliente", async () => {
    cell.fake.db._seed("users", "c1", { role: "cliente", nome: "Cliente" });
    cell.fake.db._seed("triagens", "t1", { clienteId: "c1", descricao: "Fui demitido" });
    cell.fake.db._seed("solicitacoes", "s1", {
      clienteId: "c1",
      advogadoId: "a1",
      situacao: "aceita",
      anotacoes: "Anotação privada do advogado",
    });

    const token = cell.fake.criarToken({ uid: "c1", role: "cliente" });
    const resposta = await request(app).get("/users/me/dados").set("Authorization", `Bearer ${token}`);

    expect(resposta.status).toBe(200);
    expect(resposta.body.cadastro.nome).toBe("Cliente");
    expect(resposta.body.triagens).toHaveLength(1);
    expect(resposta.body.solicitacoesFeitas).toHaveLength(1);
    expect(resposta.body.solicitacoesFeitas[0].anotacoes).toBeUndefined();
    expect(resposta.body.perfilAdvogado).toBeUndefined();
  });

  it("junta perfil, currículo e pedidos recebidos do advogado", async () => {
    cell.fake.db._seed("users", "a1", { role: "advogado", nome: "Advogado" });
    cell.fake.db._seed("advogados", "a1", { areasAtuacao: ["civel"] });
    cell.fake.db._seed("curriculos", "a1", { formacao: ["Direito - USP"] });
    cell.fake.db._seed("solicitacoes", "s1", { clienteId: "c1", advogadoId: "a1", situacao: "pendente" });

    const token = cell.fake.criarToken({ uid: "a1", role: "advogado" });
    const resposta = await request(app).get("/users/me/dados").set("Authorization", `Bearer ${token}`);

    expect(resposta.status).toBe(200);
    expect(resposta.body.perfilAdvogado.areasAtuacao).toEqual(["civel"]);
    expect(resposta.body.curriculo.formacao).toEqual(["Direito - USP"]);
    expect(resposta.body.solicitacoesRecebidas).toHaveLength(1);
    expect(resposta.body.triagens).toBeUndefined();
  });
});

describe("DELETE /users/me", () => {
  it("recusa sem token", async () => {
    const resposta = await request(app).delete("/users/me");
    expect(resposta.status).toBe(401);
  });

  it("cliente apaga a própria conta (Auth + Firestore)", async () => {
    cell.fake.db._seed("users", "c1", { role: "cliente" });
    cell.fake.auth._registrarUsuario("c1");
    const token = cell.fake.criarToken({ uid: "c1", role: "cliente" });

    const resposta = await request(app).delete("/users/me").set("Authorization", `Bearer ${token}`);
    expect(resposta.status).toBe(200);
    expect((await cell.fake.db.collection("users").doc("c1").get()).exists).toBe(false);
  });

  it("advogado apaga a própria conta junto com advogados/curriculos", async () => {
    cell.fake.db._seed("users", "a1", { role: "advogado" });
    cell.fake.db._seed("advogados", "a1", { areasAtuacao: [] });
    cell.fake.db._seed("curriculos", "a1", { formacao: [] });
    cell.fake.auth._registrarUsuario("a1");
    const token = cell.fake.criarToken({ uid: "a1", role: "advogado" });

    const resposta = await request(app).delete("/users/me").set("Authorization", `Bearer ${token}`);
    expect(resposta.status).toBe(200);
    expect((await cell.fake.db.collection("advogados").doc("a1").get()).exists).toBe(false);
    expect((await cell.fake.db.collection("curriculos").doc("a1").get()).exists).toBe(false);
  });
});
