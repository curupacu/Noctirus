# Roteiro da demonstração — banca

Demonstração ao vivo no site de verdade (https://nocturis.com.br), mostrando os três lados:
**cliente**, **advogado** e **administrador**. Tempo-alvo: **8 a 10 minutos** de tela.
Atualizado em 14/10/2026 (triagem curta, destaque dos advogados mais compatíveis, tela de
"contato liberado", multas/CNH dentro de cível e INSS dentro de trabalhista).

## Antes de começar (no dia, com 15 minutos de folga)

1. **Resetar a demonstração** — deixa o quadro do advogado e o painel do cliente prontos e
   apaga o pedido feito ao vivo no último ensaio (rodar da raiz do repo):

   ```bash
   GOOGLE_APPLICATION_CREDENTIALS=./backend/service-account.json FIREBASE_PROJECT_ID=nocturis-web \
     node database/seed/demo-casos.js advogado.teste@example.com cliente.teste@example.com
   ```

2. **Acordar a API**: abrir https://noctirus-backend.onrender.com/health e esperar responder.
   O GitHub Actions já chama a API a cada 10 minutos das 7h às 23h (workflow "Manter backend
   acordado"), mas o agendamento às vezes atrasa — abrir antes é a garantia. Se mesmo assim
   demorar, o site mostra o aviso "Acordando o servidor..." sozinho.
3. Abrir **três janelas anônimas** (uma por papel), já logadas:
   - Cliente: `cliente.teste@example.com`
   - Advogado: `advogado.teste@example.com` (aparece como **Marcos Autilio**)
   - Admin: a conta de admin do time
   (as senhas ficam com o time — não vão pro repositório).
4. **Na janela do cliente, abrir o painel uma vez e clicar em "Ver depois"** na tela de
   "contato liberado" (o reset cria um pedido já aceito). Assim ela não aparece no começo da
   apresentação — só no final, quando o advogado aceitar ao vivo.
5. Ter o caso de exemplo abaixo copiado, pra colar na triagem sem digitar ao vivo.
6. **Plano B**: um vídeo gravado do mesmo roteiro, caso a internet do auditório falhe.

## 1. Abertura — Home (1 min)

- O problema: quem precisa de ajuda jurídica não sabe de que área é o caso nem que advogado
  procurar; quem está começando na advocacia não tem clientela.
- Mostrar rapidamente as seções: como funciona, assuntos atendidos, advogados cadastrados.
- Áreas: **cível e trabalhista** — o que inclui multas e CNH (dentro de cível) e benefícios do
  INSS como aposentadoria e pensão por morte (dentro de trabalhista).
- Frase-chave: **"A Nocturis não presta serviço jurídico — ela classifica e direciona."**

## 2. Cliente (4 min) — janela do cliente

1. **Painel**: cartão de destaque com a última triagem, os pedidos de contato e as vitrines
   de advogados. Comentar: a ordem das vitrines é neutra e muda todo dia — **não existe
   ranking de "mais procurados"**, porque o Código de Ética da OAB pede publicidade
   informativa, sem comparação entre advogados.
2. **Nova triagem** — são só 4 telas, uma pergunta por vez:
   1. "O que aconteceu?" — colar o caso de exemplo. Mostrar que é texto livre, com as palavras
      da própria pessoa.
   2. "Quando isso aconteceu?"
   3. **Área identificada pela IA**: "Pelo que você contou, é um caso trabalhista." — dá pra
      trocar se não fizer sentido.
   4. **"Confere se é isso:"** — os assuntos já vêm **marcados pela IA** em chips; a pessoa só
      confere (desmarca ou marca mais). Campo opcional "Quer acrescentar algo?".
   Comentar: antes eram 7 perguntas e algumas repetiam o que a pessoa já tinha contado — um
   teste com uma usuária de fora do time mostrou isso, e a triagem foi encurtada.
3. **Resultado**: "Os mais compatíveis com o seu caso" — os 3 primeiros em destaque, com o
   motivo de cada um ("Atua no assunto do seu caso · Atende na sua cidade"), a apresentação
   do advogado e o botão "Pedir contato" direto no cartão. Os demais ficam em "Ver outros".
   Reforçar: **"mais compatíveis"** pelo assunto e pela cidade — nunca "melhores".
4. Abrir o perfil do **Marcos Autilio**: apresentação, especialidades, currículo e selo "OAB
   verificada". Mostrar que **não aparece WhatsApp nem e-mail** — só a barra "Pedir contato".
5. **Pedir contato**: o caso já vem escolhido; mostrar exatamente o que vai ser enviado
   (pergunta por pergunta) e a **autorização obrigatória**. Enviar.

## 3. Advogado (3 min) — janela do advogado

1. **Notificação** do pedido novo (sininho).
2. **Quadro de casos**: o pedido que acabou de chegar está em **Pendentes**, junto com os
   casos da demonstração em andamento e concluídos.
3. Abrir o pedido: as respostas da triagem separadas por pergunta; **o nome do cliente ainda
   não aparece**.
4. **Aceitar** → o cartão vai pra **Em andamento**, o nome do cliente aparece e o aviso
   "Seu contato foi liberado pra este cliente".
5. Definir **prioridade alta** e escrever uma **anotação** ("pedir holerites") — só o
   advogado vê.
6. Arrastar outro caso pra **Concluídos**. Comentar: o caso só sai do quadro quando o
   advogado arquiva.
7. Voltar na **janela do cliente** e recarregar o painel → aparece a tela **"Marcos Autilio
   aceitou seu pedido!"** com os botões de WhatsApp e e-mail. No painel fica o cartão verde de
   "contato liberado".

## 4. Administrador (1 min) — janela do admin

1. **Validação de OAB**: abas Pendentes / Aprovados / Recusados / Revogados, com busca por
   nome ou número da OAB.
2. "Verificar no CNA" copia o número e abre o Cadastro Nacional dos Advogados.
3. Recusar ou revogar **exige motivo**, que o advogado recebe por notificação e e-mail. Só
   advogado aprovado aparece pros clientes.
   (Pra mostrar a aprovação ao vivo, criar antes um cadastro de advogado novo — ele fica em
   Pendentes.)

## 5. Fechamento (1 min)

- O que mudou depois da banca de outubro: sem denúncias e suspensões (quem julga conduta
  profissional é a OAB), contato só com aceite do advogado, quadro de casos pro advogado,
  triagem curta com confirmação dos assuntos, filtro pela região do cliente, cobertura de
  multas/CNH e benefícios do INSS.
- Qualidade:
  - **187 testes automatizados** rodando no GitHub Actions.
  - Triagem avaliada com **26 casos reais: 26/26 na área e 26/26 no assunto** (14/10/2026, incluindo multas, CNH, pensão por morte, golpe de Pix e funeral); ela nunca trava, porque se a IA principal falhar
    entra a segunda (Gemini → Groq) e, por último, a classificação por regras.
  - Lighthouse (celular): acessibilidade **100**, boas práticas **100**, SEO **92 a 100**.
- LGPD: consentimento no cadastro; "Meus dados" pra baixar ou apagar tudo (apagar a conta
  apaga também as triagens); contatos e nome só depois do aceite.

## Caso de exemplo (colar na triagem)

- **O que aconteceu?** — *Trabalho num restaurante como auxiliar de cozinha, com carteira
  assinada. Quase todo dia fico duas horas a mais depois do expediente e às vezes nem tenho
  intervalo, mas no fim do mês essas horas nunca aparecem no meu pagamento.*
- **Quando?** — *Desde que entrei, faz uns oito meses.*
- Tela da área: confirmar **Trabalhista**.
- Tela dos assuntos: devem vir marcados **Horas extras não pagas** (e provavelmente
  **Jornada excessiva e intervalo não respeitado**). O detalhe opcional pode ficar em branco.

Resultado esperado: **Trabalhista — Horas extras não pagas**.

## Perguntas prováveis da banca

- **"Isso não é captação de clientela?"** — A plataforma não escolhe pelo cliente nem
  promove ninguém: mostra quem atende o assunto e a região, pelos critérios objetivos do caso.
  Quem decide pedir contato é o cliente, e quem decide aceitar é o advogado. A conversa
  acontece fora da plataforma.
- **"Por que só cível e trabalhista? E multa de trânsito, INSS?"** — Estão cobertos dentro
  das duas áreas: multas, CNH e Lei Seca como assuntos de cível; aposentadoria, auxílio-doença
  e pensão por morte como assuntos de trabalhista, do jeito que muitos escritórios atuam
  ("trabalhista e previdenciário").
- **"E se o advogado não tiver OAB válida?"** — Ele fica invisível até o admin conferir no
  CNA; se a inscrição deixar de estar ativa, a aprovação é revogada com motivo registrado.
- **"Por que tiraram as denúncias?"** — A plataforma não tem competência pra julgar conduta
  profissional — isso é papel da OAB — e remover um advogado poderia gerar processo contra a
  plataforma.
- **"E se a IA errar?"** — O cliente vê a área sugerida e pode trocar, e confere os assuntos
  marcados antes de ver os advogados. Se a IA cair, a classificação por regras assume.
- **"Os dados do cliente ficam seguros?"** — O advogado só vê as respostas que o cliente
  autorizou mandar, e o nome só depois de aceitar; o cliente pode baixar ou apagar tudo.

## Antes da banca (checklist do time)

- [ ] Ensaiar o roteiro inteiro pelo menos duas vezes, rodando o reset antes de cada um.
- [x] Conta "Advogado Teste" renomeada pra **Marcos Autilio** (13/10/2026).
- [ ] Testar login com Google e "Esqueci minha senha" (o e-mail chega? cai no spam?).
- [ ] Traduzir o e-mail de redefinição de senha no Firebase Console (Authentication →
      Templates).
- [ ] Gravar o vídeo do plano B.
- [ ] Conferir no celular (o público da Nocturis usa principalmente o celular).
