# Nocturis — database

Banco de dados: **Cloud Firestore** (Firebase), sem emulador local — aponta direto
para o projeto `nocturis-web` na nuvem. Não existe `nocturis-prod` separado ainda
(ver `docs/ROADMAP.md`).

- `firestore.rules` — regras de segurança (nega tudo por padrão, libera por papel via custom claims).
- `firestore.indexes.json` — índices compostos do Firestore.
- `schema.md` — modelo de dados por coleção.
- `seed/lawyers.json` — 30 advogados fictícios (nome, OAB, áreas, especialidades, localização,
  currículo) cobrindo os 33 valores da taxonomia de categorias e 14 estados diferentes.
- `seed/seed.js` — lê `lawyers.json` e cria, pra cada advogado, um documento em `users/`,
  `advogados/` e `curriculos/`. **Não cria conta de login (Firebase Auth)** — são só perfis pra
  demonstração/navegação, não dá pra logar como esses advogados. Roda de novo sempre cria
  documentos novos (não faz upsert por nome/OAB).
- `seed/criar-admin.js` — cria um usuário admin de verdade (com login) direto no Firebase Auth +
  Firestore, já que não existe cadastro público pra esse papel.
  Uso: `node database/seed/criar-admin.js <email> <senha> <nome>`.

Ambos os scripts rodam a partir da **raiz do repo** (não daqui) e precisam de
`GOOGLE_APPLICATION_CREDENTIALS` e `FIREBASE_PROJECT_ID` no ambiente, por exemplo:

```
GOOGLE_APPLICATION_CREDENTIALS=./backend/service-account.json FIREBASE_PROJECT_ID=nocturis-web \
  node database/seed/seed.js
```
