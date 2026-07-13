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
    features/         auth, triagem, advogados, curriculo, perfil, painel, admin
                       (denuncias ainda NÃO existe — ver "Escopo do MVP" abaixo)
    components/        UI reutilizável (Button, Input, Select, ChoiceCard, BottomNav...)
    lib/               cliente Firebase, hooks, helpers
    routes/
backend/              Node.js + Express — API, IA, validações, admin
  src/
    routes/            endpoints REST (auth, advogados, curriculos, triagem, users, health)
    services/          triagem/Gemini, OAB, matching
    middlewares/        verificação de token, papéis
    lib/               firebase-admin
database/             Firestore: regras, índices, seed e docs do modelo
  firestore.rules
  firestore.indexes.json
  seed/                lawyers.json (30 advogados fictícios) + seed.js + criar-admin.js
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
  automático por PR (não bloqueia o Sprint 2) — **ainda não existe** (`.github/workflows`
  não existe no repo).
- **Sprints 2–4 (auth, currículo/perfil, matching)** concluídos e no ar: cadastro/login por
  papel + custom claims, security rules por papel, OAB validada por formato/unicidade
  (verificação real fica manual pelo admin — sem API gratuita disponível, ver
  `docs/ROADMAP.md`), admin criado via `database/seed/criar-admin.js` (sem cadastro
  público), CRUD de currículo, perfil público do advogado com contato (WhatsApp/e-mail),
  listagem de advogados com filtro por área/localização. Sem foto/bio/upload de PDF (ficou
  pra quando o Blaze for ativado — ver decisão registrada).
  `frontend/.env.production` fixa a `VITE_API_URL` pro backend do Render no build de
  produção (o `.env` normal aponta pro backend local — precisa existir localmente com as
  credenciais do Firebase Web App pra rodar `npm run dev`, não vem commitado).
- **Sprint 5 (triagem híbrida com Gemini) e parte do Sprint 6 já concluídos**, adiantados
  em relação ao cronograma original (previsto pra 04–17/08, entregue em 08/07): endpoint
  `POST /triagem/classificar` com Gemini Flash-Lite + fallback por regras (RNF003), árvore
  de perguntas condicional, categorias/subcategorias detalhadas por área, e especialidades
  do advogado reaproveitando essa taxonomia (feature nova, fora do escopo original). Ver
  `docs/ROADMAP.md` pra detalhes. Falta do Sprint 6: rodar casos de teste reais pra afinar
  o *prompt* (GC).
- **Passe de UX do Sprint 6 (GP) adiantado pelo GR**: todas as telas do fluxo principal
  aplicam o design system base (`components/Button`, `Input`, `Select`, mais classes
  utilitárias `card`, `stack`, `row`, `badge`, `chip`/`chip-list`, `actions` em `index.css`).
  `/painel` deixou de ser placeholder — é um dashboard com atalho pra triagem e últimas
  triagens do cliente.
- **Segunda rodada de redesign (referência Bumble)**: Home, Login, Cadastro e a busca
  pública de advogados (`/advogados`) receberam um redesign completo — layout mobile-first
  em tela cheia (sem `Header` nem card flutuando nas telas de auth, ver
  `main.auth-screen`/`main.splash` em `index.css`), botões pill full-width, `BottomNav` pra
  navegação de quem está logado, `ChoiceCard` e `.pill-toggle` pra seleção em vez de
  `<select>` nativo. **O resto das telas (Painel, Perfil, currículo, perfil público do
  advogado, resultado da triagem, admin) ainda está no nível do passe anterior** — funciona
  e usa as cores/componentes certos, mas não tem esse mesmo tratamento visual. É o item mais
  urgente em aberto — ver "Pontos fracos" no README da raiz.
- **Taxonomia de categorias expandida** (`backend/src/services/triagem.js`): cível foi de 7
  pra 17 subcategorias, trabalhista de 5 pra 16 (33 no total) — muito mais granular pra IA,
  fallback por regras e especialidades de advogado. `ResultadoPage` troca o
  antigo combo "adicionar categoria" por um grid de `.pill-toggle` (toca pra marcar/desmarcar).
  Falta rodar casos de teste reais pra validar a taxa de acerto (item pendente do Sprint 6).
- **Seed de advogados ampliado**: `database/seed/lawyers.json` foi de 5 pra 30 advogados
  fictícios, cobrindo os 33 valores da taxonomia nova e 14 estados — dá pra testar filtro e
  matching de verdade agora. **Matching ainda não usa `especialidades`**, só área + cidade/UF
  (`backend/src/services/matching.js`) — é um item de prioridade média em aberto.
- **Contas de teste**: as contas antigas (mistura de testes reais dos integrantes) foram
  apagadas e recriadas como 3 contas limpas — `admin.teste@example.com`,
  `cliente.teste@example.com`, `advogado.teste@example.com` (senhas com o integrante que
  pediu o reset). Usar essas pra qualquer teste manual daqui pra frente.
- **Sem testes automatizados e sem CI** — nenhum arquivo de teste no repo, sem script
  `test` nos `package.json`. Previsto pro Sprint 9.
- **`nocturis-prod` ainda não existe de verdade** — o `.firebaserc` já tem o alias, mas hoje
  tanto dev quanto o "deploy no ar" apontam pro mesmo projeto `nocturis-web`. Criar o projeto
  de produção separado é decisão pendente.

## Escopo do MVP (Fase 1)

Cadastro/login por papel, perfil + currículo do advogado, contato direto (WhatsApp/e-mail),
triagem por perguntas guiadas + matching por área/localização, tudo responsivo e com
advogados de exemplo (seed) para demonstração. Denúncias e painel admin ficam para depois
da 1ª apresentação. Triagem + matching é o núcleo inegociável — ver detalhes em
`docs/ROADMAP.md`.
