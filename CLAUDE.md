# CLAUDE.md

Guia para trabalhar no repositório do **Nocturis** — advocacia virtual com triagem e
direcionamento jurídico (cível e trabalhista). Projeto da Aggrem, TCC do curso Técnico
em Desenvolvimento de Sistemas (ETEC de Heliópolis). Ver `docs/ROADMAP.md` para o plano
completo de sprints, modelo de dados e decisões de arquitetura.

## Stack travada

- **Frontend**: React + Vite + React Router (`frontend/`). Identidade visual própria da
  Nocturis (coruja, tons marrom/amarelo) — não confundir com a marca Aggrem (roxo).
- **Backend**: Node.js + Express (`backend/`), usando o Firebase Admin SDK. Concentra
  tudo que é sensível: chamada de IA, validação de OAB, custom claims, operações de admin.
- **Auth**: Firebase Authentication + custom claims (papéis: `cliente`, `advogado`, `admin`).
- **Banco**: Cloud Firestore — **não MySQL**, apesar do que documentação antiga possa dizer.
- **IA de triagem** (Fase 2): Google Gemini Flash-Lite, chamado só pelo backend, com
  fallback por regras se falhar ou passar de 5s.
- Dois projetos Firebase: `nocturis-web` (desenvolvimento) e `nocturis-prod` (produção).
  Sem emulador local — o backend aponta direto para o projeto `nocturis-web` na nuvem.

## Estrutura do repositório

```
frontend/            React (Vite) — telas, componentes, design system Nocturis
  src/
    features/         auth, triagem, advogados, denuncias, admin
    components/        UI reutilizável (botão, input, card...)
    lib/               cliente Firebase, hooks, helpers
    routes/
backend/              Node.js + Express — API, IA, validações, admin
  src/
    routes/            endpoints REST
    services/          triagem/Gemini, OAB, matching
    middlewares/        verificação de token, papéis
    lib/               firebase-admin
database/             Firestore: regras, índices, seed e docs do modelo
  firestore.rules
  firestore.indexes.json
  seed/                scripts pra popular advogados fictícios
docs/                 ROADMAP.md e demais documentos
```

## Convenções

- **Branches**: `main` protegida (deploy só em marco) · `develop` (integração) ·
  `feature/<nome>` por tarefa → PR → preview → merge na `develop`.
- **Commits**: `tipo: descrição` (ex.: `feat: triagem com Gemini`, `fix: validação da OAB`).
- **Segurança**: papéis vêm de custom claims (nunca de campo público no Firestore); as
  security rules negam tudo por padrão e liberam por papel.
- **Node**: versão fixada em `.nvmrc` (22 LTS). Rode `nvm use` antes de trabalhar no repo.

## Rodando localmente

Na raiz: `npm run dev` sobe frontend e backend juntos (via `concurrently`).

## Status do deploy

- **Frontend (Firebase Hosting, projeto `nocturis-web`):** https://nocturis-web.web.app
- **Backend (Render):** https://noctirus-backend.onrender.com — health check em `/health`.
  Free tier: dorme após inatividade, primeira requisição pode demorar ~30-60s.
- **Sprint 1 (fundação)** concluído: scaffold de frontend/backend, rotas, design system,
  Firebase (Auth + Firestore) configurado, deploy inicial no ar. Falta só CI de preview
  automático por PR (não bloqueia o Sprint 2).
- **Sprints 2–4 (auth, currículo/perfil, matching)** concluídos e no ar: cadastro/login por
  papel + custom claims, security rules por papel, OAB validada por formato/unicidade
  (verificação real fica manual pelo admin — sem API gratuita disponível, ver
  `docs/ROADMAP.md`), admin criado via `database/seed/criar-admin.js` (sem cadastro
  público), CRUD de currículo, perfil público do advogado com contato (WhatsApp/e-mail),
  listagem de advogados com filtro por área/localização. UI propositalmente simples, sem
  foto/bio/upload de PDF (ficou pra quando o Blaze for ativado — ver decisão registrada).
  `frontend/.env.production` fixa a `VITE_API_URL` pro backend do Render no build de
  produção (o `.env` normal aponta pro backend local).
- **`nocturis-prod` ainda não existe de verdade** — o `.firebaserc` já tem o alias, mas hoje
  tanto dev quanto o "deploy no ar" apontam pro mesmo projeto `nocturis-web`. Criar o projeto
  de produção separado é decisão pendente.

## Escopo do MVP (Fase 1)

Cadastro/login por papel, perfil + currículo do advogado, contato direto (WhatsApp/e-mail),
triagem por perguntas guiadas + matching por área/localização, tudo responsivo e com
advogados de exemplo (seed) para demonstração. Denúncias e painel admin ficam para depois
da 1ª apresentação. Triagem + matching é o núcleo inegociável — ver detalhes em
`docs/ROADMAP.md`.
