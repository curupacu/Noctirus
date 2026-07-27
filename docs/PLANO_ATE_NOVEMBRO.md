# Nocturis — Plano até Novembro (27/07 → apresentação final)

> Continuação prática do `docs/ROADMAP.md` e do `CLAUDE.md`, escrita em 27/07/2026 a
> pedido do time. Não substitui o roadmap original — reprioriza o que falta dele e
> preenche a Fase 3 (restante) e a Fase 4, que hoje são só uma lista solta de bullets.

## Princípio que guia este plano

**Funcionamento e UI/UX vêm antes de segurança à prova de bala e de LGPD à risca.** O
Nocturis continua sendo um TCC com dados fictícios de advogados — não uma empresa
operando com dados reais de clientes. As três falhas de segurança já corrigidas (ver
`ANALISE_ESTRATEGICA_E_PLANO_DE_NEGOCIOS.md`, seção 5) mostram que o time já sabe proteger
dado pessoal quando precisa; a partir daqui, segurança e conformidade entram só no nível
"suficiente e honesto para uma banca", não no nível "produto em produção com usuários
reais". Isso libera a maior parte do tempo até outubro para o que a banca e os usuários de
teste realmente vão notar primeiro: **o app funcionando bem e parecendo um produto de
verdade.**

**Regra de prazo:** tudo classificado como *importante* abaixo precisa estar pronto até
**31/10**. Novembro não tem trabalho novo planejado — é reserva para imprevistos, ajustes
pedidos pela banca/orientador, ensaio de apresentação e, só se sobrar tempo, os itens
"bônus" da seção final.

---

## Linha do tempo

```
Jul  ████████ Fase A — fechar pontas do Sprint 9
Ago  ████████████████████████ Fase B — UI/UX unificado em todo o app
     ────────────────────────
Set  ████████████████ Fase C — funcionalidades que faltam
     🎤 25/09 — 2ª Apresentação (marco já existente no ROADMAP.md)
     ──────────────── Fase D — calibração da IA + teste com usuários reais
Out  ████████████████ Fase D (continuação) + Fase E — LGPD mínima, prod, hardening leve
     ████████ Fase F — buffer, nada de trabalho novo depois daqui
     ▲ 31/10 — TUDO IMPORTANTE PRONTO
Nov  ░░░░░░░░░░░░░░░░░░░░░░░░ reserva, ensaios, ajustes de banca, stretch goals
     🎤 apresentação final do TCC (confirmar data exata com a coordenação)
```

| Fase | Datas | Foco | Marco |
| --- | --- | --- | --- |
| A | 28/07 – 03/08 | Fechar Sprint 9 | — |
| B | 04/08 – 24/08 | UI/UX de todas as telas restantes | — |
| C | 25/08 – 14/09 | Funcionalidades novas (upload, avaliação, notificação) | — |
| — | 15/09 – 24/09 | Polimento pré-apresentação + ensaio | 🎤 **25/09 — 2ª Apresentação** |
| D | 26/09 – 17/10 | Calibração da triagem + teste de usabilidade real | — |
| E | 18/10 – 31/10 | LGPD mínima, `nocturis-prod`, rate limit leve, buffer | 🚩 **31/10 — tudo importante pronto** |
| — | Novembro | Reserva, ensaio final, ajustes de banca, stretch goals | 🎤 Apresentação final |

---

## Fase A — Fechar pontas do Sprint 9 (28/07 – 03/08)

Itens que já estavam em aberto no `CLAUDE.md` antes deste plano — terminar primeiro para
não carregar dívida técnica adiante.

- [ ] **[GR]** Testes de integração via HTTP nas rotas do Express (`supertest` ou
  equivalente) para os fluxos críticos: login, triagem, cadastro de advogado, denúncia,
  ações de admin. Não precisa cobrir tudo — só o caminho feliz + 1 erro por rota.
- [ ] **[GC]** Documentar os casos de uso já implementados (pendência que se arrasta desde
  o Sprint 2) — usar os `use case` da monografia como base e marcar o que mudou na prática.
