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
- **Um único projeto Firebase**, `nocturis-web`, usado tanto pra desenvolvimento quanto pro
  deploy que a banca vê — decisão consciente (30/07), não pendência: ver nota em "Status do
  deploy" abaixo. Sem emulador local — o backend aponta direto pra ele na nuvem.

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
- **Casos de teste reais rodados contra a triagem (28/07)** — item pendente do Sprint 6:
  `backend/scripts/avaliar-triagem.js` (`npm run avaliar-triagem` no `backend/`) manda 20
  descrições reais só com texto livre (sem respostas guiadas, pra estressar o *prompt* de
  verdade) pro `classificar()` e mede acerto de área/categoria. Resultado: **95% de acerto
  de área, 90% de categoria**; nas 7 vezes que a IA rodou de verdade, acertou **7/7** — o
  *prompt* está bom, não precisou mexer nele. Os 2 erros que sobraram eram os dois gaps
  pontuais do fallback por regras (corrigidos: `assedio_moral` e a área trabalhista em
  geral não pegavam descrições tipo "meu chefe... me humilha" sem a palavra técnica
  "assédio" — adicionado "chefe"/"humilha"/"constrangimento" nas listas de palavras-chave
  de área e categoria).
  **Achado mais importante que o *prompt* em si**: rodando o script, a API retornou erro
  429 informando cota de **20 requisições/dia** pro `gemini-2.5-flash-lite` nesse projeto
  — bem abaixo dos ~1.500/dia documentados no `ROADMAP.md` (ver seção 8 lá, item
  atualizado com 🔴). Além disso, o `catch` de `classificar()` engolia esse erro em
  silêncio (sem log nenhum) — agora loga `"triagem: IA falhou, usando fallback por
  regras — <motivo>"`, pra dar pra confirmar isso pelos logs do Render antes da
  apresentação. **Risco real pra 13/08**: testar a triagem repetidamente pode esgotar a
  cota do dia e a demonstração cair inteira no fallback por regras sem nenhum aviso na
  tela — ver mitigação no `ROADMAP.md`.
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
- **Sprint 9 (testes de integração) concluído**: `backend/src/app.js` separa a criação do
  Express `app` do `app.listen()` (que ficou só em `src/index.js`) — sem isso, importar o
  `app` nos testes já subia um servidor de verdade numa porta. `backend/src/test-utils/
  fakeFirebase.js` centraliza um fake de Firestore (coleções em memória, com `where`/
  `orderBy`/`batch`) e Auth (token de teste decodificável, registro de quem "existe" na
  Auth) reaproveitado pelos 6 arquivos `routes/*.integration.test.js` novos — cobrem toda
  rota HTTP das 6 áreas (auth, advogados, users/admin, triagem, denúncias, currículos):
  401/403 por papel, validação de corpo, 404/409 de regra de negócio, e o efeito real no
  Firestore fake após a chamada (ex.: currículo atualizado, denúncia com autorId certo,
  advogado do seed sem conta na Auth suspendendo sem quebrar). 68 testes novos, mais os 35
  já existentes = 103 no total (`npm test`, roda sem `service-account.json`). **Falta**: o
  item do GC (documentar testes/validações).
- **Decidido não criar `nocturis-prod` separado (30/07)** — o `.firebaserc` mantém o alias
  como registro do plano original, mas dev e "deploy no ar" seguem no mesmo projeto
  `nocturis-web` de propósito. A separação existe pra isolar teste de dado real (evitar
  poluir o que usuários reais veem enquanto o time mexe em dev); aqui os advogados são
  fictícios (seed) e as contas de teste já foram recriadas do zero quando precisou — não
  há dado real em risco, então o custo de manter um segundo projeto Firebase não se paga
  pro MVP do TCC. Revisitar só se o projeto virar produto real (Fase 4).
