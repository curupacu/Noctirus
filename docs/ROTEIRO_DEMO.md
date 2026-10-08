# Roteiro da demonstração — banca

Demonstração ao vivo no site de verdade (https://nocturis.com.br), mostrando os três lados:
**cliente**, **advogado** e **administrador**. Tempo-alvo: **8 a 10 minutos** de tela.

## Antes de começar (no dia, com 10 minutos de folga)

1. **Resetar a demonstração** — deixa o quadro do advogado e o painel do cliente prontos e
   apaga o pedido feito ao vivo no último ensaio (rodar da raiz do repo):

   ```bash
   GOOGLE_APPLICATION_CREDENTIALS=./backend/service-account.json FIREBASE_PROJECT_ID=nocturis-web \
     node database/seed/demo-casos.js advogado.teste@example.com cliente.teste@example.com
   ```

2. **Acordar a API**: abrir https://noctirus-backend.onrender.com/health e esperar responder.
   No plano grátis do Render ela hiberna sem uso — a primeira requisição demora.
3. Abrir **três janelas anônimas** (uma por papel), já logadas:
   - Cliente: `cliente.teste@example.com`
   - Advogado: `advogado.teste@example.com`
   - Admin: a conta de admin do time
   (as senhas ficam com o time — não vão pro repositório).
4. Ter o caso de exemplo abaixo copiado, pra colar na triagem sem digitar ao vivo.
5. **Plano B**: um vídeo gravado do mesmo roteiro, caso a internet do auditório falhe.

## 1. Abertura — Home (1 min)

- O problema: quem precisa de ajuda jurídica não sabe se o caso é cível ou trabalhista, nem que
  advogado procurar; quem está começando na advocacia não tem clientela.
- Mostrar rapidamente as seções: como funciona, assuntos atendidos, advogados cadastrados.
- Frase-chave: **"A Nocturis não presta serviço jurídico — ela classifica e direciona."**

## 2. Cliente (4 min) — janela do cliente

1. **Painel**: a última triagem, as solicitações (uma aceita, uma esperando, uma recusada) e as
   prateleiras de advogados. Comentar: a ordem é neutra e muda todo dia — **não existe ranking
   de "mais procurados"**, porque o Código de Ética da OAB pede publicidade informativa, sem
   comparação entre advogados.
2. **Nova triagem — etapa 1** (colar o caso de exemplo). Mostrar que são perguntas abertas, com
   as palavras da própria pessoa.
3. **Área identificada**: "Pelo que você contou, seu caso é da área Trabalhista" — dá pra
   corrigir se não fizer sentido.
4. **Etapa 2**: perguntas específicas da área trabalhista.
5. **Resultado**: especialidade identificada e advogados **do estado do cliente, a cidade dele
   primeiro** ("Na sua cidade").
6. Abrir o perfil do **Advogado Teste**: currículo, especialidades, selo "OAB verificada".
   Mostrar que **não aparece WhatsApp nem e-mail**.
7. **Pedir contato**: mostrar o texto exato que vai ser enviado e a autorização obrigatória.
   Enviar.

## 3. Advogado (3 min) — janela do advogado

1. **Notificação** do pedido novo (sininho).
2. **Quadro de casos**: o pedido que acabou de chegar está em **Pendentes**, junto com os
   casos da demonstração em andamento e concluídos.
3. Abrir o pedido: respostas da triagem; o nome do cliente ainda não aparece.
4. **Aceitar** → o cartão vai pra **Em andamento** e o nome do cliente aparece.
5. Definir **prioridade alta** e escrever uma **anotação** ("pedir holerites") — só o advogado vê.
6. Arrastar outro caso pra **Concluídos**. Comentar: o caso só sai do quadro quando o advogado
   arquiva.
7. Voltar na **janela do cliente** → "Minhas solicitações": o pedido aparece **aceito** e o
   **WhatsApp/e-mail do advogado** foram liberados.

## 4. Administrador (1 min) — janela do admin

1. **Validação de OAB**: abas Pendentes / Aprovados / Recusados / Revogados.
2. "Verificar no CNA" copia o número e abre o Cadastro Nacional dos Advogados.
3. Recusar ou revogar **exige motivo**, que o advogado recebe por notificação e e-mail. Só
   advogado aprovado aparece pros clientes.
   (Pra mostrar a aprovação ao vivo, criar antes um cadastro de advogado novo — ele fica em
   Pendentes.)

## 5. Fechamento (1 min)

- O que mudou depois da banca de outubro: sem denúncias e suspensões (quem julga conduta
  profissional é a OAB), contato só com aceite do advogado, quadro de casos pro advogado,
  triagem em duas etapas, filtro pela região do cliente.
- Qualidade: **174 testes automatizados** no GitHub Actions; triagem avaliada com **20 casos
  reais: 20/20 área e 20/20 especialidade**; triagem nunca trava (Gemini → Groq → regras).
- LGPD: consentimento no cadastro, "Meus dados" pra baixar ou apagar tudo, contatos e nome só
  depois do aceite.

## Caso de exemplo (colar na triagem)

**Etapa 1**
- O que aconteceu? — *Trabalho num restaurante e quase todo dia fico duas horas a mais depois
  do expediente, mas no fim do mês essas horas nunca aparecem no meu pagamento.*
- Com quem é o problema? — *O restaurante onde eu trabalho.*
- Quando? — *Desde que entrei, faz uns oito meses.*

**Etapa 2 (trabalhista)**
- Como era o seu trabalho lá? — *Carteira assinada, como auxiliar de cozinha.*
- Você ainda trabalha lá? — *Ainda trabalho lá.*
- O que não foi pago ou respeitado? — *As horas extras e às vezes não tenho intervalo.*

Resultado esperado: **Trabalhista — Horas extras não pagas**.

## Perguntas prováveis da banca

- **"Isso não é captação de clientela?"** — A plataforma não escolhe pelo cliente nem
  promove ninguém: mostra quem atende o assunto e a região, em ordem neutra. Quem decide pedir
  contato é o cliente, e quem decide aceitar é o advogado. A conversa acontece fora da
  plataforma.
- **"E se o advogado não tiver OAB válida?"** — Ele fica invisível até o admin conferir no CNA;
  se a inscrição deixar de estar ativa, a aprovação é revogada com motivo registrado.
- **"Por que tiraram as denúncias?"** — A plataforma não tem competência pra julgar conduta
  profissional — isso é papel da OAB — e remover um advogado poderia gerar processo contra a
  plataforma.
- **"E se a IA errar?"** — O cliente vê a área sugerida e pode corrigir; a especialidade dá pra
  ajustar no resultado. Se a IA cair, a classificação por regras assume.
- **"Os dados do cliente ficam seguros?"** — O advogado só vê as respostas que o cliente
  autorizou mandar, e o nome só depois de aceitar; o cliente pode baixar ou apagar tudo.

## Antes da banca (checklist do time)

- [ ] Ensaiar o roteiro inteiro pelo menos duas vezes, rodando o reset antes de cada um.
- [ ] Decidir se a conta "Advogado Teste" ganha um nome realista pra apresentação.
- [ ] Gravar o vídeo do plano B.
- [ ] Conferir no celular (o público da Nocturis usa principalmente o celular).
