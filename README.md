# Nocturis

Plataforma de **triagem e direcionamento jurídico** nas áreas **cível** e **trabalhista**.
TCC do curso Técnico em Desenvolvimento de Sistemas (AMS) — ETEC de Heliópolis Arq. Ruy Ohtake,
2026. Projeto da **Aggrem**.

A pessoa conta o problema com as próprias palavras; o sistema identifica se o caso é cível ou
trabalhista e qual é o assunto específico, e mostra advogados com a OAB conferida que atendem
aquele assunto na região dela. A Nocturis **não presta serviço jurídico**: ela classifica e
direciona — quem avalia o caso é o advogado.

**No ar:** https://nocturis.com.br · **API:** https://noctirus-backend.onrender.com

## Como funciona

**Cliente**
1. Cria a conta (e-mail/senha ou Google) informando cidade e UF.
2. Faz a **triagem em duas etapas**, sempre com respostas abertas: a etapa 1 (o que aconteceu,
   com quem, quando) identifica a **área**; a etapa 2, com perguntas da área, identifica a
   **especialidade**. Dá pra corrigir a área sugerida.
3. Vê os advogados compatíveis **do seu estado, os da sua cidade primeiro**.
4. **Pede contato** a um advogado, autorizando o envio das respostas da triagem.
5. Acompanha os pedidos em "Minhas solicitações" — quando o advogado aceita, o WhatsApp e o
   e-mail dele aparecem ali.

**Advogado**
1. Cria a conta com número e UF da OAB, áreas, especialidades e cidade. Fica **em análise**
   (invisível pros clientes) até o admin conferir a OAB.
2. Completa perfil, foto e currículo; tem um cartão de visita digital com QR code.
3. Recebe os pedidos de contato no **quadro de casos** (Pendentes → Em andamento → Concluídos),
   lê as respostas do cliente, aceita ou recusa, define prioridade e faz anotações privadas.

**Administrador**
- Confere a OAB de cada advogado no Cadastro Nacional dos Advogados e **aprova, recusa ou
  revoga** (com motivo). O advogado é avisado de toda decisão.

## Funcionalidades

- Login por papel (cliente, advogado, admin) com Firebase Authentication + custom claims, e
  login com Google.
- **Triagem por IA em duas etapas** (RF005–RF007): Gemini → Groq como segunda opinião →
  classificação por regras se as duas falharem (a triagem nunca trava). Taxonomia de 33
  especialidades (17 cíveis, 16 trabalhistas). Avaliada com 20 casos reais: 20/20 área e 20/20
  especialidade (08/10/2026).
- **Resultado filtrado pela região do cliente** (RF008): só advogados do estado dele, a cidade
  dele primeiro, depois quem atende o assunto do caso.
- **Validação de OAB pelo admin** (RF011): fila por situação, motivo obrigatório pra recusar ou
  revogar, histórico, aviso por notificação e e-mail. Só advogado aprovado aparece pro cliente
  (RF009); advogado recusado pode corrigir a OAB e reenviar.
- **Pedido de contato** (RF010, RF013, RF014): o cliente autoriza o envio da triagem, o
  advogado aceita ou recusa, e só depois do aceite os contatos são liberados. Nenhuma rota
  pública mostra WhatsApp/e-mail de advogado.
- **Quadro de casos do advogado** (RF012): colunas por etapa, prioridade, anotações privadas,
  arrastar no computador e abas no celular; o caso só sai do quadro quando o advogado arquiva.
- **Painel do cliente** com a última triagem e prateleiras (solicitações, advogados pro caso,
  advogados perto de você) em ordem neutra que muda todo dia — sem ranking de popularidade.
- Notificações em tempo real (sininho, Firestore `onSnapshot`) e por e-mail (Resend,
  `mail.nocturis.com.br`).
- LGPD: política de privacidade, consentimento no cadastro, "Meus dados" pra baixar ou apagar
  os próprios dados.