- **Tema claro/escuro + redesign estendido pro resto do app (29/07)**: pedido do usuário foi
  inverter a direção do `DESIGN.md` — em vez de só o tema escuro fixo, o app agora abre no
  **claro** (fundo bege quase-branco, `#F7F2E7`) com um botão (ícone sol/lua no header, e nas
  telas de auth que não têm header) que liga o escuro (os tokens antigos, inalterados). Tudo
  guardado em `localStorage` (`lib/theme.js`), aplicado antes do React montar via script inline
  no `index.html` (evita flash do tema errado). Em `styles/tokens.css`: dourado, marrons e a cor
  do header (`--surface-warm`) ficam **fixos** nos dois temas (identidade da marca); só fundo/
  superfície/texto trocam. Achado no caminho: a logo teria ficado ilegível no tema claro (o
  traçado do nome "Nocturis" tinha `fill="white"` fixo dentro do SVG) — resolvido convertendo
  `<img>` pra um componente `Logo.jsx` inline com esse traçado em `currentColor`, herdando a cor
  do texto do tema.
  Aproveitando a pausa pra redesign, as telas que ainda estavam na estrutura antiga (Painel,
  Perfil, Currículo, perfil público do advogado, Resultado da triagem, Minhas triagens,
  Denunciar, Minhas denúncias) ganharam o mesmo tratamento das telas já redesenhadas — menos
  "cards em caixa" empilhados, mais hierarquia (`.list-row`/`.section-heading` novos em
  `index.css`). Criado `AdvogadoCard` (componente compartilhado) pra listagem pública e
  resultado da triagem pararem de ter duas marcações quase-idênticas do mesmo card de advogado.
  `TriagemPage` ganhou um resumo em chips das respostas escolhidas antes do campo de descrição
  (referência: padrão de "revisão antes de enviar" de formulários multi-etapa). Admin (3 telas)
  não foi alterado estruturalmente — só herda os tokens novos automaticamente — porque não havia
  como testar logado como admin nesta sessão (sem a senha da conta de teste). Testado ao vivo no
  Chrome nos dois temas: Home, Login, Cadastro, Advogados, Painel, Perfil, Triagem, Resultado,
  Minhas triagens, perfil público do advogado, Denunciar, Minhas denúncias — sem erro no
  console, `npm run lint` e `npm run build` do frontend limpos. **Não verificado nesta sessão**:
  as 3 telas de admin ao vivo (viewport mobile foi validado manualmente pelo usuário em
  30/07 — ver nota abaixo sobre a ferramenta de resize).
- **Viewport mobile confirmado manualmente (30/07)**: a ferramenta de resize de janela do
  Chrome usada nas sessões de automação não funciona neste ambiente (`resize_window` reporta
  sucesso mas `window.innerWidth` não muda — confirmado de novo nesta sessão, mesmo problema
  do commit `8c1efee`). Sem jeito de emular viewport mobile por aqui, o usuário testou o app
  manualmente (janela estreitada/celular de verdade) e confirmou que o espaçamento/indentação
  está OK, incluindo a área do botão sticky perto do `BottomNav` corrigida naquele commit.
  Segue sem confirmação automatizada — se a ferramenta de resize voltar a funcionar, vale
  revisitar com screenshots de verdade.
