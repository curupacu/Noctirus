// Fake do Firebase Admin (Auth + Firestore) só com o que as rotas usam, pros testes de
// integração rodarem com supertest sem precisar de service-account.json nem tocar o
// Firestore de verdade. Cada teste chama `criarFakeFirebase()` e o injeta via
// `vi.mock("../lib/firebase-admin.js", ...)` (ver routes/*.integration.test.js).

function getByPath(objeto, caminho) {
  return caminho.split(".").reduce((atual, chave) => (atual == null ? undefined : atual[chave]), objeto);
}

function setByPath(objeto, caminho, valor) {
  const partes = caminho.split(".");
  const ultima = partes.pop();
  let atual = objeto;
  for (const parte of partes) {
    atual[parte] = { ...(atual[parte] || {}) };
    atual = atual[parte];
  }
  atual[ultima] = valor;
}

export function criarFakeFirebase() {
  const colecoes = {};
  let contador = 0;

  function colecao(nome) {
    if (!colecoes[nome]) colecoes[nome] = {};
    return colecoes[nome];
  }

  function docRef(nome, id) {
    return {
      id,
      async get() {
        const dados = colecao(nome)[id];
        return { exists: dados !== undefined, id, data: () => dados };
      },
      async set(dados) {
        colecao(nome)[id] = { ...dados };
      },
      async update(parcial) {
        const col = colecao(nome);
        const atual = { ...(col[id] || {}) };
        for (const [chave, valor] of Object.entries(parcial)) {
          setByPath(atual, chave, valor);
        }
        col[id] = atual;
      },
      async delete() {
        delete colecao(nome)[id];
      },
    };
  }

  function query(nome, filtros, ordenacao) {
    return {
      where: (campo, op, valor) => query(nome, [...filtros, { campo, op, valor }], ordenacao),
      orderBy: (campo, direcao = "asc") => query(nome, filtros, { campo, direcao }),
      async get() {
        let entradas = Object.entries(colecao(nome));
        for (const { campo, op, valor } of filtros) {
          entradas = entradas.filter(([, dados]) => {
            const real = getByPath(dados, campo);
            if (op === "==") return real === valor;
            if (op === "in") return valor.includes(real);
            throw new Error(`fakeFirebase: operador não suportado "${op}"`);
          });
        }
        if (ordenacao) {
          entradas = [...entradas].sort((a, b) => {
            const va = getByPath(a[1], ordenacao.campo);
            const vb = getByPath(b[1], ordenacao.campo);
            const cmp = va < vb ? -1 : va > vb ? 1 : 0;
            return ordenacao.direcao === "desc" ? -cmp : cmp;
          });
        }
        return { docs: entradas.map(([id, dados]) => ({ id, data: () => dados })) };
      },
    };
  }

  const db = {
    collection(nome) {
      return {
        doc: (id) => docRef(nome, id ?? `auto${++contador}`),
        where: (campo, op, valor) => query(nome, [{ campo, op, valor }]),
        orderBy: (campo, direcao) => query(nome, []).orderBy(campo, direcao),
        async get() {
          return query(nome, []).get();
        },
        async add(dados) {
          const id = `auto${++contador}`;
          colecao(nome)[id] = { ...dados };
          return docRef(nome, id);
        },
      };
    },
    batch() {
      const pendentes = [];
      return {
        delete: (ref) => pendentes.push(() => ref.delete()),
        async commit() {
          for (const operacao of pendentes) await operacao();
        },
      };
    },
    // Acesso direto pros testes semearem dados sem passar pela API.
    _seed(nome, id, dados) {
      colecao(nome)[id] = { ...dados };
    },
  };

  const usuariosAuth = new Set();

  const auth = {
    // Token de teste: base64 do JSON { uid, role, email }. `criarToken()` abaixo monta.
    async verifyIdToken(token) {
      try {
        return JSON.parse(Buffer.from(token, "base64").toString("utf8"));
      } catch {
        throw new Error("token de teste inválido");
      }
    },
    async setCustomUserClaims() {},
    async updateUser(uid) {
      if (!usuariosAuth.has(uid)) {
        const erro = new Error("no user record");
        erro.code = "auth/user-not-found";
        throw erro;
      }
    },
    async deleteUser(uid) {
      if (!usuariosAuth.has(uid)) {
        const erro = new Error("no user record");
        erro.code = "auth/user-not-found";
        throw erro;
      }
      usuariosAuth.delete(uid);
    },
    // Só pros testes: registra um uid como "existente" na Auth (advogados do seed não têm
    // conta — ver ignorarSeUsuarioNaoExisteNaAuth em routes/users.js).
    _registrarUsuario(uid) {
      usuariosAuth.add(uid);
    },
  };

  function criarToken({ uid, role, email = `${uid}@example.com` }) {
    return Buffer.from(JSON.stringify({ uid, role, email })).toString("base64");
  }

  return { db, auth, criarToken };
}
