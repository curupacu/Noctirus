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
    features/         auth, triagem, advogados, curriculo, perfil, painel, admin, denuncias
    components/        UI reutilizável (Button, Input, Select, ChoiceCard, BottomNav...)
    lib/               cliente Firebase, hooks, helpers
    routes/
backend/              Node.js + Express — API, IA, validações, admin
  src/
    routes/            endpoints REST (auth, advogados, curriculos, triagem, users, health,
                       denuncias)
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

## Design (regras fixas)

- Estética: app **mobile-first**, moderno e profissional. Nada de navbar genérica.
- **Nunca** cartão branco sobre fundo branco. Sempre contraste e hierarquia visual claros.
- Use os tokens de `frontend/src/styles/tokens.css` (paleta marrom/amarelo da Nocturis).
  Nada de cor chumbada fora dos tokens.
- Ao redesenhar, aplique a mudança **em todas as páginas de uma vez** (Home, Login,
  Cadastro, busca de advogado, etc.) — nunca só uma tela.
- Antes de um redesign grande, **mostre o plano primeiro** (páginas, esquema de cor,
  navbar) e espere aprovação. Não saia editando.
- Depois de mudança de UI: **tire screenshot** de cada página afetada e avalie
  contraste/hierarquia/cara de app antes de dizer que terminou.

## "Concluído" (definição honesta)

- Commit no Git **NÃO** é deploy. Só está "no ar" depois de `firebase deploy`
  rodar de verdade.
- Ao terminar, **liste cada arquivo/etapa** que você tocou. Nada de "pronto" vago.
- Antes de usar uma flag de CLI, confirme que ela existe (ex.: não existe
  `firebase --dry-run`).
- Para deploy: rode, confirme acessando a URL publicada, e cole a saída do comando.

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
  matching de verdade agora.
- **Matching agora usa `especialidades`** (`backend/src/services/matching.js`): quando a
  triagem ou o filtro da listagem pública passam `categorias`, os advogados com
  especialidade compatível sobem pro topo da lista (não filtra os demais fora — o dataset
  do seed é pequeno demais pra filtrar na marra sem zerar resultado às vezes). Os pills de
  categoria no resultado da triagem (`ResultadoPage`) e a listagem pública (`/advogados`,
  que ganhou o mesmo seletor de assunto específico) agora refazem a busca ao marcar/
  desmarcar — antes eram decorativos. Perfil público do advogado também parou de mostrar
  valores crus (`civel`/`trabalhista`) e ganhou rótulo pra seção de especialidades.