- **Auditoria de UX/UI publicada (29/07)**: pedido do usuário pra entender por que o design
  "não é tão bonito e chamativo" e por que o card de advogado "dá zero vontade de clicar mesmo
  com a informação lá". Pesquisa sobre padrões genéricos de design gerado por IA + o que
  constrói confiança em diretórios de profissionais/marketplaces, aplicada em cima de
  screenshots reais do app (não teórico). Achado central: bastante disso não era CSS, era
  ausência de dado — não existia foto, bio nem prova social no modelo de `advogados/{uid}`.
  Publicado como artifact, não fica versionado no repo.
  A partir do relatório, 4 correções entraram nesta sessão:
  1. **Avatar com iniciais coloridas** em vez do ícone de silhueta genérica (pior opção da
     escala, pior que iniciais) — `lib/avatarColor.js`, paleta fixa fora do dourado de acento.
  2. **Hierarquia nos chips de especialidade** — só a primeira em destaque dourado, resto
     neutro, `+N` pro excedente (o `.chip` padrão tinha tingimento dourado em tudo, diluindo
     "dourado com parcimônia").
  3. **Campo `bio`** (texto livre, até 240 caracteres) em `advogados/{uid}` — editável no
     `PerfilPage`, exibido no topo do perfil público e como linha truncada no `AdvogadoCard`.
  4. **Contador `vezesSugerido`** — soma 1 pra cada advogado retornado como compatível toda vez
     que `POST /triagem/classificar` roda (leitura+escrita simples, não `FieldValue.increment`,
     de propósito: contador de popularidade não crítico, funciona igual contra o fake de
     testes). Exibido como badge "Em N triagens" — copy deliberadamente neutra, não é avaliação
     de cliente, é só frequência de match do algoritmo.
  5. **Upload de foto real via Cloudinary** — `POST /advogados/:uid/foto` (multer em memória,
     5MB, valida imagem, recorte 400x400 com `gravity: face`, `public_id` = uid com
     `overwrite: true`). Componente `Avatar` compartilhado decide foto > iniciais coloridas.
     Cloudinary configurado via 3 variáveis novas em `backend/.env` (não commitado). Testado em
     3 camadas sem senha de advogado (o sistema bloqueou corretamente uma tentativa de gerar
     token pra personificar a conta de teste): 5 testes de integração novos com Cloudinary
     mockado (109 no total), upload real direto confirmando as credenciais, e o caminho de
     exibição verificado ao vivo associando uma foto de teste ao advogado de teste via
     Firestore (revertido depois — não ficou foto de teste no ar).
- **Cota do Gemini reconfirmada (30/07)**: `npm run avaliar-triagem` (backend/) rodado de
  novo, sem erro 429 dessa vez — os 20 casos foram classificados pela IA de verdade (nenhum
  caiu no fallback por regras). Resultado **100% de acerto de área, 100% de categoria**
  (melhora em relação ao 95%/90% de 28/07, provavelmente reflexo dos ajustes de palavras-
  chave feitos depois daquela rodada). Como o script sozinho já consome as ~20
  requisições/dia da cota, **não repetir esse teste no mesmo dia** — evita esgotar a cota
  à toa antes da apresentação de 13/08.
