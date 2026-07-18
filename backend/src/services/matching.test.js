import { beforeEach, describe, expect, it, vi } from "vitest";

// Fake mínimo do Firestore — só o suficiente pra cobrir o que buscarAdvogadosCompativeis
// usa (collection().get() e collection().doc(id).get()). `state` existe fora do factory
// por causa do hoisting do vi.mock (ver docs do Vitest: vi.hoisted).
const state = vi.hoisted(() => ({ data: {} }));

vi.mock("../lib/firebase-admin.js", () => ({
  db: {
    collection: (nome) => ({
      get: async () => ({
        docs: Object.entries(state.data[nome] || {}).map(([id, campos]) => ({
          id,
          data: () => campos,
        })),
      }),
      doc: (id) => ({
        get: async () => {
          const campos = state.data[nome]?.[id];
          return { exists: !!campos, data: () => campos, id };
        },
      }),
    }),
  },
}));

const { buscarAdvogadosCompativeis } = await import("./matching.js");

function preparar({ advogados, users }) {
  state.data = { advogados, users };
}

beforeEach(() => {
  state.data = {};
});

const BASE_USER = { nome: "Advogado Teste", status: "ativo" };

describe("buscarAdvogadosCompativeis", () => {
  it("retorna todos quando nenhum filtro é passado", async () => {
    preparar({
      advogados: {
        a1: { areasAtuacao: ["civel"], localizacao: { cidade: "São Paulo", uf: "SP" } },
        a2: { areasAtuacao: ["trabalhista"], localizacao: { cidade: "Rio", uf: "RJ" } },
      },
      users: { a1: BASE_USER, a2: BASE_USER },
    });

    const resultado = await buscarAdvogadosCompativeis();
    expect(resultado).toHaveLength(2);
  });

  it("filtra por área", async () => {
    preparar({
      advogados: {
        a1: { areasAtuacao: ["civel"], localizacao: {} },
        a2: { areasAtuacao: ["trabalhista"], localizacao: {} },
      },
      users: { a1: BASE_USER, a2: BASE_USER },
    });

    const resultado = await buscarAdvogadosCompativeis({ area: "trabalhista" });
    expect(resultado.map((a) => a.uid)).toEqual(["a2"]);
  });

  it("filtra por UF sem diferenciar maiúscula/minúscula", async () => {
    preparar({
      advogados: {
        a1: { areasAtuacao: [], localizacao: { uf: "SP" } },
        a2: { areasAtuacao: [], localizacao: { uf: "RJ" } },
      },
      users: { a1: BASE_USER, a2: BASE_USER },
    });

    const resultado = await buscarAdvogadosCompativeis({ uf: "sp" });
    expect(resultado.map((a) => a.uid)).toEqual(["a1"]);
  });

  it("filtra por cidade com correspondência parcial", async () => {
    preparar({
      advogados: {
        a1: { areasAtuacao: [], localizacao: { cidade: "São Paulo" } },
        a2: { areasAtuacao: [], localizacao: { cidade: "Rio de Janeiro" } },
      },
      users: { a1: BASE_USER, a2: BASE_USER },
    });

    const resultado = await buscarAdvogadosCompativeis({ cidade: "paulo" });
    expect(resultado.map((a) => a.uid)).toEqual(["a1"]);
  });

  it("exclui advogados suspensos por padrão", async () => {
    preparar({
      advogados: {
        a1: { areasAtuacao: [], localizacao: {} },
        a2: { areasAtuacao: [], localizacao: {} },
      },
      users: { a1: BASE_USER, a2: { ...BASE_USER, status: "suspenso" } },
    });

    const resultado = await buscarAdvogadosCompativeis();
    expect(resultado.map((a) => a.uid)).toEqual(["a1"]);
  });

  it("inclui suspensos quando incluirSuspensos é true (uso do admin)", async () => {
    preparar({
      advogados: { a1: { areasAtuacao: [], localizacao: {} } },
      users: { a1: { ...BASE_USER, status: "suspenso" } },
    });

    const resultado = await buscarAdvogadosCompativeis({ incluirSuspensos: true });
    expect(resultado.map((a) => a.uid)).toEqual(["a1"]);
  });

  it("prioriza quem tem especialidade compatível, sem excluir quem não tem", async () => {
    preparar({
      advogados: {
        semEspecialidade: { areasAtuacao: ["trabalhista"], localizacao: {}, especialidades: [] },
        comEspecialidade: {
          areasAtuacao: ["trabalhista"],
          localizacao: {},
          especialidades: ["horas_extras"],
        },
      },
      users: { semEspecialidade: BASE_USER, comEspecialidade: BASE_USER },
    });

    const resultado = await buscarAdvogadosCompativeis({ categorias: ["horas_extras"] });
    expect(resultado).toHaveLength(2);
    expect(resultado[0].uid).toBe("comEspecialidade");
    expect(resultado[0].especialidadesCompativeis).toBe(1);
    expect(resultado[1].especialidadesCompativeis).toBe(0);
  });

  it("não altera a ordem quando nenhuma categoria é passada", async () => {
    preparar({
      advogados: {
        a1: { areasAtuacao: [], localizacao: {}, especialidades: ["x"] },
        a2: { areasAtuacao: [], localizacao: {}, especialidades: [] },
      },
      users: { a1: BASE_USER, a2: BASE_USER },
    });

    const resultado = await buscarAdvogadosCompativeis();
    expect(resultado[0].especialidadesCompativeis).toBeUndefined();
  });
});