- [ ] **[GR]** Criar o projeto `nocturis-prod` de verdade no Firebase (hoje só existe o
  alias no `.firebaserc`) e apontar o deploy final para lá, mantendo `nocturis-web` como
  ambiente de desenvolvimento. É higiene básica de deploy, não "hardening" — vale fazer
  cedo para não migrar dados de teste depois.

---

## Fase B — UI/UX unificado em todo o app (04/08 – 24/08)

**Este é o maior bloco de tempo do plano de propósito.** O próprio time já identificou
isso como o item mais urgente em aberto (`CLAUDE.md`: *"é o item mais urgente em
aberto"*). O redesign estilo Bumble hoje só cobre Home, Login, Cadastro e a busca pública
de advogados — o resto do app ainda está na estrutura antiga de cards em caixa.

Telas a redesenhar, na ordem sugerida (mais visitadas primeiro):

1. **Resultado da triagem** (`ResultadoPage`) — é a tela que mais vende o produto; hoje é
   a que mais destoa do resto.
2. **Perfil público do advogado** (`AdvogadoPublicoPage`) — segunda tela mais visitada por
   quem não está logado.
3. **Painel** (`PainelPage`) e **Perfil** (`PerfilPage`) do usuário logado.
4. **Currículo** (`CurriculoForm`) — formulário longo, prioridade em deixar os estados de
   preenchimento claros.
5. **Denúncias** (`DenunciarPage`, `MinhasDenunciasPage`) e **Minhas triagens**
  (`MinhasTriagensPage`).
6. **Admin** (`AdminAdvogadosPage`, `AdminUsuariosPage`, `AdminDenunciasPage`, `AdminNav`)
  — pode ficar mais simples que o resto (é tela interna, não vitrine), mas precisa parar
  de depender de `window.confirm`/alert cru para confirmações.

Junto com o redesign, aproveitar para resolver dívidas de UX que já estavam listadas no
roadmap original e nunca saíram do papel:

- [ ] Estados de carregamento, erro e vazio consistentes em **todas** as telas (não só
  nas quatro já redesenhadas).
- [ ] Trocar `window.confirm`/`alert` por um componente de confirmação/toast visual —
  pequeno, mas é o tipo de detalhe que faz o app parecer produto de verdade em vez de
  protótipo de aula.
- [ ] Revisar o `BottomNav` para refletir todas as seções relevantes por papel (hoje só
  foi ajustado o bug de item duplicado para advogado — revisar cliente e admin também).
- [ ] Depois de cada tela redesenhada: tirar screenshot e avaliar contraste/hierarquia
  antes de marcar como concluída (regra já fixada no `CLAUDE.md`).

---

## Fase C — Funcionalidades que faltam para parecer produto real (25/08 – 14/09)

Itens de **funcionamento**, não de segurança — o que falta para o Nocturis parecer (e
funcionar como) um produto completo, não um protótipo de fluxo único.

- [ ] **Upload de foto de perfil e PDF de currículo do advogado.** A dependência
  `cloudinary` já está instalada no `backend/package.json` mas não é usada em nenhum
  lugar — é só conectar (o free tier do Cloudinary cobre o volume de um TCC com folga,
  não precisa esperar o Blaze).
- [ ] **Sistema simples de avaliação/reputação do advogado** (estrelas ou selo de
  "atendimentos concluídos sem denúncia"). Não estava nos RFs originais da monografia,
  mas resolve diretamente a dor de "conquistar clientes" que a própria pesquisa de campo
  identificou, e o esforço é baixo comparado ao ganho de credibilidade percebida.
- [ ] **Notificação ao admin de nova denúncia** (e-mail simples via serviço gratuito, ou
  um badge/contador dentro do próprio `AdminNav`) — item que ficou de fora do Sprint 9
  original.
- [ ] **Paginação/ordenação da listagem pública de advogados** — hoje o dataset é
  pequeno (30 fictícios) e não dói, mas a estrutura já pede isso conforme a base cresce;
  baixo esforço para adiantar.
- [ ] **Ajuste de linguagem institucional**: trocar "advocacia virtual" por "plataforma de
  triagem e indicação jurídica" no `README.md`, na Home e nos textos do app (achado da
  seção 2 da análise estratégica) — troca de texto, sem impacto técnico, mas reduz um
  risco de posicionamento real.