- **Redesign visual completo (07/08)**: pesquisa de referência (sites de advocacia
  premiados — Quinn Emanuel, Kauff McGuire & Margolis, Barr & Douds, BCR Law) + plano
  aprovado pelo usuário, executado em 3 fases (P0: Home/Login/Cadastro/Triagem/
  Resultado/Advogados; P1: Perfil público, Painel, Perfil; P2: Denúncias, admin ×3) — as
  12 telas do MVP inteiras. Decisão de direção ("vitrine escura, app claro"): Home, Login e
  Cadastro ficam **sempre** no visual noturno da coruja (fundo `--ink-950` fixo via seletor
  `main.splash, main.auth-screen` no `index.css`, sem `ThemeToggle` nessas telas — decisão
  deliberada, não regressão do tema claro de 29/07); o resto do app continua claro por
  padrão como já decidido, com escuro opcional. Principais mudanças, todas em
  `frontend/src/`:
  - **`components/OwlMark/`** (novo): silhueta achatada de um tom só, reaproveitando os
    paths da coruja que já existiam no `Logo.jsx` — substitui o padrão abstrato de
    anel+bolinha que existia em `.hero-block::before`/`main.splash` (achado do usuário:
    "não gostei", "ruim"). Ajustada 2x depois de feedback: a 1ª versão cortava demais e em
    telas baixas sobrava só ponta de pena sem os olhos (lia como bug); corrigido reduzindo
    o corte e trocando `top/right` em `%` (relativos à altura variável do container) por
    `transform: translate()` (relativo ao tamanho da própria coruja) — testado forçando
    alturas de container até 180px via DOM.
  - **Sombras suavizadas**: `--shadow-sm`/`--shadow-md`/`--shadow-up` (novo, pro
    BottomNav/CTA sticky) substituindo o `--shadow` único a 75% de opacidade usado igual
    em tudo (achado do usuário: "sombra muito forte").
  - **Paleta clara ajustada** (achado do usuário: "cinza estranho", "amarelo catarro"):
    `--gold` `#F2D98A`→`#D9A23A` (mais denso, menos pastel), `--border` `#DBCBA3`→`#E4E0D7`
    (neutro de verdade em vez de caqui disfarçado de cinza), `--surface`
    `#EFE6D3`→`#FFFFFF` (card branco sobre fundo creme — desvio deliberado e aprovado da
    letra do `docs/DESIGN.md` original, que pedia "nunca card branco"; aqui não é
    branco-sobre-branco, o fundo continua creme), `--bg`/`--surface-hover` também
    ajustados. Ver `docs/DESIGN.md` (nota no topo) pra os valores atuais.
  - **`.badge--seal`** (novo): selo neutro com ícone de check substituindo o badge dourado
    sólido de "OAB verificada"/"resolvida"/"ativo"/"verificada" em toda listagem/tabela
    onde aparecia repetido (`AdvogadoCard`, perfil público, Perfil, Minhas denúncias,
    3 telas de admin) — dourado sólido ficou só pro badge de classificação da IA (1 por
    tela), que é a regra "dourado com parcimônia" que o próprio `DESIGN.md` já pedia.
  - **`.eyebrow`** (novo): rótulo pequeno de contexto acima de título/seção — "Passo N de
    3" (Triagem), "Triagem concluída" (Resultado), contagem de resultados (Advogados,
    Minhas denúncias), "Administração" (as 3 telas de admin).
  - **Bug real corrigido no processo**: `main.auth-screen` nunca tinha uma regra `color`
    própria (diferente de `main.splash`, que já tinha) — texto sem classe própria (ex.:
    rodapé "Não tem conta?" do Login) herdava o `color` já resolvido lá do `body` no tema
    claro, ficando ilegível na vitrine escura. Também: os aliases `--color-*` só reagem a
    um token base redefinido (`--text`, `--bg`...) se forem redeclarados na mesma regra —
    herdar de um ancestral não basta, porque a resolução do `var()` acontece no elemento
    onde o alias foi declarado, não em quem herda.
  - Deploy real no Firebase Hosting em 3 rodadas (uma por fase), confirmado acessando
    https://nocturis-web.web.app depois de cada uma — comando e saída sempre colados no
    chat, como este documento pede.
- **Banco de dados resetado e repopulado (07/08)**, a pedido do usuário: as 12 contas do
  Firebase Auth (as 3 de teste oficiais + 2 `e2e-advogado-*` de teste automatizado + 7 de
  e-mail pessoal do time/testers — usuário confirmou explicitamente que podia apagar as
  pessoais também) e todos os documentos de `users`/`advogados`/`curriculos`/`denuncias`/
  `triagens` foram apagados via scripts temporários (fora do repo, sem ficar rastro).
  Repopulado com o `database/seed/seed.js` + `lawyers.json` já existentes (30 advogados
  fictícios, sem alteração) e as 3 contas de teste recriadas com login de verdade:
  `admin.teste@example.com`, `cliente.teste@example.com`, `advogado.teste@example.com`,
  todas com senha `Nocturis123!` (a de advogado já vem com bio/especialidades/currículo
  completos e OAB verificada, diferente dos 30 do seed, que não têm login). Mais **5
  denúncias de modelo** criadas direto no Firestore (2 resolvidas com decisão registrada,
  1 em análise, 2 abertas — uma delas sem alvo específico, testando o fluxo "denunciar um
  problema" genérico) pra dar pra demonstrar a moderação do admin sem precisar denunciar
  nada de verdade. Confirmado ao vivo logando como `cliente.teste` e conferindo
  `/minhas-denuncias` e `/advogados`.

## Escopo do MVP (Fase 1)

Cadastro/login por papel, perfil + currículo do advogado, contato direto (WhatsApp/e-mail),
triagem por perguntas guiadas + matching por área/localização, tudo responsivo e com
advogados de exemplo (seed) para demonstração. Denúncias e painel admin ficam para depois
da 1ª apresentação. Triagem + matching é o núcleo inegociável — ver detalhes em
`docs/ROADMAP.md`.
