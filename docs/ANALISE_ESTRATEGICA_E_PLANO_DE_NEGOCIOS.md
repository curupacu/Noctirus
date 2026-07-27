# Nocturis — Análise Estratégica & Plano de Negócios

> Análise independente (não é documento oficial da Aggrem/banca). Lida a partir da
> monografia do TCC e do estado real do repositório em **27/07/2026**.
> Complementa, não substitui, o `docs/ROADMAP.md` e o `CLAUDE.md` do projeto — que
> continuam sendo a fonte da verdade sobre sprints e decisões técnicas.

**Correção em relação à primeira versão desta análise:** a primeira leitura foi feita em
cima de uma cópia antiga do MVP (a `develop` original, descartada — ver nota no
`ROADMAP.md`: *"a `develop` antiga (MVP a descartar) serve só de referência"*). O projeto
foi refeito do zero em cima de Firebase Authentication de verdade, e está hoje no
**Sprint 9 de 13** do roadmap atual (testes automatizados), não no Sprint 2 como constava
antes. Esta versão corrige a leitura de segurança, o mapeamento de requisitos e o placar
de maturidade com base no código e na documentação reais.

---

## Sumário

1. [Sumário executivo](#1-sumário-executivo)
2. [O que é o Nocturis](#2-o-que-é-o-nocturis)
3. [Raio-x do código atual](#3-raio-x-do-código-atual)
4. [Estrutura de arquivos](#4-estrutura-de-arquivos)
5. [Segurança da informação](#5-segurança-da-informação)
6. [LGPD e conformidade legal](#6-lgpd-e-conformidade-legal)
7. [Mercado e concorrência](#7-mercado-e-concorrência)
8. [Modelo de negócio](#8-modelo-de-negócio)
9. [Riscos ampliados](#9-riscos-ampliados)
10. [Plano financeiro](#10-plano-financeiro)
11. [Veredito final](#11-veredito-final)

---

## 1. Sumário executivo

Nocturis é uma plataforma de **triagem e direcionamento jurídico** nas áreas cível e
trabalhista: o usuário descreve seu problema em linguagem simples, responde algumas
perguntas guiadas, e o sistema — com uma combinação de **IA (Gemini Flash-Lite) e regras
de fallback** — identifica a área do Direito envolvida, sugere o tipo de advogado ideal e
lista profissionais compatíveis por especialidade e localização. Nasceu como TCC de três
alunos da ETEC de Heliópolis (curso Técnico em Desenvolvimento de Sistemas), sob a marca
fictícia **Aggrem**.

Ao contrário do que a primeira versão desta análise concluiu, o projeto **não é mais um
esqueleto de MVP**: hoje ele roda de ponta a ponta em produção
(<https://nocturis-web.web.app>), com cadastro/login real por papel, perfil e currículo de
advogado, triagem híbrida com IA, matching, sistema de denúncias e painel de moderação
completos, 35 testes automatizados e CI configurado. Três falhas reais de segurança nas
regras do Firestore já foram encontradas e corrigidas em produção — um sinal de maturidade
de engenharia, não de fragilidade.

O que continua **não existindo** — e é o foco desta análise — é a camada de negócio e
conformidade que nenhum roadmap técnico cobre sozinho: não há modelo de monetização
definido, não há política de privacidade/termos de uso, e o projeto trata a LGPD apenas
implicitamente (por meio das regras de segurança), nunca como um programa formal. Isso é
apropriado para a fase atual de TCC — o objetivo deste documento é registrar exatamente o
que falta, sem inflar a exigência além do que a fase do projeto pede.

### Placar de maturidade (atualizado)

| Eixo | Nota | Nota anterior | O que mudou |
| --- | --- | --- | --- |
| Produto / funcionalidades | **75%** | 35% | Fluxo completo no ar: auth, currículo, triagem híbrida, matching, denúncias, admin |
| Segurança | **55%** | 8% | Firebase Auth real + custom claims + *rules* corrigidas 3x com casos reais de ataque |
| UI/UX consistente | **40%** | — (eixo novo) | Redesign cobre Home/Login/Cadastro/busca; Painel/Perfil/Admin/Resultado ainda no estilo antigo |
| LGPD / jurídico | **15%** | 4% | *Rules* já protegem dado pessoal na prática; falta política, consentimento e retenção formais |
| Validação de mercado | **45%** | 40% | Pesquisa de campo real com usuários e advogados; falta testar disposição a pagar |
| Modelo de negócio | **10%** | 10% | Canvas construído nesta análise; ainda não validado com advogados reais |

*Metodologia: cada eixo mede a distância até um piloto real com usuários/advogados de
verdade — não até a nota do TCC, que já está bem encaminhada.*

---

## 2. O que é o Nocturis

O nome combina os radicais latinos *noctua* (coruja) e *ius* (direito). A proposta de
valor tem dois lados de um marketplace clássico:

- **Cliente/usuário leigo:** não sabe se seu problema é cível ou trabalhista, nem a quem
  recorrer. A triagem faz essa primeira classificação e sugere advogados compatíveis.
- **Advogado, especialmente recém-formado:** tem dificuldade de captar clientes e depende
  de indicação boca-a-boca. A plataforma oferece visibilidade e contato direto
  (WhatsApp/e-mail).

Um mecanismo de **denúncia** funciona como camada de confiança: qualquer parte pode
reportar má conduta em atendimentos, e administradores podem suspender contas
problemáticas — hoje isso já **desativa o login de verdade** na Firebase Auth, não apenas
marca um campo.

> **Achado que permanece válido — nome comercial x regra profissional.** O projeto (e o
> próprio `README.md`) ainda se descreve como **"advocacia virtual"**. No Brasil, a
> advocacia é atividade privativa de advogado inscrito na OAB (Lei 8.906/1994) — uma
> empresa de tecnologia intermedeia o contato, não "presta advocacia". Para a
> apresentação do TCC isso é só uma questão de linguagem, mas vale ajustar a comunicação
> institucional (site, termos de uso) para **"plataforma de triagem e indicação
> jurídica"** antes de qualquer uso fora do ambiente acadêmico — é o mesmo produto, só
> descrito de um jeito juridicamente mais seguro.

---

## 3. Raio-x do código atual

O repositório tem histórico de commits consistente com um projeto ativo (não mais um
único commit de scaffold): fundação, autenticação, currículo/perfil, matching, triagem
híbrida, dois redesigns de UI, denúncias, painel admin, correção de 3 vulnerabilidades
reais e suíte de testes — nessa ordem, e boa parte **adiantada** em relação ao cronograma
original (ver `docs/ROADMAP.md`, seção 6).

| Requisito | Descrição | Estado atual |
| --- | --- | --- |
| RF001–003 | Cadastro de cliente / advogado / currículo | ✅ Completo, com Firebase Auth real |
| RF004–005 | Descrição livre + classificação cível/trabalhista | ✅ Completo — **acima do escopo original**: IA (Gemini) + árvore de perguntas condicional + 33 categorias, com fallback por regras garantindo resposta em ≤5s |
| RF006–007 | Filtro por especialidade + localização | ✅ Completo, incluindo ordenação por especialidade compatível |
| RF008–010 | Ver perfil, currículo, contato do advogado | ✅ Completo |
| RF011–012 | Registrar e listar denúncias | ✅ Completo, com fluxo de decisão comunicada ao autor (`/minhas-denuncias`) |
| RF013–014 | Suspender/remover advogado ou cliente | ✅ Completo — suspende de verdade no Firebase Auth, bloqueia autoreativação |

**O que ainda falta, na visão de funcionalidade (não de segurança):**

- Testes de integração via HTTP nas rotas do Express (hoje os 35 testes cobrem só
  unidades: `oab`, `triagem` por regras, `auth`, `matching`).
- Documentação formal dos casos de uso implementados (pendência recorrente do papel do
  GC desde o Sprint 2).
- Rodar os 15–20 casos de teste reais da triagem para calibrar o *prompt* da IA
  (pendência do Sprint 6).
- Upload de foto de perfil / PDF de currículo do advogado — **a dependência `cloudinary`
  já está instalada no `backend/package.json` mas não é usada em nenhum lugar do código
  ainda**: é um recurso preparado, não implementado.
- Sistema de avaliação/reputação do advogado (não estava nos RFs originais, mas é um
  ganho de credibilidade percebida barato de implementar).
- `nocturis-prod` ainda não existe como projeto separado — dev e "produção" apontam para
  o mesmo projeto Firebase (`nocturis-web`) hoje.

---

## 4. Estrutura de arquivos

```
Noctirus/
├─ frontend/            React 19 + Vite + React Router
│  └─ src/
│     ├─ features/      auth, triagem, advogados, curriculo, perfil, painel, admin, denuncias
│     ├─ components/    Button, Input, Select, ChoiceCard, BottomNav, Header, ProgressSteps
│     ├─ lib/           cliente Firebase, api.js
│     └─ styles/        tokens.css (paleta marrom/amarelo da identidade Nocturis)
├─ backend/             Node.js + Express (ESM)
│  └─ src/
│     ├─ routes/        auth, advogados, curriculos, triagem, users, denuncias, health
│     ├─ services/      triagem.js (Gemini + regras), matching.js, oab.js — cada um com *.test.js ao lado
│     ├─ middlewares/    auth.js (verifyIdToken + requireRole)
│     └─ lib/           firebase-admin.js
├─ database/            firestore.rules, firestore.indexes.json, seed/ (30 advogados fictícios)
├─ docs/                ROADMAP.md, este documento, monografia
├─ CLAUDE.md            log detalhado de decisões e estado real do projeto
└─ .github/workflows/ci.yml
```

Essa é uma estrutura de qualidade profissional para o tamanho do time e do prazo — a
separação `routes → services → middlewares`, os testes ao lado do código que testam, e o
`CLAUDE.md` funcionando como changelog vivo são práticas que times muito maiores às vezes
não têm. Os únicos itens de higiene de repositório que faltam são de infraestrutura, não
de organização de código: preview automático por PR e separação real dev/prod.

---

## 5. Segurança da informação

Esta seção muda mais do que qualquer outra em relação à primeira análise. O que era um
bloqueador crítico virou, na prática, um **estudo de caso positivo**.

### O que já foi corrigido (com evidência real de ataque)

O time reportou e corrigiu três falhas reais nas `firestore.rules`, testadas com ataques
de verdade via REST API (usuário de teste descartável, não Admin SDK — que ignora as
*rules*):

1. **Advogado conseguia se auto-verificar** escrevendo `verificado: true` direto pelo SDK
   do cliente — corrigido: só admin muda `verificado`/`oab`.
2. **Vazamento de dado pessoal**: qualquer usuário logado lia e-mail/telefone de qualquer
   outro em `users/{uid}` — corrigido: só o dono e o admin leem.
3. **Usuário suspenso conseguia se reativar sozinho** trocando o próprio `status` —
   corrigido: `status` também só muda pelo admin.

As três foram publicadas em produção via `firebase deploy --only firestore:rules` e
reverificadas com os mesmos ataques, que agora tomam 403. Isso é exatamente o ciclo que
faltava na versão anterior do projeto (auth forjável, sem *rules* reais por trás).

### O que ainda é leve de propósito (adequado à fase de TCC)

| Item | Estado | Recomendação |
| --- | --- | --- |
| *Rate limiting* no login/triagem | Não existe | Baixo esforço, vale adicionar (ver plano de futuro) |
| Separação de projeto Firebase dev/prod | Não existe (`nocturis-prod` só no `.firebaserc`) | Resolver antes da apresentação final |
| Monitoramento/alerta de erro (Sentry ou similar) | Não existe | Opcional para TCC, recomendável se virar produto real |
| Teste de penetração externo | Não existe | Só necessário se o projeto sair do estágio acadêmico |
| Verificação real de OAB | Manual pelo admin (sem API pública oficial) | Adequado para o MVP; automatizar é item de "produto real", não de TCC |

Nada nessa segunda tabela é urgente para a apresentação do TCC — é a lista correta para
"se um dia isso virar negócio de verdade", não para "se isso vai rodar na banca".

---

## 6. LGPD e conformidade legal

A LGPD nunca é citada explicitamente na monografia nem no código, mas — de forma
indireta — as *rules* corrigidas na seção 5 já implementam o princípio mais básico da lei
(minimização de acesso: cada um só vê o que precisa ver). Isso é uma base tecnicamente
sólida; o que falta é a camada documental/formal, que é barata de fazer e dá muito peso
de seriedade numa banca:

- **Aviso de privacidade simples** (1–2 páginas): o que é coletado, para quê, e o aviso
  de que os advogados no ambiente de demonstração são fictícios.
- **Termos de uso**: deixar claro que a Nocturis não presta consultoria jurídica, não
  garante resultado, e que sua responsabilidade se limita à qualidade da indicação.
- **Campo de descrição livre da triagem (`triagens.descricao`) continua sendo, por
  natureza, um campo de risco de dado sensível** (saúde, situações de violência, dados de
  terceiros/filhos) — isso não muda com o redesign técnico. Para o TCC, uma nota de
  consentimento na tela de triagem ("seu relato pode conter dados sensíveis; usado só
  para classificar seu caso") já é um gesto adequado ao nível de maturidade do projeto.
- **Gemini via *free tier* treina com os dados enviados** — o próprio `ROADMAP.md` já
  identifica isso corretamente como item de "produto real" (migrar para Vertex AI), e é
  aceitável mantê-lo assim para uma demonstração com advogados/casos fictícios.

**Nota de escopo, a pedido do time:** esta análise deliberadamente **não** trata LGPD como
checklist obrigatório de compliance completo (DPO formal, relatório de impacto,
mapeamento de transferência internacional, etc.) — isso pertenceria a uma eventual Fase 5
"produto real", não à entrega do TCC. O que precisa existir até a entrega é o mínimo de
seriedade documental listado acima, mais nada.

### Regras específicas do setor jurídico (permanecem relevantes)

- **Provimento 205/2021 da OAB**: regula publicidade/captação de clientela — evitar dar a
  entender que o *ranking* de exibição é comprável, e nunca se apresentar como se a
  Nocturis fosse ela própria um escritório de advocacia.
- **Código de Defesa do Consumidor**: os termos de uso devem deixar claro que o usuário é
  consumidor do serviço de indicação, não do serviço jurídico em si.

---

## 7. Mercado e concorrência

A monografia já identifica três concorrentes diretos — **Advogo**, **Jusbrasil** e **Juris
Correspondente** — e aponta corretamente o diferencial do Nocturis: nenhum deles faz uma
triagem conversacional prévia antes de mostrar uma lista de advogados. Esse diferencial
ficou **mais forte**, não mais fraco, desde a primeira versão desta análise: a taxonomia
de 33 categorias e a triagem híbrida com IA são hoje mais sofisticadas do que o escopo
original previa.

- **Jusbrasil** continua sendo o concorrente mais capitalizado e com maior tráfego do
  país — competir em alcance/SEO contra ele é uma desvantagem estrutural.
- O diferencial real do Nocturis é a **qualidade da triagem**, e essa é exatamente a
  parte que mais evoluiu no projeto. Vale continuar tratando a taxa de acerto da IA
  (pendência do Sprint 6) como prioridade de produto, não como polimento técnico.
- O problema clássico de **marketplace de dois lados** (poucos advogados no lançamento)
  segue sendo o maior risco de adoção fora do ambiente acadêmico — o seed de 30
  advogados fictícios resolve a demonstração, mas não resolve um lançamento real.

> **A favor do projeto:** o alinhamento com a **ODS 16** da ONU (citado na monografia) é
> uma âncora legítima para parcerias com Núcleos de Prática Jurídica, Defensoria Pública e
> editais de impacto social — canais de aquisição mais baratos do que competir por
> tráfego pago.

---

## 8. Modelo de negócio

Este canvas não existe em nenhum outro documento do projeto — construído aqui a partir da
proposta de valor e do público-alvo já descritos pela equipe.

| Bloco | Conteúdo |
| --- | --- |
| **Proposta de valor** | Cliente: entender o problema jurídico e achar advogado compatível em minutos. Advogado: visibilidade e leads qualificados por especialidade/região |
| **Segmentos de cliente** | Pessoa física com dúvida cível/trabalhista · advogado recém-formado ou pequeno escritório sem verba de marketing |
| **Canais** | Busca orgânica de conteúdo jurídico simplificado · parcerias institucionais · indicação entre advogados cadastrados |
| **Relacionamento** | Autoatendimento para o cliente · suporte/onboarding assistido para advogados (lado que paga) |
| **Fontes de receita** | Assinatura de visibilidade para advogados (evita o risco ético do "pagamento por lead") · selo de verificação premium · gratuito para o cliente final |
| **Recursos-chave** | Base de advogados verificados · motor de triagem · confiança (denúncias funcionando de verdade — já validado tecnicamente) |
| **Atividades-chave** | Curadoria/verificação de advogados · manutenção do motor de triagem · moderação de denúncias |
| **Parcerias-chave** | Núcleos de Prática Jurídica/faculdades de Direito · seccionais da OAB · Defensoria Pública · ONGs de acesso à justiça |
| **Estrutura de custos** | Hospedagem (hoje R$0, ver `ROADMAP.md` seção 10) · verificação manual de OAB · eventual DPO/consultoria jurídica · suporte e moderação |

> **Por que não cobrar "por indicação":** cobrar do advogado por cliente indicado se
> aproxima da linha vermelha do Provimento 205/2021 ("venda de clientela"). Uma
> assinatura fixa por visibilidade é mais defensável e é o caminho que plataformas
> jurídicas maduras adotaram para não conflitar com a ética da OAB.

---

## 9. Riscos ampliados

A tabela de riscos da monografia (R001–R006) cobre bem o essencial técnico. Os riscos
abaixo são adicionais — de negócio e regulatórios:

| Risco | Categoria | Impacto se ignorado |
| --- | --- | --- |
| R007 — Posicionamento como "advocacia" gera questionamento da OAB | Regulatório | Precisaria reformular marca/comunicação já em operação |
| R008 — Vazamento de dado sensível da triagem | LGPD / reputação | A classe de risco já se provou real (3 vulnerabilidades de *rules* encontradas e corrigidas) — o processo de encontrar e corrigir foi bom, mas reforça que é preciso continuar auditando a cada mudança de schema |
| R009 — Problema do "ovo e da galinha" (poucos advogados reais no lançamento) | Negócio | Sem massa crítica de advogados por cidade/especialidade, a triagem não tem para onde direcionar |
| R010 — Responsabilização por má conduta de advogado indicado | Jurídico | Sem termos de uso claros isentando a plataforma do mérito do serviço jurídico |
| R011 — Dependência de um único fornecedor (Firebase/Google + Gemini) | Técnico/negócio | Mudança de preço/política afeta 100% da operação sem plano B |

---

## 10. Plano financeiro

O `docs/ROADMAP.md` (seção 10) já tem uma estimativa de custo mais precisa e atualizada do
que a da monografia original — vale usar aquela tabela como referência oficial: **Fase 1
(MVP/TCC) roda em ~R$0/mês**, e uma eventual Fase 2 "produto real" fica na faixa de
**R$50–150/mês**. Não há necessidade de duplicar esses números aqui; o ponto que esta
análise acrescenta é de custo de *pessoas*, não de infraestrutura:

- Polimento de UI/UX e testes de usabilidade: custo zero de infraestrutura, custo de
  **tempo da equipe** — é o item que mais consome horas até outubro (ver plano de futuro).
- Rodar os casos de teste reais da triagem: também custo zero de infraestrutura, só tempo.
- Cloudinary (upload de foto/currículo): free tier cobre o volume de um TCC com folga.

---

## 11. Veredito final

**Como TCC, o projeto já passou do ponto de "suficiente"** — o fluxo funciona de ponta a
ponta em produção, com testes automatizados, CI, e um histórico documentado de correção
de falhas reais de segurança, o que é raro de ver em projetos de curso técnico. A
distância entre "bom TCC" e "produto real" diminuiu bastante desde a primeira leitura
deste projeto, principalmente no eixo de segurança.

O que ainda separa o Nocturis de um piloto com usuários/advogados reais não é mais
"terminar o roadmap técnico" — é: (1) uniformizar a UI/UX no restante das telas
(o próprio time já identificou isso como o item mais urgente em aberto); (2) validar a
taxa de acerto da triagem com casos reais; (3) resolver o problema de oferta de
advogados antes de abrir a demanda. Nenhum desses três é um problema de engenharia — são
os itens certos para consumir o tempo entre agora e a apresentação final.

Ver `docs/PLANO_ATE_NOVEMBRO.md` para o plano detalhado de como usar o tempo até lá.
