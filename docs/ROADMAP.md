# Roadmap — Nocturis

> **Advocacia virtual com triagem e direcionamento jurídico** (áreas cível e trabalhista).
> Desenvolvido pela **Aggrem** — TCC do curso Técnico em Desenvolvimento de Sistemas (AMS), ETEC de Heliópolis Arq. Rui Ohtake.
> Integrantes: **Gustavo Cereja** (líder, análise e documentação) · **Gabriel Paulucci** (front-end e design) · **Guilherme Reche** (back-end e banco de dados).

**Meta principal:** MVP sólido no ar até o **fim do recesso de julho** (batendo com a entrega de protótipos em 06/08). A **triagem com IA** é a única parte que pode escorregar um pouco além disso sem quebrar a meta — o resto do MVP não.

---

## Sumário

1. [Decisões travadas (stack)](#1-decisões-travadas-stack)
2. [Arquitetura e hospedagem](#2-arquitetura-e-hospedagem)
3. [Estrutura do repositório](#3-estrutura-do-repositório)
4. [Modelo de dados (Firestore)](#4-modelo-de-dados-firestore)
5. [Definição do MVP](#5-definição-do-mvp)
6. [Sprints](#6-sprints)
7. [Como a triagem híbrida funciona](#7-como-a-triagem-híbrida-funciona)
8. [O que pode atrasar (e como mitigar)](#8-o-que-pode-atrasar-e-como-mitigar)
9. [Ritual de trabalho](#9-ritual-de-trabalho)
10. [Estimativa de custos](#10-estimativa-de-custos)

---

## 1. Decisões travadas (stack)

| Camada | Tecnologia | Por quê |
| --- | --- | --- |
| **Frontend** | React (Vite) + React Router | Já é a escolha do time; Vite é rápido e leve. Identidade visual da **Nocturis** (coruja, tons marrom/amarelo) — não confundir com a marca Aggrem (roxo). |
| **Backend** | Node.js + Express (API própria na pasta `backend/`) | Concentra o que é sensível: chamada da IA, validação de OAB, operações de admin e criação de *custom claims*. Usa o **Firebase Admin SDK** pra falar com o Firestore. |
| **Auth** | Firebase Authentication + *custom claims* | Login pronto e seguro; os *claims* definem os 3 papéis (cliente, advogado, admin) → atende RNF002. |
| **Banco** | Cloud Firestore | NoSQL em nuvem, tempo real, generoso no plano grátis. O MER/DER da monografia é traduzido em coleções (ver seção 4). |
| **IA da triagem** | **Google Gemini — modelo Flash-Lite** | Grátis no *free tier*, sem cartão, ideal pra classificação/roteamento. Chamado **só pelo backend** (chave nunca no front). Fallback por regras se falhar ou passar de 5s (RNF003). |
| **Escopo** | Fase 1 = MVP · Fase 2 = produto real | MVP com dados fictícios e tudo em *free tier*. Produto real depois: LGPD, Gemini via Vertex AI (não treina com os dados), verificação de OAB, advogados reais. |

---

## 2. Arquitetura e hospedagem

A aplicação segue um modelo de **três camadas**, cada uma numa pasta do repositório:

```
Cliente (navegador)
      │
      ▼
┌──────────────┐     login/token      ┌──────────────────────┐
│  frontend/   │ ───────────────────▶ │ Firebase Auth        │
│  React+Vite  │                      └──────────────────────┘
└──────┬───────┘
       │ requisições HTTP (JSON) + token
       ▼
┌──────────────┐   Admin SDK   ┌──────────────────────┐
│  backend/    │ ────────────▶ │ Firestore (database) │
│  Node+Express│               └──────────────────────┘
│  - triagem IA│   chamada
│  - validações│ ────────────▶ ┌──────────────────────┐
│  - admin     │               │ Google Gemini (IA)   │
└──────────────┘               └──────────────────────┘
```

**Fluxo:** o front autentica direto no Firebase Auth e recebe um *token*. Toda operação sensível vai pro `backend/`, que **verifica o token** com o Admin SDK antes de ler/gravar no Firestore ou chamar a IA. Assim a chave do Gemini e as regras de negócio ficam protegidas no servidor.

### Onde subir cada parte (recomendação)

| Parte | Onde subir | Custo | Observações |
| --- | --- | --- | --- |
| **Frontend** (`frontend/`) | **Firebase Hosting** | Grátis (Spark) | Recomendado por integrar com o Auth e **não ter restrição de uso comercial**. Alternativa: Vercel (ótima experiência, mas o plano grátis é **só uso não-comercial** — trava quando virar produto real). |
| **Backend** (`backend/`) | **Render (free tier)** | Grátis, sem cartão | Serviço web Node grátis. **Porém dorme após 15 min de inatividade** e leva 30–60s pra acordar (*cold start*). Mitigação abaixo. |
| **Banco + Auth** (`database/`) | **Firebase (Firestore + Auth)** | Grátis (Spark) | 50 mil leituras/dia, 20 mil escritas/dia, 1 GiB. Mais que suficiente pro MVP. |
| **IA** | **Google Gemini (AI Studio, free tier)** | Grátis, sem cartão | Chamado pelo backend. Flash-Lite. |

### O problema do *cold start* (importante pra triagem)

O Render grátis derruba o backend depois de 15 min parado, e o próximo acesso demora 30–60s — isso **quebraria** o requisito de responder a triagem em ≤5s (RNF003) se acontecer bem na hora da demonstração. Mitigações:

1. **Keep-warm grátis:** um serviço como o *cron-job.org* (grátis) chama um endpoint `GET /health` do backend a cada ~10 min, mantendo ele acordado. Resolve na prática.
2. **Fallback por regras:** se a IA/backend demorar, a triagem cai na classificação por palavras-chave e não trava.
3. **Alternativa (se aceitarem cartão):** trocar o backend por **Firebase Cloud Functions**. Integra melhor e o *cold start* é bem menor, mas o deploy exige o plano **Blaze** (pay-as-you-go, precisa de cartão — na prática fica em R$0 no volume de vocês, com alerta de orçamento configurado).

**Recomendação:** começar com **Render free + keep-warm** (zero custo, sem cartão). Se no futuro quiserem tirar o *cold start* de vez, ou migram o `backend/` pra Cloud Functions, ou sobem pro Render Starter (~US$7/mês).

---

## 3. Estrutura do repositório

Seguindo a estrutura atual do GitHub. A `develop` antiga (MVP a descartar) serve só de referência — nada dela entra no código novo; **recriar a `develop` a partir da `main`**.

```
Noctirus/
├─ frontend/            # React (Vite) — telas, componentes, design system Nocturis
│  └─ src/
│     ├─ features/      # auth, triagem, advogados, denuncias, admin
│     ├─ components/    # UI reutilizável (botão, input, card...)
│     ├─ lib/           # cliente Firebase, hooks, helpers
│     └─ routes/
├─ backend/             # Node.js + Express — API, IA, validações, admin
│  └─ src/
│     ├─ routes/        # endpoints REST
│     ├─ services/      # triagem/Gemini, OAB, matching
│     ├─ middlewares/   # verificação de token, papéis
│     └─ lib/           # firebase-admin
├─ database/            # Firestore: regras, índices, seed e docs do modelo
│  ├─ firestore.rules
│  ├─ firestore.indexes.json
│  └─ seed/             # scripts pra popular advogados fictícios
├─ docs/                # este ROADMAP.md e demais documentos
├─ .gitignore
└─ README.md
```

**Branches:** `main` protegida (deploy só em marco) · `develop` recriada a partir da main (integração) · `feature/<nome>` por tarefa → PR → *preview* → *merge* na `develop`.
**Commits:** padrão `tipo: descrição` (ex.: `feat: triagem com Gemini`, `fix: validação da OAB`).

---

## 4. Modelo de dados (Firestore)

Tradução do MER/DER da monografia para coleções do Firestore:

```
users/{uid}
  role: "cliente" | "advogado" | "admin"
  nome, email, telefone
  status: "ativo" | "suspenso"
  createdAt

advogados/{uid}              # complementa users quando role = advogado
  oab: { numero, uf }
  areasAtuacao: ["civel", "trabalhista"]
  localizacao: { cidade, uf }
  contatos: { whatsapp, email }
  verificado: boolean         # false no MVP; usado de verdade na Fase 2

curriculos/{uid}
  formacao: []
  especializacoes: []
  cursos: []
  experiencias: []

triagens/{id}
  clienteId
  respostas: {}               # respostas das perguntas guiadas
  descricao: ""               # texto livre do cliente
  areaClassificada: "civel" | "trabalhista" | "indefinido"
  tipoAdvogadoSugerido: ""     # ex.: "advogado trabalhista para rescisão"
  origem: "ia" | "regras"      # de onde veio a classificação
  advogadosSugeridos: []
  createdAt

denuncias/{id}
  autorId, autorTipo
  alvoId (opcional)
  descricao
  provaUrl (opcional)          # ver nota sobre upload de arquivos
  status: "aberta" | "em_analise" | "resolvida"
  decisao (opcional)
  createdAt
```

**Regras de segurança:** os papéis vêm de *custom claims* (não de campo público), e as *rules* **negam tudo por padrão** e liberam por papel (RNF005).

> 📎 **Upload de provas nas denúncias:** o Firebase Storage saiu do plano grátis. Como as denúncias são de uma fase posterior, no MVP não há upload. Quando for necessário: ou ativar o Blaze (com alerta de orçamento), ou usar um serviço grátis externo (ex.: Cloudinary). Isso fica registrado como decisão da Fase 3.

---

## 5. Definição do MVP

O MVP está **pronto** quando uma pessoa qualquer abre o link e consegue, de ponta a ponta:

1. Criar conta como **cliente** ou **advogado** (papéis funcionando; *rules* bloqueando o que cada papel não pode).
2. O advogado monta **perfil + currículo**; o cliente **vê o perfil** e **fala com ele** (WhatsApp/e-mail).
3. O cliente faz a **triagem**: responde perguntas guiadas + descreve o caso → o sistema diz a **área** (cível/trabalhista) e o **tipo de advogado ideal**, e lista **advogados compatíveis** (por área + localização).
4. Tudo **responsivo** e **no ar** (Firebase Hosting), com **advogados de exemplo** (*seed*) pra demonstração.

**Fora do MVP mínimo:** denúncias e painel admin entram **depois** da 1ª apresentação. Se o tempo apertar, são a primeira coisa a cortar. **Triagem + matching é o núcleo inegociável.**

---

## 6. Sprints

Sprints **semanais**. Itens com 🔴 são **bloqueadores** (precisam estar prontos pro sprint seguinte). Responsáveis: **[GC]** Gustavo · **[GP]** Gabriel · **[GR]** Guilherme.

### 🟩 FASE 1 — MVP (recesso de julho)

#### Sprint 1 — Fundação · 07–13/07
- ✅ [GR] Criar projeto Firebase (Auth, Firestore, Hosting). **Dois projetos:** `nocturis-dev` e `nocturis-prod`.
  Na prática, o projeto dev virou `nocturis-web`, e `nocturis-prod` ainda não existe de verdade
  (ver "Status do deploy" no `CLAUDE.md`) — os dois nomes acima ficam só como registro do plano original.
- 🔴 [GR] Configurar `backend/` (Express + Firebase Admin SDK) rodando localmente; `database/` com `firestore.rules` inicial.
- 🔴 [GP] Scaffold do `frontend/` (Vite + React) + rotas + estrutura de pastas.
- 🔴 [GP] **Design system Nocturis:** paleta (marrom/amarelo), tipografia e componentes base (botão, input, card).
- [GR] Deploy inicial: front no Firebase Hosting, backend no Render (com `GET /health`); *preview* por PR.
- **Decidir:** criar conta no Google AI Studio e gerar a chave do Gemini (guardar como variável de ambiente no backend, para o Sprint 5).
- **Pronto quando:** front em branco no ar, backend respondendo `/health`, login do Firebase configurado, PR gera *preview*.

#### Sprint 2 — Autenticação e entidades · 14–20/07
- 🔴 [GR] Cadastro/login (e-mail + senha) e atribuição de papel via *custom claim* (endpoint no backend).
- 🔴 [GR] *Security rules* por papel; validação da OAB (formato + unicidade) no cadastro de advogado (RNF004).
- 🔴 [GP] Telas de cadastro/login (cliente e advogado) + seleção de papel.
- 🔴 [GP] CRUD **manter cliente** e **manter advogado** (cadastrar/consultar/atualizar).
- [GC] Documentar os casos de uso implementados.
- **Pronto quando:** dá pra criar cliente e advogado, logar como cada um, e as *rules* bloqueiam o que o papel não pode fazer.

#### Sprint 3 — Perfis, currículo e contato · 21–27/07
- 🔴 [GR] CRUD **manter currículo** (formação, especializações, cursos, experiências).
- 🔴 [GP] Tela de perfil do advogado + visualização do currículo.
- 🔴 [GP] Botões de contato: *deep link* do WhatsApp + `mailto:` (RF010).
- [GC] Documentar os casos de uso de perfil e currículo.
- **Pronto quando:** um advogado de exemplo tem perfil + currículo completos e clicáveis, com contato funcionando.

#### Sprint 4 — Matching, seed e deploy · 28/07–03/08 → ✅ **MVP base no ar (fim das férias)**
- 🔴 [GR] **Matching:** filtrar advogados por área + localização (RF006, RF007). *(Nesta semana a "área" ainda pode vir só das perguntas guiadas — a IA entra no Sprint 5.)*
- 🔴 [GR] *Seed* de advogados fictícios pra demonstração; revisar as *rules*.
- 🔴 [GP] Responsividade (desktop/mobile) + estados de carregamento, erro e vazio (RNF001, RNF006).
- 🔴 [GR] **Deploy do MVP base** no `nocturis-prod` + *keep-warm* do backend.
- [GC] Teste rápido de usabilidade com 3–5 pessoas.
- **Pronto quando:** dá pra passar o link e a pessoa cadastra, vê advogados e fala com eles. **Meta de férias batida.**

### 🟦 FASE 2 — Triagem com IA + 1ª apresentação

#### Sprint 5 — Triagem híbrida (Gemini) · ✅ concluído em 08/07 (adiantado — previsto 04–10/08)   📌 *entrega de protótipos 06/08*
- ✅ [GC] Desenhar a **árvore de perguntas guiadas** (cível vs trabalhista) + lista de palavras-chave do fallback.
- ✅ [GP] Fluxo de triagem no front: perguntas guiadas + campo de descrição livre.
- ✅ [GR] Endpoint `POST /triagem/classificar`: manda respostas + texto pro **Gemini Flash-Lite** com *prompt* restrito → retorna JSON `{ area, categorias, tipoAdvogadoSugerido, confianca, justificativa }`.
- ✅ [GR] Fallback por regras se a IA falhar ou passar de 5s; grava `origem` (RNF003).
- ✅ [GP] Tela de resultado: área + tipo de advogado ideal + advogados compatíveis.
- **Pronto quando:** o cliente descreve um caso, o sistema classifica em ≤5s e mostra advogados coerentes. ✅ Batido.

> 🎤 **1ª Apresentação (13/08):** demonstrar o MVP + triagem funcionando de ponta a ponta.

#### Sprint 6 — Refino da triagem + UX · parcialmente concluído em 08–13/07 (adiantado — previsto 11–17/08)
- ✅ [GR] Árvore de perguntas evoluída pra **condicional** (2ª pergunta muda conforme a 1ª) + **categorias/subcategorias** detalhadas por área — vai além do que este roadmap previa originalmente.
- ✅ [GR] Especialidades do advogado reaproveitando a mesma taxonomia de categorias da triagem (feature nova, não estava no escopo original — ajuda o cliente a ver se o advogado atende o assunto específico do caso).
- ✅ [GR] Taxonomia ampliada de 12 pra **33 categorias** (17 cíveis + 16 trabalhistas) — bem mais
  granular pra IA, fallback por regras e especialidades. Seletor de categorias na tela de
  resultado da triagem trocado por um grid de pills tocáveis (era um combo confuso que às vezes
  mostrava o valor cru tipo `verbas_nao_pagas` em vez do rótulo).
- ✅ [GR] Seed de advogados fictícios ampliado de 5 pra **30**, cobrindo as 33 categorias e 14
  estados, pra dar pra testar filtro/matching de verdade.
- [GC] Rodar 15–20 casos de teste reais e afinar *prompt* + árvore (medir a taxa de acerto). — pendente
- ✅🟡 [GR] **Passe de UX, parcial**: Home, Login, Cadastro e a busca pública de advogados
  (`/advogados`) ganharam um redesign completo, mobile-first, guiado por referência visual do
  app Bumble (tela cheia, sem card flutuando, botões pill, seleção por `ChoiceCard`/pills em
  vez de `<select>`). **O resto do app (Painel, Perfil, currículo, perfil público do advogado,
  resultado da triagem, admin) só tem o design system básico aplicado** (cores/botões/inputs
  certos, mas ainda com a estrutura antiga de cards em caixa) — puxar isso pra frente é o item
  de UI/UX mais urgente em aberto.
- [GR] **Matching ainda não usa `especialidades`**, só área + cidade/UF — item novo que apareceu
  com a taxonomia ampliada, ainda não estava previsto neste roadmap. Prioridade média.

### 🟪 FASE 3 — Confiança e administração (rumo à 2ª apresentação, 25/09)

#### Sprint 7 — Denúncias · 18–24/08 → ✅ concluído em 18/07 (adiantado)
- ✅ [GR] Fluxo **registrar denúncia** (descrição + prova) — RF011. GP não ia chegar a tempo
  de fazer o front, então GR fez as duas partes: tela em `/denunciar` reaproveitando os
  componentes existentes (sem redesign), com entrada pelo perfil público do advogado e
  pelo `/perfil`.
- ✅ [GR] `POST /denuncias` persistindo no Firestore + rule liberando leitura só pro autor/admin
  (escrita só via backend, como o resto do modelo). **Decisão de upload**: sem upload no MVP
  (já registrado na seção 4) — `provaUrl` aceita opcionalmente um link externo já hospedado.

#### Sprint 8 — Painel admin + moderação · 25–31/08 → ✅ concluído em 18/07 (adiantado)
- ✅ [GR] Painel: listar/analisar denúncias, gerenciar clientes e advogados. De novo GR fez
  a parte do GP também — `AdminUsuariosPage` e `AdminDenunciasPage`, com um sub-menu
  (`AdminNav`) pra navegar entre OAB/Usuários/Denúncias, no mesmo estilo das telas de admin
  que já existiam.
- ✅ [GR] Suspender/remover com confirmação (RF012–RF014). Suspender desativa o login de
  verdade na Firebase Auth (não só marca um campo); remover apaga da Auth e do Firestore.
  Confirmação via `window.confirm` antes de remover. Admin não pode suspender/remover outro
  admin.

#### Sprint 9 — Testes · 01–07/09  *(cobra o 3º bimestre)*
- [GR] Testes unitários e de integração das partes críticas (auth, triagem, matching).
- [GC] Documentar testes e validações.

#### Sprint 10 — Polimento + *hardening* · 08–24/09 → 🎤 **2ª Apresentação 25/09**
- [GR] Índices do Firestore, revisão das *rules*, checagem de disponibilidade (RNF007, RNF008).
- [GP] Compatibilidade com Chrome/Firefox/Edge; ajustes finais.
- [GC] Roteiro da apresentação + teste de usabilidade final.
- **Pronto quando:** MVP sólido e estável no ar. Fim do 3º bimestre.

### ⬛ FASE 4 — Produto real (Out–Dez)
- **LGPD:** consentimento, política de privacidade, minimização e retenção de dados, criptografia do que for sensível.
- **Gemini via Vertex AI** (não treina com os dados) no lugar do *free tier* — requisito de privacidade pra descrições reais de clientes.
- **Verificação de OAB de verdade:** não há API pública oficial → aprovação manual por admin (marca `verificado`) ou consulta ao Cadastro Nacional dos Advogados.
- **Onboarding de advogados reais** + curadoria inicial.
- **Hardening:** *rate limiting* no backend, monitoramento (Sentry/logs), backups do Firestore, domínio próprio, remover *cold start* (Render Starter ou Cloud Functions).
- **Beta fechado** com feedback + telemetria básica de eventos.

---

## 7. Como a triagem híbrida funciona

A triagem tem duas etapas, e a IA **orienta, não decide sozinha** — princípio central pra manter a seriedade num contexto jurídico:

1. **Perguntas guiadas (regras):** uma pequena árvore de perguntas objetivas ("é sobre trabalho/emprego?", "envolve contrato, família, dívida?"...) já dá uma primeira separação entre cível e trabalhista.
2. **Interpretação por IA (Gemini Flash-Lite):** o cliente descreve o caso com as próprias palavras; o backend manda as respostas + o texto pro Gemini com um *prompt* restrito, e recebe de volta a **área**, o **tipo de advogado ideal**, uma **confiança** e uma **justificativa** curta.
3. **Segurança:** se a IA falhar, demorar mais de 5s ou vier com baixa confiança, o sistema **cai no resultado das regras** e nunca trava. O cliente também sempre pode **ver todos os advogados manualmente**, sem depender da IA.

---

## 8. O que pode atrasar (e como mitigar)

- **A IA classificar a área errada** → manter sempre o fallback por regras; validar a árvore com casos reais (Sprint 6); nunca esconder a opção de ver todos os advogados. A IA sugere, não determina.
- **O *free tier* do Gemini treinar com os dados** → no MVP com dados fictícios, tudo bem. No produto real, **migrar pro Vertex AI** (não treina) antes de entrar descrição real de cliente. É item de LGPD.
- **Estourar a cota do Gemini (~1.500 requisições/dia)** → mais que suficiente pra demonstração; se estourar, cai no fallback de regras — o sistema **nunca quebra** por isso.
- **Cold start do backend no Render** → *keep-warm* grátis a cada 10 min + fallback por regras. Se incomodar de vez, migrar pra Cloud Functions ou Render Starter.
- **Custos do Firebase crescerem** → o plano Spark cobre bem o MVP; evitar leituras desnecessárias no Firestore, usar índices e monitorar o uso no console.
- **Verificação de OAB** → no MVP, só formato + unicidade. Verificação real só na Fase 2 (aprovação manual pelo admin).
- **Escopo inchar com 3 pessoas em aula** → cortar denúncias/admin do MVP se apertar (são pós-1ª apresentação). Triagem + matching é intocável.
- **Recesso mais curto que o previsto** → priorizar os Sprints 1–3; o Sprint 4 (deploy) é o mínimo pra "MVP no ar". A triagem pode escorregar pro início de agosto sem culpa.

---

## 9. Ritual de trabalho

- Sprint de **1 semana**, com uma conversa curta no começo (quem pega o quê) e no fim (o que ficou pronto).
- O **Trello** (colunas Fazer / Fazendo / Feito) espelha as tarefas deste roadmap.
- Toda tarefa vira uma branch `feature/*` → PR → *preview* → *merge* na `develop`. *Merge* na `main` só nos marcos.
- **Definição de pronto (DoD) padrão:** funciona no *preview*, passa nas *rules*, não quebra o que já existia, e o caso de uso está documentado.

---

## 10. Estimativa de custos

O orçamento é baixo de propósito. A boa notícia: **a Fase 1 (MVP) roda inteira em R$ 0**, sem cartão de crédito.

### Fase 1 — MVP (durante o TCC)

| Item | Serviço | Custo | Observação |
| --- | --- | --- | --- |
| Frontend | Firebase Hosting (Spark) | **R$ 0** | 10 GB de armazenamento, 360 MB/dia de transferência. |
| Backend | Render (free tier) | **R$ 0** | Sem cartão. Dorme após 15 min; usar *keep-warm*. |
| Banco + Auth | Firebase Firestore + Auth (Spark) | **R$ 0** | 50 mil leituras/dia, 20 mil escritas/dia, Auth até 50 mil usuários/mês. |
| IA | Google Gemini (AI Studio, free tier) | **R$ 0** | Flash-Lite; ~1.500 requisições/dia; sem cartão. |
| Keep-warm | cron-job.org | **R$ 0** | Mantém o backend acordado. |
| **Domínio** (opcional) | Registro.br (`.com.br`) | **~R$ 40/ano** | Só se quiserem um endereço bonito pra apresentação. Dá pra apresentar com o link grátis do Hosting. |
| **Total Fase 1** | | **~R$ 0/mês** | (+ ~R$ 40/ano de domínio, opcional) |

### Fase 2 — Produto real (depois do TCC, se decidirem lançar)

Custos que **só aparecem quando o app cresce** ou quando a seriedade exige (LGPD, sem *cold start*). Valores aproximados e mensais:

| Item | Serviço | Custo estimado | Quando entra |
| --- | --- | --- | --- |
| Backend sempre-ativo | Render Starter **ou** Cloud Functions (Blaze) | **~R$ 40/mês** (ou ~R$ 0 no Functions em baixo volume) | Quando o *cold start* incomodar. |
| Banco/Auth acima do grátis | Firebase Blaze | **~R$ 0–30/mês** | Só se passar das cotas diárias do Firestore. |
| IA com privacidade | Gemini via Vertex AI (pago) | **~R$ 5–25/mês** | Quando entrar descrição real de cliente (LGPD). Cada triagem custa frações de centavo. |
| Upload de provas | Blaze Storage ou Cloudinary | **~R$ 0–15/mês** | Quando ligar as denúncias com anexo. |
| Domínio | Registro.br | **~R$ 40/ano** | Recomendado pro produto real. |
| **Total Fase 2 (realista)** | | **~R$ 50–150/mês** | Boa parte é opcional/adiável. |

> **Regra de ouro pra não tomar susto:** manter os dois projetos separados (`dev` e `prod`), **configurar alerta de orçamento** no Google Cloud caso ativem o Blaze, e monitorar o uso do Firestore/Gemini no console. No volume de um TCC, tudo tende a ficar em R$ 0.
