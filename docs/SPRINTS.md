# SPRINTS.md — plano pós-banca (outubro/2026)

Plano pra deixar o sistema igual aos requisitos revisados depois da banca (RF001–RF014).
Primeiro a **funcionalidade**, depois o **visual** das telas internas (a Home já foi refeita
— ver `docs/DESIGN.md`). Cada sprint é pequeno de propósito: dá pra fazer, testar e aprovar
numa sessão, sem deixar o site quebrado no meio do caminho.

Legenda: ➕ adicionar · ✏️ mudar · ➖ retirar · ✅ já existe, só conferir

---

## Sprint 0 — Limpeza (tirar o que saiu do escopo) ✅ código feito em 07/10

Antes de construir coisa nova, tirar o que a banca considerou inviável e o que vai ser
substituído — assim os sprints seguintes não carregam código morto.

- ➖ **Denúncias inteiras**: telas `/denunciar`, `/minhas-denuncias`, `/admin/denuncias`, rota
  `backend/src/routes/denuncias.js` e testes, coleção nas regras do Firestore, campo no
  "Meus dados" (LGPD) e no `schema.md`.
- ➖ **Suspender/remover usuário pelo admin** (`/admin/usuarios`): a banca viu risco jurídico
  em a plataforma "punir" alguém. No lugar entra só a revogação da OAB (Sprint 2).
- ➖ **Avaliação do advogado pelo cliente** (feedback 1–5): não está nos requisitos e se parece
  com o que a banca criticou nas denúncias (decidido em 07/10).
- 🗂️ Chat de mensagens prontas e "Meus contatos" **ficam por enquanto** — são substituídos no
  Sprint 5, junto com o fluxo novo de contato (tirar antes deixaria o cliente sem jeito de
  falar com o advogado).
- 🧹 Banco: "Ratinho Silva", 5 denúncias e 1 avaliação antigas apagados (07/10). "Advogado Teste"
  fica por enquanto (decisão do time) — ainda aparece em 1º na Home.

**Pronto quando:** nenhuma tela/rota de denúncia ou suspensão sobrar, testes passando.

## Sprint 1 — Cadastro e conta (RF001–RF004) ✅ código feito em 07/10

- ➕ **Localização do cliente** (cidade + UF) no cadastro, no "completar cadastro" do login com
  Google e na edição de perfil. Sem isso o filtro por região (RF008) não tem como funcionar.
- ✏️ **Situação do cadastro do advogado**: trocar o `verificado: true/false` por
  `situacaoOab: "em_analise" | "aprovado" | "recusado" | "revogado"` (+ motivo e data).
  Migrar os advogados do seed (verificado → aprovado).
- ✅ Login por e-mail/senha e Google, papéis, unicidade de e-mail e OAB, especialidades da lista
  do sistema, currículo (inserir/consultar/atualizar/excluir itens), excluir a própria conta.

**Pronto quando:** cliente novo informa cidade/UF; advogado novo nasce "em análise".

> ⚠️ **No deploy:** o banco já tem a `situacaoOab` (migração rodada em 07/10, sem apagar o
> `verificado`, pra não quebrar o site no ar). **Depois** de subir o código novo, rodar
> `migrar-situacao-oab.js --remover-verificado` pra apagar o campo antigo. Clientes antigos
> sem cidade veem um aviso no painel pedindo pra completar.

## Sprint 2 — Validação da OAB pelo admin (RF011, RF009) ✅ código feito em 07/10

- ➕ Fila de **cadastros pendentes** com número e UF da OAB, e link pro Cadastro Nacional dos
  Advogados (CNA) da OAB pra conferência manual.
- ➕ Ações **aprovar**, **recusar** (com motivo) e **revogar** (quando a inscrição deixar de
  estar ativa), registrando quem fez e quando.
- ➕ **Notificar o advogado** em cada caso (sininho + e-mail pelo Resend).
- ✏️ Advogado "em análise"/"recusado"/"revogado" **não aparece** na lista pública nem na
  triagem (hoje quem ainda não foi aprovado já aparece — bug).
- ➕ Aviso no painel do advogado mostrando a situação dele (e o motivo, se recusado).

**Pronto quando:** só advogado aprovado aparece pro cliente, e o advogado é avisado de tudo.

> Feito também: advogado recusado corrige a OAB pelo próprio perfil e volta pra análise;
> histórico de toda decisão; regras de transição (só recusa quem está em análise, só revoga
> quem está aprovado). Banco: os 30 advogados fictícios do seed foram aprovados (07/10).

## Sprint 3 — Triagem em duas etapas (RF005–RF007)

- ✏️ **Etapa 1 — perguntas comuns a todos os casos**, respondidas com as próprias palavras
  (ex.: o que aconteceu, com quem é o problema, quando aconteceu). A IA identifica a **área**
  (cível ou trabalhista).
- ✏️ **Etapa 2 — perguntas específicas da área** identificada, também abertas. A IA identifica
  a **especialidade** (uma das 33 da taxonomia).
