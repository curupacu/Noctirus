# Nocturis

Advocacia virtual com triagem e direcionamento jurídico (áreas **cível** e **trabalhista**).
TCC do curso Técnico em Desenvolvimento de Sistemas — ETEC de Heliópolis. Projeto da **Aggrem**.

O cliente descreve o problema em texto livre + responde algumas perguntas guiadas; o sistema
identifica se é um caso cível ou trabalhista, sugere o tipo de advogado ideal e lista advogados
compatíveis (por área e localização) pra contato direto via WhatsApp/e-mail.

**No ar:** https://nocturis-web.web.app

## Status atual

Já funciona de ponta a ponta:

- Cadastro/login por papel (cliente, advogado, admin) com Firebase Authentication + custom claims
- Perfil e currículo do advogado, com contato direto (WhatsApp/e-mail)
- Listagem pública de advogados com filtro por área/cidade/UF/especialidade (não exige login)
- Triagem por perguntas guiadas + descrição livre, classificada por **IA (Gemini Flash-Lite)**
  com fallback automático por regras de palavras-chave se a IA falhar, demorar ou tiver baixa
  confiança — a triagem nunca trava. Validada com 20 casos reais (28/07): 95% de acerto de área,
  90% de categoria.
- Taxonomia de 33 categorias (17 cíveis + 16 trabalhistas) usada tanto na triagem quanto nas
  especialidades do advogado — o matching usa isso pra priorizar advogados aderentes ao assunto
  específico do caso, não só a área ampla
- Sistema de denúncias (registrar, acompanhar como autor, moderar como admin)
- Painel admin completo: aprovar OAB, gerenciar usuários (suspender/remover), moderar denúncias
- Banco populado com 30 advogados fictícios cobrindo várias cidades/estados e especialidades,
  pra dar pra testar filtro e matching de verdade
- 103 testes automatizados (Vitest, unitários + integração via `supertest`) e CI no GitHub Actions
- Tema claro (padrão) e escuro com botão de alternância, salvo por navegador

**Ainda não existe:** `nocturis-prod` separado (dev e "produção" apontam pro mesmo Firebase),
verificação real de OAB, upload de foto/currículo em PDF. Ver
[Pontos fracos e próximos passos](#pontos-fracos-e-próximos-passos) abaixo e o
[roadmap completo](docs/ROADMAP.md) para o plano de sprints.

## Stack

| Camada | Tecnologia |
| --- | --- |
| Frontend | React 19 + Vite + React Router (`frontend/`) |
| Backend | Node.js + Express (`backend/`), Firebase Admin SDK |
| Auth | Firebase Authentication + custom claims (papéis: `cliente`, `advogado`, `admin`) |
| Banco | Cloud Firestore (NoSQL, sem emulador — aponta direto pro projeto na nuvem) |
| IA da triagem | Google Gemini Flash-Lite, chamado só pelo backend, com fallback por regras |
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
    features/         auth, triagem, advogados, curriculo, perfil, painel, admin
    components/       UI reutilizável (Button, Input, Select, ChoiceCard, BottomNav...)
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
  seed/                scripts pra popular advogados fictícios e criar admin
docs/                 ROADMAP.md com o plano completo de sprints
```

**Branches:** `main` (deploy) · `develop` (integração) · `feature/<nome>` por tarefa.
**Commits:** `tipo: descrição` (ex.: `feat: triagem com Gemini`, `fix: validação da OAB`).

## Pontos fracos e próximos passos

Levantamento honesto do que ainda precisa de trabalho, priorizado.

### 🔴 Urgente

- **Risco de cota do Gemini na apresentação.** O free tier do `gemini-2.5-flash-lite` nesse
  projeto está limitado a ~20 requisições/dia (bem abaixo do documentado pelo Google) — testar a
  triagem repetidamente antes da banca pode esgotar a cota e a demonstração cair inteira no
  fallback por regras, sem aviso na tela. Mitigação: rodar `npm run avaliar-triagem` (backend/)
  antes do dia 13/08 pra confirmar a cota disponível, e evitar testes repetidos horas antes.
- **`nocturis-prod` não existe de verdade.** O `.firebaserc` já tem o alias, mas hoje tudo aponta
  pro mesmo projeto `nocturis-web` (dev e "produção" são o mesmo Firebase).

### 🟡 Médio

- **Responsividade mobile das telas mais recentes ainda não validada em viewport de celular** —
  o redesign (tema claro/escuro + estrutura nova) foi conferido em desktop; falta o mesmo teste
  em mobile de verdade antes da apresentação.
- **Documentar testes e validações** — item pendente do Gustavo (GC): os 103 testes existem e
  passam, mas ainda não têm um resumo documentado pra monografia.
- Diversos ajustes pontuais de copy/acessibilidade/microinterações pelo app.

### 🟢 Baixa prioridade (adiado de propósito — é um MVP)

- **Verificação real de OAB** — hoje é só formato + unicidade; aprovação vira manual pelo admin.
  Não existe API pública gratuita pra automatizar isso.
- **Upload de foto/currículo em PDF** — depende de ativar o plano pago (Blaze) do Firebase
  Storage ou usar um serviço externo gratuito.
- LGPD, rate limiting, monitoramento, domínio próprio — tudo isso é Fase 4 (produto real), fora
  do escopo do MVP do TCC.

## Time

- **Gustavo Cereja** — líder, análise e documentação
- **Gabriel Paulucci** — front-end e design
- **Guilherme Reche** — back-end e banco de dados

Plano completo de sprints, modelo de dados e decisões de arquitetura: [`docs/ROADMAP.md`](docs/ROADMAP.md).
