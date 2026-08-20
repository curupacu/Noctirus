# Nocturis

Advocacia virtual com triagem e direcionamento jurídico (áreas **cível** e **trabalhista**).
TCC do curso Técnico em Desenvolvimento de Sistemas — ETEC de Heliópolis. Projeto da **Aggrem**.

O cliente descreve o problema em texto livre + responde algumas perguntas guiadas; o sistema
identifica se é um caso cível ou trabalhista, sugere o tipo de advogado ideal e lista advogados
compatíveis (por área e localização) pra contato direto via WhatsApp/e-mail.

**No ar:** https://nocturis.com.br (domínio próprio; também responde em https://nocturis-web.web.app)

## Status atual

Já funciona de ponta a ponta:

- Cadastro/login por papel (cliente, advogado, admin) com Firebase Authentication + custom claims
- Perfil e currículo do advogado, com contato direto (WhatsApp/e-mail)
- Listagem pública de advogados com filtro por área/cidade/UF/especialidade (não exige login)
- Triagem por perguntas guiadas + descrição livre, classificada por **IA em duas camadas**
  (Gemini 3.5 Flash-Lite → Groq/`openai-gpt-oss-120b` como segunda opinião) com fallback final
  automático por regras de palavras-chave se as duas IAs falharem, demorarem ou tiverem baixa
  confiança — a triagem nunca trava. Validada com 20 casos reais: 100% de acerto de área e
  categoria, nos dois provedores de IA (19/08).
- Taxonomia de 33 categorias (17 cíveis + 16 trabalhistas) usada tanto na triagem quanto nas
  especialidades do advogado — o matching usa isso pra priorizar advogados aderentes ao assunto
  específico do caso, não só a área ampla
- **Opt-in de compartilhar a triagem com o advogado contatado**: o cliente escolhe (desligado
  por padrão) se quer deixar a descrição do caso visível pro advogado que ele contatar a partir
  do resultado da triagem — o advogado só vê o contexto ("Chegou via triagem", área +
  descrição) quando o cliente marcou essa opção.
- **Chat de mensagens pré-definidas** entre cliente e advogado, nos dois sentidos — nunca texto
  livre, só listas fixas de mensagens por categoria (decisão deliberada: art. 34, IV do Código
  de Ética da OAB, proibição de captação de clientela). "Meus Contatos" (cliente) e "Minhas
  conversas" (advogado) mostram quem já foi contatado/está conversando.
- Dashboard do advogado (`/perfil`): saudação, estatísticas (contatos, feedback, conversas),
  completude do perfil, conversas recentes e atalhos — edição de dados fica à parte, em
  `/perfil/editar`
- **Notificação por e-mail** pro cliente quando o advogado responde no chat (Resend, domínio
  próprio `mail.nocturis.com.br` verificado) — dispara direto do backend, sem Cloud Functions.
  Só notifica a primeira mensagem de uma sequência do advogado, não manda um e-mail por
  mensagem se ele responder várias vezes seguidas.
- Sistema de denúncias (registrar, acompanhar como autor, moderar como admin)
- Painel admin completo: aprovar OAB, gerenciar usuários (suspender/remover), moderar denúncias
- Banco populado com 30 advogados fictícios cobrindo várias cidades/estados e especialidades,
  pra dar pra testar filtro e matching de verdade
- Upload de foto de perfil do advogado (Cloudinary, recorte automático de rosto), com avatar
  de iniciais coloridas como fallback
- Domínio próprio (`nocturis.com.br`) com favicon completo, SEO on-page (meta tags, Open Graph,
  JSON-LD), sitemap e `robots.txt`, ligado ao Google Search Console
- 167 testes automatizados (Vitest, unitários + integração via `supertest`) e CI no GitHub
  Actions — resumo em [`docs/TESTES.md`](docs/TESTES.md)
- Tema claro (padrão) e escuro com botão de alternância, salvo por navegador. Home, Login e
  Cadastro ficam sempre no visual escuro ("vitrine" da marca); o resto do app segue o tema
  escolhido
- Redesign visual completo nas telas do MVP — coruja como marca d'água, sombras discretas,
  selo neutro em vez de dourado espalhado, paleta clara revisada, tipografia de corpo em
  IBM Plex Sans (troca da Inter, genérica demais) e cor própria por área (cível/trabalhista)
  além do ícone. Decisões de design em [`docs/DESIGN.md`](docs/DESIGN.md)