- PWA (instala no celular), SEO (meta tags, JSON-LD, sitemap), Sentry e Google Analytics.
- **174 testes automatizados** (Vitest + Supertest) rodando no GitHub Actions — resumo em
  [`docs/TESTES.md`](docs/TESTES.md).

Recursos que **saíram** depois da banca de outubro/2026: denúncias, suspensão/remoção de
usuários pelo admin, avaliação de advogados, chat de mensagens prontas e tema claro/escuro (o
site tem um tema só). O porquê de cada decisão está em [`docs/SPRINTS.md`](docs/SPRINTS.md).

## Stack

| Camada | Tecnologia |
| --- | --- |
| Frontend | React 19 + Vite + React Router, CSS próprio com tokens (`frontend/`) |
| Backend | Node.js + Express, validação com Zod, limite de requisições (`backend/`) |
| Login | Firebase Authentication (e-mail/senha e Google) + custom claims por papel |
| Banco | Cloud Firestore (NoSQL) |
| IA da triagem | Google Gemini → Groq → regras |
| Fotos | Cloudinary |
| E-mail | Resend |
| Hospedagem | Firebase Hosting (site) + Render (API) |
| Monitoramento | Sentry + Google Analytics 4 |
| Testes | Vitest + Supertest, GitHub Actions |

## Como rodar localmente

Requer Node 22 (fixado em `.nvmrc`).

```bash
npm install                       # na raiz, em frontend/ e em backend/
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
npm run dev                       # sobe o site (5173) e a API (3001) juntos
npm test                          # testes do backend (não precisam de nenhuma chave real)
```

Sem `GEMINI_API_KEY`/`GROQ_API_KEY`, a triagem cai direto na classificação por regras. Detalhes
em [`backend/README.md`](backend/README.md), [`frontend/README.md`](frontend/README.md) e
[`database/README.md`](database/README.md).

## Estrutura do repositório

```
frontend/             React (Vite)
  src/
    features/         uma pasta por área: auth, triagem, advogados, solicitacoes, casos,
                      painel, perfil, curriculo, cartao, conta, admin
    components/       peças reaproveitadas (Button, Input, AdvogadoCard, SeloOab...)
    lib/              API, Firebase, hooks e utilitários
    routes/           Home, 404, política de privacidade e o mapa de rotas
backend/              Node.js + Express
  src/
    routes/           uma rota por área (cada uma com seu *.integration.test.js)
    services/         triagem (IA), matching, OAB, avisos, notificações
    middlewares/      login/papel, validação, limite de requisições
  scripts/            avaliar-triagem.js (mede o acerto da IA com casos reais)
database/             regras e índices do Firestore, modelo de dados (schema.md) e seeds
docs/                 SPRINTS.md (plano atual), DESIGN.md (visual), TESTES.md,
                      ROTEIRO_DEMO.md (apresentação), historico/ (planos antigos)
```

**Branches:** só a `main` é permanente (é o que está no ar). Cada tarefa pode ter uma branch
própria, apagada depois de mesclada. Versões antigas ficam em tags (`design-agosto-2026`,
`arquivo-develop-julho`).
**Commits:** `tipo: descrição` (`feat`, `fix`, `docs`, `refactor`, `chore`), em português.

## Pontos fracos conhecidos

- **Verificação de OAB é manual** — não existe API pública gratuita da OAB.
- **A API no plano grátis do Render hiberna** sem uso; a primeira requisição depois disso
  demora alguns segundos.
- **Telas internas ainda com o visual provisório** — só a Home está no visual novo; o resto
  entra na fase de UX/UI (ver `docs/SPRINTS.md`).
- Advogados de demonstração são fictícios (seed), com fotos de baixa resolução.

## Time

- **Gustavo Cereja** — líder e análise
- **Guilherme Reche** — back-end e banco de dados
- **Gabriel Paulucci** — front-end
- **Gustavo Abade** — design

Orientação: Prof.ª Esp. Roseane dos Santos Menezes e Prof. Esp. Eder Franco da Cunha.