- ✏️ Fallback por regras continua existindo nas duas etapas (a triagem nunca trava) e o tempo
  total respeita o RNF003 (até 5 segundos por etapa).
- ➕ Caso a IA não consiga identificar a área: deixar o cliente escolher entre cível e
  trabalhista em vez de mostrar "indefinido".
- ✏️ Atualizar o script `avaliar-triagem` e os testes pro formato novo.
- 📝 **Conteúdo das perguntas**: rascunho meu, revisão do time.

**Pronto quando:** os casos de teste continuam batendo área e especialidade nas duas etapas.

## Sprint 4 — Resultado com localização (RF008, RF009)

- ✏️ Filtro por **especialidade + localização do cliente**: primeiro quem é da mesma cidade,
  depois do mesmo estado; dizer isso claramente na tela.
- ➕ Mensagem de "nenhum advogado compatível encontrado" (fluxo alternativo do caso de uso).
- ✅ Perfil do advogado com dados profissionais e currículo — só aprovados.
- ➖ Botões de WhatsApp/e-mail direto no perfil (passam a aparecer só depois do aceite, Sprint 5).

**Pronto quando:** cliente de SP não recebe advogado de Curitiba sem aviso.

## Sprint 5 — Pedido de contato (RF010, RF013, RF014)

- ➕ Coleção nova `solicitacoes` (cliente, advogado, triagem, autorização, situação
  `pendente | aceita | recusada`, datas).
- ➕ Botão **"Solicitar contato"** no perfil do advogado: mostra exatamente quais respostas da
  triagem vão junto e exige a autorização do cliente pra enviar (substitui o checkbox de opt-in
  que hoje fica na triagem).
- ➕ Pedido registrado na hora + **notificação pro advogado** (sininho + e-mail).
- ➕ Advogado **aceita ou recusa**; o cliente é notificado nos dois casos e só vê o WhatsApp/e-mail
  depois do aceite.
- ➕ Tela **"Minhas solicitações"** do cliente: advogado, data e situação de cada pedido.
- ➖ Chat de mensagens prontas, "Meus contatos" com etiquetas e o log de cliques de contato
  (decidido em 07/10: o pedido de contato faz o papel do chat).
- ✏️ Evitar pedido duplicado pendente pro mesmo advogado; regras e índices do Firestore.

**Pronto quando:** o fluxo inteiro cliente → advogado → cliente funciona com notificações.

## Sprint 6 — Quadro de casos do advogado (RF012)

- ➕ **Quadro estilo Kanban** com as colunas **pendente**, **em andamento** e **concluído**.
  Aceitar um pedido move o caso de "pendente" pra "em andamento".
- ➕ Cada cartão mostra área, especialidade, respostas da triagem, data do pedido e — só nos
  casos aceitos — o nome do cliente.
- ➕ Advogado pode **mudar a situação**, definir **prioridade** (baixa/média/alta) e escrever
  **anotações** privadas.
- ➕ Arrastar entre colunas no computador; no celular, botões (arrastar no toque é ruim).
- ➕ **O caso só sai do quadro quando o advogado tirar** (botão "Arquivar"), mesmo depois de
  concluído — nada some sozinho do painel dele (decidido em 07/10). Arquivados ficam numa
  lista à parte, pra consulta.
- ✏️ Painel do advogado (`/perfil`) passa a resumir o quadro (quantos casos em cada coluna).

**Pronto quando:** dá pra demonstrar um caso saindo de pendente até concluído.

## Sprint 7 — Fechamento da parte funcional

- ✏️ "Meus dados" (LGPD) exportando as coleções novas.
- ✏️ Seed de demonstração: alguns pedidos e casos em cada coluna, sem contas de teste.
- ✏️ Docs: `README.md`, `database/schema.md`, `docs/TESTES.md`.
- 📝 Lista do que mudar na **monografia**: requisitos, casos de uso (sai A.8–A.11, entram
  solicitar contato e quadro de casos), DER/diagrama de classes com as coleções novas, resumo e
  ODS 16.6 (que citam denúncias).
- 🎬 Roteiro da demonstração pra banca, passo a passo.

---

## Depois: UX/UI das telas internas

0. Ajustes de responsividade no celular (pedido em 07/10), começando pela Home

Com a funcionalidade no lugar, aplicar o visual da Home (paleta, serifa, cantos retos) tela
por tela, na ordem da demonstração:

1. Login e cadastro
2. Triagem (etapas 1 e 2) e resultado
3. Perfil público do advogado e pedido de contato
4. Painel do cliente e "Minhas solicitações"
5. Quadro de casos e painel do advogado
6. Admin (validação de OAB)

## O que fica como está (extras fora dos requisitos)

- ✅ **Cartão de visita digital do advogado** — reforça o lado do advogado, que foi a crítica
  da banca (decidido em 07/10).
- ✅ PWA, LGPD (baixar/apagar dados), política de privacidade, Sentry, Analytics.
