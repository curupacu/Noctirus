# Nocturis — database

Banco de dados: **Cloud Firestore** (Firebase), sem emulador local — aponta direto
para o projeto `nocturis-dev` na nuvem.

- `firestore.rules` — regras de segurança (nega tudo por padrão, libera por papel via custom claims).
- `firestore.indexes.json` — índices compostos do Firestore.
- `seed/` — scripts para popular advogados fictícios para demonstração.
