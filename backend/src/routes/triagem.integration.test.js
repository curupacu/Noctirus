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
  // Garante que a classificação usa o fallback por regras nos testes (sem depender de
  // chave/rede do Gemini nem do Groq) — RNF003, o mesmo caminho que já é coberto em
  // services/triagem.test.js.
  delete process.env.GEMINI_API_KEY;
  delete process.env.GROQ_API_KEY;
});

const ETAPA1 = {
  oque: "Fui demitido sem justa causa e não pagaram minhas horas extras.",
  quando: "Mês passado",
};
// Etapa 2 (redesenho de 13/10/2026): chips de especialidade + detalhe opcional.
const ETAPA2_TRABALHISTA = { detalhes: "Tenho a carteira assinada e os holerites" };
const CATEGORIAS_TRABALHISTA = ["horas_extras", "demissao_sem_justa_causa"];

function tokenCliente() {
  return cell.fake.criarToken({ uid: "c1", role: "cliente" });
}

describe("GET /triagem/perguntas", () => {
  it("responde sem precisar de token, com as duas etapas", async () => {
    const resposta = await request(app).get("/triagem/perguntas");
    expect(resposta.status).toBe(200);
    expect(resposta.body.etapa1.map((p) => p.id)).toEqual(["oque", "quando"]);
    expect(Object.keys(resposta.body.etapa2).sort()).toEqual(["civel", "previdenciario", "trabalhista", "transito"]);
    expect(resposta.body.categorias).toBeDefined();
    expect(resposta.body.areas.transito.label).toBe("Trânsito");
  });
});

describe("POST /triagem/area (etapa 1)", () => {
  it("recusa sem token e quem não é cliente", async () => {
    expect((await request(app).post("/triagem/area").send({ etapa1: ETAPA1 })).status).toBe(401);
    const advogado = cell.fake.criarToken({ uid: "a1", role: "advogado" });
    const resposta = await request(app)
      .post("/triagem/area")
      .set("Authorization", `Bearer ${advogado}`)
      .send({ etapa1: ETAPA1 });
    expect(resposta.status).toBe(403);
  });

  it("exige que todas as perguntas sejam respondidas", async () => {
    const resposta = await request(app)
      .post("/triagem/area")
      .set("Authorization", `Bearer ${tokenCliente()}`)
      .send({ etapa1: { oque: ETAPA1.oque } });
    expect(resposta.status).toBe(400);
  });

  it("recusa resposta curta demais", async () => {
    const resposta = await request(app)
      .post("/triagem/area")
      .set("Authorization", `Bearer ${tokenCliente()}`)
      .send({ etapa1: { ...ETAPA1, oque: "curta" } });
    expect(resposta.status).toBe(400);
  });

  it("identifica a área, já sugere as especialidades e não grava nada", async () => {
    const resposta = await request(app)
      .post("/triagem/area")
      .set("Authorization", `Bearer ${tokenCliente()}`)
      .send({ etapa1: ETAPA1 });

    expect(resposta.status).toBe(200);
    expect(resposta.body.area).toBe("trabalhista");
    expect(resposta.body.categorias).toContain("horas_extras");
    expect(resposta.body.perguntas.map((p) => p.id)).toEqual(["detalhes"]);
    expect((await cell.fake.db.collection("triagens").get()).docs).toHaveLength(0);
  });

  it("identifica as áreas novas: trânsito e previdenciário", async () => {
    const multa = await request(app)
      .post("/triagem/area")
      .set("Authorization", `Bearer ${tokenCliente()}`)
      .send({ etapa1: { oque: "Recebi uma multa de radar e quero recorrer antes da minha CNH ser suspensa", quando: "Semana passada" } });
    expect(multa.body.area).toBe("transito");
    expect(multa.body.categorias).toContain("multa_transito");

    const inss = await request(app)
      .post("/triagem/area")
      .set("Authorization", `Bearer ${tokenCliente()}`)
      .send({ etapa1: { oque: "Meu marido faleceu e o INSS negou minha pensão por morte", quando: "Mês passado" } });
    expect(inss.body.area).toBe("previdenciario");
    expect(inss.body.categorias).toContain("pensao_por_morte");
  });

  it("quando não dá pra identificar, devolve indefinido sem perguntas (o cliente escolhe a área)", async () => {
    const resposta = await request(app)
      .post("/triagem/area")
      .set("Authorization", `Bearer ${tokenCliente()}`)
      .send({ etapa1: { oque: "Preciso de ajuda com uma situação chata", quando: "Ontem" } });
    expect(resposta.body.area).toBe("indefinido");
    expect(resposta.body.perguntas).toBeNull();
  });
});

