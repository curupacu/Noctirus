import { beforeEach, describe, expect, it, vi } from "vitest";

const cell = vi.hoisted(() => ({ fake: null }));

vi.mock("../lib/firebase-admin.js", () => ({
  db: { collection: (...args) => cell.fake.db.collection(...args) },
  auth: {},
}));

import { criarFakeFirebase } from "../test-utils/fakeFirebase.js";
import { enviarLembretes, horarioPermitido } from "./lembretes.js";

// 25/10/2026 às 15h de Brasília (18h UTC): dentro do horário permitido.
const AGORA = Date.parse("2026-10-25T18:00:00.000Z");
const diasAtras = (dias) => new Date(AGORA - dias * 24 * 60 * 60 * 1000).toISOString();

async function notificacoes() {
  return (await cell.fake.db.collection("notificacoes").get()).docs.map((d) => d.data());
}

beforeEach(() => {
  cell.fake = criarFakeFirebase();
});

describe("lembretes", () => {
  it("lembra o cliente que não pediu contato depois de 2 dias, uma vez só", async () => {
    cell.fake.db._seed("triagens", "t1", {
      clienteId: "c1",
      areaClassificada: "civel",
      especialidade: "acidente_transito",
      advogadosSugeridos: ["a1", "a2", "a3"],
      createdAt: diasAtras(3),
    });

    expect(await enviarLembretes(AGORA)).toEqual({ clientes: 1, advogados: 0 });
    const [aviso] = await notificacoes();
    expect(aviso.destinatarioId).toBe("c1");
    expect(aviso.texto).toContain("3 advogados");
    expect(aviso.texto).toContain("Cível · Acidente de trânsito");
    expect(aviso.texto).not.toMatch(/melhor|perfeit/i);
    expect(aviso.link).toBe("/triagem/t1");

    expect(await enviarLembretes(AGORA)).toEqual({ clientes: 0, advogados: 0 });
  });

  it("não lembra quem já pediu contato, triagem recente, sem advogados ou de demonstração", async () => {
    cell.fake.db._seed("triagens", "pediu", { clienteId: "c1", areaClassificada: "civel", advogadosSugeridos: ["a1"], createdAt: diasAtras(3) });
    cell.fake.db._seed("solicitacoes", "s1", { clienteId: "c1", triagemId: "pediu", situacao: "aceita", createdAt: diasAtras(3) });
    cell.fake.db._seed("triagens", "recente", { clienteId: "c2", areaClassificada: "civel", advogadosSugeridos: ["a1"], createdAt: diasAtras(1) });
    cell.fake.db._seed("triagens", "vazia", { clienteId: "c3", areaClassificada: "civel", advogadosSugeridos: [], createdAt: diasAtras(3) });
    cell.fake.db._seed("triagens", "demo", { demo: true, clienteId: "c4", areaClassificada: "civel", advogadosSugeridos: ["a1"], createdAt: diasAtras(3) });

    expect(await enviarLembretes(AGORA)).toEqual({ clientes: 0, advogados: 0 });
    expect(await notificacoes()).toHaveLength(0);
  });

  it("junta os pedidos parados de cada advogado num aviso só", async () => {
    cell.fake.db._seed("solicitacoes", "p1", { advogadoId: "a1", situacao: "pendente", createdAt: diasAtras(3) });
    cell.fake.db._seed("solicitacoes", "p2", { advogadoId: "a1", situacao: "pendente", createdAt: diasAtras(4) });
    cell.fake.db._seed("solicitacoes", "p3", { advogadoId: "a2", situacao: "pendente", createdAt: diasAtras(1) });

    expect(await enviarLembretes(AGORA)).toEqual({ clientes: 0, advogados: 1 });
    const [aviso] = await notificacoes();
    expect(aviso.destinatarioId).toBe("a1");
    expect(aviso.texto).toContain("2 pedidos");
    expect(aviso.link).toBe("/casos");

    expect(await enviarLembretes(AGORA)).toEqual({ clientes: 0, advogados: 0 });
  });

  it("não manda nada de madrugada nem à noite", async () => {
    expect(horarioPermitido(new Date("2026-10-25T06:00:00.000Z"))).toBe(false); // 3h
    expect(horarioPermitido(new Date("2026-10-25T23:30:00.000Z"))).toBe(false); // 20h30
    expect(horarioPermitido(new Date("2026-10-25T12:00:00.000Z"))).toBe(true); // 9h
    cell.fake.db._seed("solicitacoes", "p1", { advogadoId: "a1", situacao: "pendente", createdAt: diasAtras(3) });
    const madrugada = Date.parse("2026-10-25T06:00:00.000Z");
    expect(await enviarLembretes(madrugada)).toMatchObject({ foraDoHorario: true });
  });
});
