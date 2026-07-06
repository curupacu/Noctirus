# Nocturis — database

Banco de dados: **Cloud Firestore** (Firebase), sem emulador local — aponta direto
para o projeto `nocturis-dev` na nuvem.

- `firestore.rules` — regras de segurança (nega tudo por padrão, libera por papel via custom claims).
- `firestore.indexes.json` — índices compostos do Firestore.
- `seed/seed.js` — popula advogados fictícios para demonstração.
- `seed/criar-admin.js` — cria o usuário admin (não existe cadastro público pra admin).
  Uso: `node database/seed/criar-admin.js <email> <senha> <nome>` (requer
  `GOOGLE_APPLICATION_CREDENTIALS` e `FIREBASE_PROJECT_ID` no ambiente).