describe("POST /triagem/classificar (etapa 2)", () => {
  function enviar(corpo, token = tokenCliente()) {
    return request(app).post("/triagem/classificar").set("Authorization", `Bearer ${token}`).send(corpo);
  }

  it("recusa sem token", async () => {
    const resposta = await request(app).post("/triagem/classificar").send({});
    expect(resposta.status).toBe(401);
  });

  it("exige área definida", async () => {
    const resposta = await enviar({ etapa1: ETAPA1, area: "indefinido", categorias: CATEGORIAS_TRABALHISTA });
    expect(resposta.status).toBe(400);
  });

  it("exige pelo menos um assunto, e só da área escolhida", async () => {
    expect((await enviar({ etapa1: ETAPA1, area: "trabalhista", categorias: [] })).status).toBe(400);
    expect((await enviar({ etapa1: ETAPA1, area: "civel", categorias: CATEGORIAS_TRABALHISTA })).status).toBe(400);
  });

  it("o detalhe da etapa 2 é opcional", async () => {
    const resposta = await enviar({ etapa1: ETAPA1, area: "trabalhista", categorias: CATEGORIAS_TRABALHISTA });
    expect(resposta.status).toBe(201);
    const triagem = (await cell.fake.db.collection("triagens").doc(resposta.body.id).get()).data();
    expect(triagem.respostas.etapa2).toEqual({});
  });

  it("recusa resposta longa demais (teto de custo do prompt da IA)", async () => {
    const resposta = await enviar({
      etapa1: { ...ETAPA1, oque: "a".repeat(2001) },
      area: "trabalhista",
      categorias: CATEGORIAS_TRABALHISTA,
    });
    expect(resposta.status).toBe(400);
  });

  it("grava a triagem com as especialidades que o cliente confirmou, na ordem dele", async () => {
    const resposta = await enviar({
      etapa1: ETAPA1,
      area: "trabalhista",
      categorias: CATEGORIAS_TRABALHISTA,
      etapa2: { ...ETAPA2_TRABALHISTA, extra: "x" },
      origem: "ia",
    });

    expect(resposta.status).toBe(201);
    expect(resposta.body.areaClassificada).toBe("trabalhista");
    expect(resposta.body.origem).toBe("ia");
    expect(resposta.body.categorias).toEqual(CATEGORIAS_TRABALHISTA);
    expect(resposta.body.especialidade).toBe("horas_extras");
    expect(resposta.body.advogados).toBeDefined();

    const triagem = (await cell.fake.db.collection("triagens").doc(resposta.body.id).get()).data();
    expect(triagem.clienteId).toBe("c1");
    expect(triagem.respostas).toEqual({ etapa1: ETAPA1, etapa2: ETAPA2_TRABALHISTA });
    expect(triagem.descricao).toContain("O que aconteceu? Fui demitido");
  });

  it("respeita a área corrigida pelo cliente, mesmo que o texto puxe pra outra", async () => {
    const resposta = await enviar({
      etapa1: ETAPA1,
      area: "civel",
      categorias: ["dividas_cobranca"],
    });
    expect(resposta.status).toBe(201);
    expect(resposta.body.areaClassificada).toBe("civel");
  });

  it("o resultado não traz o WhatsApp/e-mail dos advogados (só depois do aceite)", async () => {
    cell.fake.db._seed("advogados", "adv1", {
      areasAtuacao: ["trabalhista"],
      localizacao: {},
      especialidades: [],
      situacaoOab: "aprovado",
      contatos: { whatsapp: "11999999999", email: "adv@example.com" },
    });
    cell.fake.db._seed("users", "adv1", { nome: "Advogado Um" });

    const resposta = await enviar({ etapa1: ETAPA1, area: "trabalhista", categorias: CATEGORIAS_TRABALHISTA });

    expect(resposta.status).toBe(201);
    expect(resposta.body.advogados.find((a) => a.uid === "adv1").contatos).toBeUndefined();
  });
});

