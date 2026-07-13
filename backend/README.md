# Nocturis — backend

API em Node.js + Express, usando o Firebase Admin SDK para falar com o Firestore
do projeto `nocturis-web` (sem emulador — aponta direto pra nuvem).

Concentra tudo que é sensível: chamada da IA (Gemini), validação de OAB, custom claims e
operações de admin. O frontend nunca fala direto com o Firestore pra essas operações.

## Rodando localmente

```
cp .env.example .env   # preencha as credenciais do Firebase Admin (ver abaixo)
npm install
npm run dev             # node --watch, reinicia sozinho a cada mudança
```

Endpoint de verificação: `GET /health`.

## Variáveis de ambiente (`.env`)

- `PORT` — porta do Express (padrão `3001`).
- `FIREBASE_PROJECT_ID` — hoje sempre `nocturis-web` (não existe `nocturis-prod` de verdade
  ainda, ver `docs/ROADMAP.md`).
- `GOOGLE_APPLICATION_CREDENTIALS` — caminho pro JSON da service account (Firebase Console >
  Configurações do projeto > Contas de serviço > Gerar nova chave privada). Não é commitado.
- `GEMINI_API_KEY` — chave do Google AI Studio pra triagem por IA. **Opcional**: sem ela, a
  triagem cai direto no fallback por regras e o backend funciona normalmente.
- `GEMINI_MODEL` — opcional, padrão `gemini-2.5-flash-lite`.

## Estrutura

```
src/
  routes/        endpoints REST (auth, advogados, curriculos, triagem, users, health)
  services/      triagem.js (taxonomia + classificação IA/regras), oab.js, matching.js
  middlewares/   verificação de token e papel
  lib/           firebase-admin.js
```

## Scripts úteis (fora do `npm run dev`)

Rodados a partir da raiz do repo, não daqui — ver `database/README.md`:
`database/seed/seed.js` (popula advogados fictícios) e
`database/seed/criar-admin.js` (cria o usuário admin, sem cadastro público pra esse papel).