**Ainda não existe:** verificação real de OAB, upload de currículo em PDF (`nocturis-prod`
separado foi avaliado e descartado por decisão — ver abaixo). Ver
[Pontos fracos e próximos passos](#pontos-fracos-e-próximos-passos) abaixo e o
[roadmap completo](docs/ROADMAP.md) para o plano de sprints.

## Stack

| Camada | Tecnologia |
| --- | --- |
| Frontend | React 19 + Vite + React Router (`frontend/`) |
| Backend | Node.js + Express (`backend/`), Firebase Admin SDK |
| Auth | Firebase Authentication + custom claims (papéis: `cliente`, `advogado`, `admin`) |
| Banco | Cloud Firestore (NoSQL, sem emulador — aponta direto pro projeto na nuvem) |
| IA da triagem | Google Gemini 3.5 Flash-Lite → Groq (`openai-gpt-oss-120b`) → fallback por regras |
| E-mail transacional | Resend, domínio `mail.nocturis.com.br` verificado — notificação de resposta no chat |
| Deploy | Firebase Hosting (frontend) + Render (backend) |

Identidade visual própria da Nocturis (coruja, tons marrom/amarelo) — não confundir com a marca
Aggrem (roxo).

## Como rodar localmente

Requer Node 22 (fixado em `.nvmrc`).

```bash
nvm use

# backend — precisa de credenciais reais de um projeto Firebase (ver backend/README.md)
cp backend/.env.example backend/.env

# frontend — precisa da config do Web App do Firebase (ver frontend/README.md)
cp frontend/.env.example frontend/.env

npm install
npm run dev   # sobe frontend (5173) e backend (3001) juntos, via concurrently
```

Sem `GEMINI_API_KEY` configurada, o backend não quebra — a triagem cai direto no fallback por
regras. Detalhes de cada parte em [`backend/README.md`](backend/README.md),
[`frontend/README.md`](frontend/README.md) e [`database/README.md`](database/README.md).

## Estrutura do repositório

```
frontend/            React (Vite) — telas, componentes, design system Nocturis
  src/
    features/         auth, triagem, advogados, curriculo, perfil (dashboard + editar),
                      painel, conversas (chat), contatos (Meus Contatos), admin
    components/       UI reutilizável (Button, Input, ChoiceCard, BottomNav,
                      ChatThread, AdvogadoCard...)
    lib/               cliente Firebase, hooks, helpers
    routes/
backend/              Node.js + Express — API, IA, validações, admin
  src/
    routes/            endpoints REST, incluindo conversas.js (chat) e contatos.js
    services/          triagem/Gemini, OAB, matching
    middlewares/        verificação de token, papéis
    lib/               firebase-admin
database/             Firestore: regras, índices, seed e docs do modelo
  firestore.rules
  firestore.indexes.json
  schema.md            modelo de dados por coleção
  seed/                scripts pra popular advogados fictícios e criar admin
docs/                 ROADMAP.md (plano de sprints), DESIGN.md, TESTES.md (resumo dos testes)
```

**Branches:** `main` (deploy) · `develop` (integração) · `feature/<nome>` por tarefa.
**Commits:** `tipo: descrição` (ex.: `feat: triagem com Gemini`, `fix: validação da OAB`).

## Pontos fracos e próximos passos

Levantamento honesto do que ainda precisa de trabalho, priorizado.

### 🟡 Médio

- **Responsividade mobile validada manualmente**, não por automação. Conferida no
  navegador/celular de verdade e o espaçamento está OK, incluindo o botão sticky da
  triagem/denúncia perto do `BottomNav`. Sem confirmação automatizada (screenshot) ainda.
- Diversos ajustes pontuais de copy/acessibilidade/microinterações pelo app.

### 🟢 Baixa prioridade (adiado de propósito — é um MVP)

- **Verificação real de OAB** — hoje é só formato + unicidade; aprovação vira manual pelo admin.
  Não existe API pública gratuita pra automatizar isso.
- **Upload de currículo em PDF** — depende de ativar o plano pago (Blaze) do Firebase Storage
  ou usar um serviço externo gratuito (upload de foto já foi resolvido via Cloudinary).
- **`nocturis-prod` separado — avaliado e descartado (30/07).** O plano original previa dois
  projetos Firebase pra isolar teste de dado real. Como o MVP roda inteiro com advogados
  fictícios (seed) e contas de teste descartáveis, não há dado real em risco de poluir uma
  "produção" — o custo de manter um segundo projeto não se paga aqui. Revisitar só se o
  projeto virar produto real (Fase 4).
- LGPD, rate limiting, monitoramento — tudo isso é Fase 4 (produto real), fora do escopo do
  MVP do TCC. (Domínio próprio já foi resolvido — `nocturis.com.br`, ver "Status atual" acima.)
- **Notificação em tempo real dentro do app** ("sininho"/badge) — enquanto o usuário está
  logado e navegando, sem precisar de F5. Daria pra fazer de graça com um listener do
  Firestore (`onSnapshot`), sem serviço novo. Adiado de propósito (19/08) — combina melhor
  com **push notification de verdade** (chega mesmo com o navegador fechado, precisa de
  service worker + permissão do navegador + chaves VAPID), que por sua vez combina melhor
  com **login com Google** (plano futuro do time) — faz mais sentido amarrar inscrição de
  push numa conta de verdade do que numa sessão solta. As duas ficam pra quando o login
  com Google entrar.

## Time

- **Gustavo Cereja** — líder, análise e documentação
- **Gabriel Paulucci** — front-end e design
- **Guilherme Reche** — back-end e banco de dados

Plano completo de sprints, modelo de dados e decisões de arquitetura: [`docs/ROADMAP.md`](docs/ROADMAP.md).