describe("resultado filtrado pela região do cliente (RF008)", () => {
  function semearAdvogado(uid, cidade, uf, especialidades = []) {
    cell.fake.db._seed("advogados", uid, {
      areasAtuacao: ["trabalhista"],
      localizacao: { cidade, uf },
      especialidades,
      situacaoOab: "aprovado",
    });
    cell.fake.db._seed("users", uid, { nome: uid });
  }

  const CORPO = { etapa1: ETAPA1, area: "trabalhista", categorias: CATEGORIAS_TRABALHISTA };

  it("mostra só advogados do estado do cliente, a cidade dele primeiro", async () => {
    cell.fake.db._seed("users", "c1", { role: "cliente", localizacao: { cidade: "Campinas", uf: "SP" } });
    semearAdvogado("capital", "São Paulo", "SP");
    semearAdvogado("campinas", "Campinas", "SP");
    semearAdvogado("rio", "Rio de Janeiro", "RJ");

    const resposta = await request(app)
      .post("/triagem/classificar")
      .set("Authorization", `Bearer ${tokenCliente()}`)
      .send(CORPO);

    expect(resposta.status).toBe(201);
    expect(resposta.body.regiao).toEqual({ cidade: "Campinas", uf: "SP" });
    expect(resposta.body.advogados.map((a) => a.uid)).toEqual(["campinas", "capital"]);
    const triagem = (await cell.fake.db.collection("triagens").doc(resposta.body.id).get()).data();
    expect(triagem.regiaoCliente).toEqual({ cidade: "Campinas", uf: "SP" });
  });

  it("nenhum advogado no estado do cliente → lista vazia (a tela avisa)", async () => {
    cell.fake.db._seed("users", "c1", { role: "cliente", localizacao: { cidade: "Manaus", uf: "AM" } });
    semearAdvogado("capital", "São Paulo", "SP");

    const resposta = await request(app)
      .post("/triagem/classificar")
      .set("Authorization", `Bearer ${tokenCliente()}`)
      .send(CORPO);
    expect(resposta.body.advogados).toEqual([]);
  });

  it("cliente antigo sem cidade vê a área inteira e regiao null", async () => {
    cell.fake.db._seed("users", "c1", { role: "cliente" });
    semearAdvogado("capital", "São Paulo", "SP");
    semearAdvogado("rio", "Rio de Janeiro", "RJ");

    const resposta = await request(app)
      .post("/triagem/classificar")
      .set("Authorization", `Bearer ${tokenCliente()}`)
      .send(CORPO);
    expect(resposta.body.regiao).toBeNull();
    expect(resposta.body.advogados).toHaveLength(2);
  });

  it("GET /triagem/:id?categorias recalcula a ordem com as especialidades marcadas (só as da área)", async () => {
    cell.fake.db._seed("users", "c1", { role: "cliente", localizacao: { cidade: "Santos", uf: "SP" } });
    semearAdvogado("generalista", "Santos", "SP");
    semearAdvogado("fgts", "Santos", "SP", ["fgts_multa"]);
    cell.fake.db._seed("triagens", "t1", {
      clienteId: "c1",
      areaClassificada: "trabalhista",
      categorias: ["horas_extras"],
    });

    const resposta = await request(app)
      .get("/triagem/t1?categorias=fgts_multa,plano_saude")
      .set("Authorization", `Bearer ${tokenCliente()}`);

    expect(resposta.status).toBe(200);
    expect(resposta.body.advogados.map((a) => a.uid)).toEqual(["fgts", "generalista"]);
    expect(resposta.body.advogados[0].especialidadesCompativeis).toBe(1);
  });
});

describe("GET /triagem/historico", () => {
  it("recusa sem token", async () => {
    const resposta = await request(app).get("/triagem/historico");
    expect(resposta.status).toBe(401);
  });

  it("retorna só as triagens do próprio cliente", async () => {
    cell.fake.db._seed("triagens", "t1", { clienteId: "c1", createdAt: "2026-01-01T00:00:00.000Z" });
    cell.fake.db._seed("triagens", "t2", { clienteId: "c2", createdAt: "2026-01-02T00:00:00.000Z" });
    const token = cell.fake.criarToken({ uid: "c1", role: "cliente" });
    const resposta = await request(app).get("/triagem/historico").set("Authorization", `Bearer ${token}`);
    expect(resposta.status).toBe(200);
    expect(resposta.body.map((t) => t.id)).toEqual(["t1"]);
  });
});

describe("GET /triagem/:id", () => {
  it("404 quando a triagem não existe", async () => {
    const token = cell.fake.criarToken({ uid: "c1", role: "cliente" });
    const resposta = await request(app).get("/triagem/nao-existe").set("Authorization", `Bearer ${token}`);
    expect(resposta.status).toBe(404);
  });

  it("404 quando a triagem é de outro cliente (não vaza dado de terceiro)", async () => {
    cell.fake.db._seed("triagens", "t1", { clienteId: "outro-cliente", areaClassificada: "civel" });
    const token = cell.fake.criarToken({ uid: "c1", role: "cliente" });
    const resposta = await request(app).get("/triagem/t1").set("Authorization", `Bearer ${token}`);
    expect(resposta.status).toBe(404);
  });

  it("retorna a triagem do próprio cliente com advogados compatíveis", async () => {
    cell.fake.db._seed("triagens", "t1", {
      clienteId: "c1",
      areaClassificada: "civel",
      categorias: [],
    });
    const token = cell.fake.criarToken({ uid: "c1", role: "cliente" });
    const resposta = await request(app).get("/triagem/t1").set("Authorization", `Bearer ${token}`);
    expect(resposta.status).toBe(200);
    expect(resposta.body.advogados).toBeDefined();
  });
});