- **Sprint 7 (denúncias) concluído**, GR fez as duas partes (GP não ia chegar a tempo):
  endpoint `POST /denuncias` persiste `autorId`/`autorTipo`/`alvoId`/`descricao`/`provaUrl`/
  `status`/`decisao`/`createdAt` no Firestore, com rule liberando leitura só pro autor e pro
  admin (escrita só pelo backend). Sem upload de prova (decisão já registrada no
  ROADMAP.md — Storage saiu do free tier); `provaUrl` aceita opcionalmente um link já
  hospedado em outro lugar. Front em `frontend/src/features/denuncias/DenunciarPage.jsx`
  (rota `/denunciar`, protegida pra cliente/advogado), reaproveitando os mesmos componentes
  e classes do resto do app (sem redesign) — entrada pelo perfil público do advogado
  ("Denunciar este advogado", já pré-preenche o alvo) e pelo `/perfil` ("Denunciar um
  problema", sem alvo específico). Testado ponta a ponta com login real de teste.
- **Sprint 8 (painel admin + moderação) concluído**, GR fez as duas partes de novo: `GET
  /admin/users` lista clientes/advogados (não lista admins — moderação não se aplica entre
  admins), `PATCH /admin/users/:uid/suspender` desativa o login de verdade na Firebase Auth
  além de marcar `status: "suspenso"` no Firestore (não adiantava só marcar um campo que
  ninguém checava), `DELETE /admin/users/:uid` remove definitivamente (Auth + Firestore,
  incluindo `advogados`/`curriculos` se for o caso — dataset é fictício no MVP, sem
  soft-delete). As duas rotas bloqueiam mexer em outro admin. `GET /admin/denuncias` e
  `PATCH /admin/denuncias/:id` (status + anotação de decisão) completam a moderação.
  Front: `AdminUsuariosPage` e `AdminDenunciasPage` novas, reaproveitando a mesma tabela/
  card/badge que `AdminAdvogadosPage` já usava (sem redesign); as três telas de admin agora
  têm um sub-menu (`AdminNav`, componente novo, usa a classe `.pill-toggle` que já existia)
  pra navegar entre OAB/Usuários/Denúncias. Botão "Remover" pede confirmação via
  `window.confirm` antes de chamar o DELETE. Testado ponta a ponta: usuário descartável
  criado, suspenso (login bloqueado de verdade), reativado, removido (some da Auth e do
  Firestore); denúncia de teste criada, listada com nomes resolvidos, marcada como
  resolvida — tudo limpo depois do teste.
- **Correção pós-Sprint-8**: suspender/remover um dos 30 advogados do seed (que só existem
  no Firestore, sem conta na Firebase Auth) derrubava o backend com 500
  (`auth/user-not-found`) — reportado pelo usuário testando na tela. `usersRouter` agora
  ignora especificamente esse erro e segue só atualizando o Firestore. Além disso,
  `buscarAdvogadosCompativeis` (matching) passou a excluir por padrão quem está com
  `status: "suspenso"` — suspender não tinha nenhum efeito visível antes disso, já que os
  advogados fictícios não têm login pra bloquear. Só a rota `/admin/advogados` (o admin
  aprovando OAB) pede `incluirSuspensos: true` pra continuar vendo todo mundo. O perfil
  público (`/advogados/:uid`) também mostra um aviso "Suspenso da plataforma" e esconde os
  botões de contato quando for o caso.
- **Fluxo de decisão da denúncia repensado** (pedido do usuário: a tela só deixava marcar
  "em análise"/"resolvida" sem comunicar nada pro autor). Agora `AdminDenunciasPage` tem
  duas ações claras quando ainda não foi resolvida: "Suspender denunciado e resolver" (chama
  o suspender do alvo e já resolve a denúncia com uma frase padrão, editável antes de
  enviar) e "Resolver sem suspender". A explicação vai pro campo `decisao` da denúncia, que
  o autor agora consegue ver numa tela nova, `MinhasDenunciasPage` (rota
  `/minhas-denuncias`, linkada em `/perfil` e na confirmação do `DenunciarPage`) — antes não
  existia jeito nenhum de o autor acompanhar o que aconteceu com a denúncia dele. Endpoint
  novo: `GET /denuncias/minhas` (sem `orderBy` na query — ordena em memória — pra não
  depender de um índice composto novo no Firestore que eu não conseguiria publicar daqui).
- **Design**: `AdminAdvogadosPage`/`AdminUsuariosPage` tinham a tabela mais larga que o
  card (a coluna de Ações com dois botões lado a lado não cabia) — os botões vazavam pra
  fora da borda branca do card em vez de rolar. Adicionada a classe `.table-scroll`
  (`overflow-x: auto` num `<div>` envolvendo o `<table>`) nas duas telas.
- **Teste de ponta a ponta feito no navegador de verdade** (login real via formulário,
  Firebase Auth de verdade, não atalho): cadastro de cliente → triagem completa → aba
  advogados → cadastro de advogado com OAB → cliente denuncia o advogado pelo perfil
  público → admin aprova a OAB e resolve a denúncia suspendendo o advogado → cliente vê a
  decisão em "Minhas denúncias" → perfil público do advogado mostra "Suspenso da
  plataforma" e esconde o contato. Achou e corrigiu 2 bugs reais nesse processo:
  1. **`BottomNav` tinha uma key duplicada pro papel advogado** — `rotaInicial("advogado")`
     já é `/perfil`, então "Início" e "Perfil" eram dois botões apontando pro mesmo lugar
     com a mesma `key` (React reclamava no console). Agora dedupa por destino; advogado só
     vê um botão que leva ao perfil, não dois iguais.
  2. O bug do card com botão vazando (item acima).
  Zero erros no console do navegador no fluxo inteiro depois dessas correções.
- **3 falhas de segurança nas `firestore.rules` corrigidas e publicadas** (apontadas pelo
  usuário, todas confirmadas reais antes de mexer):
  1. **Advogado conseguia se auto-verificar**: a rule de `advogados/{uid}` deixava o dono
     escrever qualquer campo, inclusive `verificado` — dava pra aprovar a própria OAB direto
     pelo SDK do cliente, sem passar pelo backend (as chaves do Firebase web são públicas
     por design). Agora só admin muda `verificado`/`oab`.
  2. **Vazamento de dado pessoal (LGPD)**: `users/{uid}` liberava leitura pra qualquer
     usuário logado — todo mundo lia e-mail/telefone de todo mundo. Agora só o dono e o
     admin leem.
  3. **Usuário suspenso conseguia se reativar sozinho**: a rule só travava a troca do campo
     `role`, não do `status`. Agora `status` também só muda pelo admin.
  Publicado de verdade em produção via `firebase deploy --only firestore:rules` (o usuário
  precisou trocar de conta Google — a que tinha usado antes não era dona do projeto
  `nocturis-web`). Verificado com ataques reais contra o Firestore ao vivo, usando a REST
  API com token de usuário de teste descartável (não Admin SDK, que ignora as rules): os
  três ataques agora tomam 403, e as edições legítimas (advogado editando especialidades,
  usuário editando o próprio nome) continuam funcionando normalmente.
- **Contas de teste**: as contas antigas (mistura de testes reais dos integrantes) foram
  apagadas e recriadas como 3 contas limpas — `admin.teste@example.com`,
  `cliente.teste@example.com`, `advogado.teste@example.com` (senhas com o integrante que
  pediu o reset). Usar essas pra qualquer teste manual daqui pra frente.
- **Sprint 9 (testes automatizados), parte do GR concluída**: Vitest no `backend/`
  (`npm test`, ou `npm test` na raiz que delega pro backend). 35 testes em 4 arquivos,
  colocados do lado do código que testam:
  - `services/oab.test.js` — validação de formato de OAB (limites de dígitos, UF válida).
  - `services/triagem.test.js` — `classificarPorRegras` (o fallback que garante que a
    triagem nunca trava, RNF003: classificação por área, detecção de subcategoria,
    sugestão de tipo de advogado) + checagem estrutural da taxonomia (33 categorias, sem
    duplicata).
  - `middlewares/auth.test.js` — `requireRole` (autorização por papel).
  - `services/matching.test.js` — `buscarAdvogadosCompativeis` com um Firestore falso
    (`vi.mock` + `vi.hoisted`, sem precisar de credencial real): filtro por área/UF/cidade,
    exclusão de suspenso por padrão, `incluirSuspensos` pro admin, ordenação por
    especialidade — é a lógica onde já apareceram bugs reais antes, então funciona como
    teste de regressão.
  Rodar sem precisar de `service-account.json`: os módulos que tocam Firebase Admin
  (`oab.js`, `auth.js`, `matching.js`) são mockados nos testes, então qualquer um do time
  roda `npm test` sem configurar credencial nenhuma.
- **CI configurado** (`.github/workflows/ci.yml`) — roda em todo push pra `main`/`develop`
  e em toda PR. Dois jobs paralelos, cada um só instala/roda dentro da própria pasta
  (`backend`/`frontend`), sem precisar de nenhum secret (nada toca Firebase de verdade):
  `backend-test` (`npm ci` + `npm test`) e `frontend-check` (`npm ci` + `npm run lint` +
  `npm run build`, confirmado que builda mesmo sem o `.env` que não vem commitado). **Não
  cobre**: preview automático por PR (isso é infra de deploy, item separado do roadmap,
  ainda não existe).
- **Falta** (Sprint 9): testes de integração via HTTP nas rotas do Express (supertest ou
  equivalente) e o item do GC (documentar testes/validações).
- **`nocturis-prod` ainda não existe de verdade** — o `.firebaserc` já tem o alias, mas hoje
  tanto dev quanto o "deploy no ar" apontam pro mesmo projeto `nocturis-web`. Criar o projeto
  de produção separado é decisão pendente.

## Escopo do MVP (Fase 1)

Cadastro/login por papel, perfil + currículo do advogado, contato direto (WhatsApp/e-mail),
triagem por perguntas guiadas + matching por área/localização, tudo responsivo e com
advogados de exemplo (seed) para demonstração. Denúncias e painel admin ficam para depois
da 1ª apresentação. Triagem + matching é o núcleo inegociável — ver detalhes em
`docs/ROADMAP.md`.