---

## Checkpoint pré-apresentação (15/09 – 24/09)

Sem tarefas novas de produto nesta janela — é para consolidar o que foi feito nas Fases
B e C, corrigir bugs encontrados, e ensaiar a demonstração ao vivo (roteiro, o que
mostrar, o que evitar clicar). Termina no marco já existente no `ROADMAP.md`:

> 🎤 **25/09 — 2ª Apresentação**, demonstrando MVP + triagem + denúncias + admin
> funcionando de ponta a ponta com a UI unificada.

---

## Fase D — Calibração da triagem e teste com usuários reais (26/09 – 17/10)

- [ ] **[GC]** Rodar os 15–20 casos de teste reais da triagem (pendência do Sprint 6) e
  ajustar o *prompt* do Gemini e a árvore de perguntas com base na taxa de acerto medida
  — este é o item que mais protege o diferencial competitivo do produto (seção 7 da
  análise estratégica), então vale tempo dedicado, não só uma tarde.
- [ ] Teste de usabilidade com 5–10 pessoas reais fora do grupo (colegas, família,
  professores) — item que estava no Sprint 12 original, adiantado para cá porque é
  puramente UX, não *hardening*.
- [ ] Ajustes finais de responsividade e compatibilidade (Chrome, Firefox, Edge, Android,
  iOS) nas telas redesenhadas na Fase B.

---

## Fase E — Camada mínima de conformidade e fechamento (18/10 – 31/10)

**Nada nesta fase é "LGPD à risca" ou "segurança inpenetrável"** — é o mínimo para o
projeto não parecer descuidado numa banca ou numa demonstração pública, do jeito que a
seção 6 da análise estratégica descreve como "nível TCC realista":

- [ ] Página simples de **Termos de Uso** e **Aviso de Privacidade** (1–2 páginas cada,
  linguagem direta) — deixando claro que advogados no ambiente de demonstração são
  fictícios, que a plataforma não presta consultoria jurídica, e como os dados são usados.
- [ ] Nota de consentimento na tela de triagem avisando que o relato pode conter dados
  sensíveis e para que serve.
- [ ] *Rate limiting* básico só no login e na triagem (uma linha de middleware, não um
  sistema de proteção completo).
- [ ] Confirmar `nocturis-prod` publicado, domínio (se decidirem registrar), *keep-warm*
  do backend ativo, e checklist final de compatibilidade.
- [ ] Buffer de contingência dentro da própria fase — se algo do cronograma atrasar, é
  aqui que absorve, não em novembro.

**31/10 — linha de corte.** Tudo classificado como importante neste documento precisa
estar concluído até esta data.

---

## Novembro — reserva, não trabalho novo

- Ensaios adicionais da apresentação final.
- Ajustes pontuais pedidos pelo orientador/banca depois da 2ª apresentação.
- Correção de bugs que aparecerem nos testes finais.
- **Só se sobrar tempo**, tratar como bônus opcional (nunca como compromisso):
  - Verificação real de OAB (hoje é manual, sem API pública oficial).
  - LGPD mais completa (retenção formal, DPO nomeado) — relevante só se o projeto for
    considerar operar de verdade depois do TCC.
  - Migração do Gemini para Vertex AI (privacidade de dados reais).
  - Preview automático por PR no CI.

---

## O que este plano deixa explicitamente de fora (por decisão, não por esquecimento)

- Testes de penetração externos.
- Programa formal de LGPD (RIPD, DPO oficial, mapeamento de transferência internacional).
- Monitoramento/observabilidade (Sentry ou similar).
- Cobrança/pagamento real da assinatura de visibilidade do modelo de negócio (fica só no
  plano — seção 8 da análise estratégica — como direção futura, não como entregável).

Esses itens são corretos para uma eventual "Fase 5 — produto real" pós-TCC, não para o
que precisa existir até a entrega. Mantê-los fora da lista até lá é o que libera o tempo
para funcionamento e UI/UX, que é a prioridade combinada com o time.
