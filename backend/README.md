# Nocturis — backend

API em Node.js + Express, usando o Firebase Admin SDK para falar com o Firestore
do projeto `nocturis-dev` (sem emulador).

## Rodando localmente

```
cp .env.example .env   # preencha as credenciais do Firebase Admin
npm install
npm run dev
```

Endpoint de verificação: `GET /health`.
