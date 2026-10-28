# Roteiro da apresentação (cerca de 15 minutos)

Apresentação completa pra banca, com a fala de cada integrante. Os textos entre aspas são
sugestão de fala: dá pra dizer com as próprias palavras, desde que o conteúdo e o tempo se
mantenham. A parte técnica da demonstração (o que clicar, contas, reset) está em
`docs/ROTEIRO_DEMO.md`.

| Bloco | Quem fala | Tempo | Acumulado |
| --- | --- | --- | --- |
| 1. Abertura | Gustavo Cereja | 1:00 | 1:00 |
| 2. O problema | Gustavo Cereja | 1:30 | 2:30 |
| 3. A solução e os objetivos | Gustavo Cereja | 1:00 | 3:30 |
| 4. Pesquisa, design e o que mudou depois da banca | Gustavo Abade | 2:00 | 5:30 |
| 5. Demonstração: o cliente | Gabriel Paulucci | 3:00 | 8:30 |
| 6. Demonstração: o advogado e o admin | Guilherme Reche | 2:30 | 11:00 |
| 7. Como funciona por dentro | Guilherme Reche | 2:00 | 13:00 |
| 8. Ética, LGPD e fechamento | Gustavo Cereja | 1:30 | 14:30 |

Sobram uns 30 segundos de folga pras trocas de fala. **Quem não está falando fica em
silêncio e atento**: nada de mexer no celular nem cochichar.

Quem opera o computador:
- **Gabriel**, na janela do cliente, nos blocos 5 e 8.
- **Guilherme**, nas janelas do advogado e do admin, nos blocos 6 e 7.
- **Abade**, nos slides dos blocos 1 a 4.

---

## Antes de começar (checklist de 15 minutos antes)

1. Rodar o reset da demonstração (comando em `ROTEIRO_DEMO.md`).
2. Abrir https://noctirus-backend.onrender.com/health e esperar responder (servidor acordado).
3. Três janelas anônimas logadas: cliente, advogado (Marcos Autilio) e admin.
4. **Um celular com a conta do cliente**, com os avisos ativados e a tela desbloqueada, na
   mão do Gabriel. É ele que vai mostrar o aviso chegando no bloco 6.
5. Caso de exemplo copiado pra colar na triagem.
6. Vídeo de plano B aberto numa aba, pronto pra dar play se a internet cair.

---

## 1. Abertura (Gustavo Cereja, 1:00)

**Na tela:** slide de capa com o logo da Nocturis.

> "Boa noite a todos. Nós somos o grupo da Aggrem: eu sou o Gustavo Cereja, líder e analista
> do projeto; o Gustavo Abade cuidou do design; o Gabriel Paulucci, do front-end; e o
> Guilherme Reche, do back-end e do banco de dados. Agradecemos às nossas orientadoras e
> orientadores, a professora Roseane e o professor Eder.
>
> Hoje a gente vai apresentar a Nocturis, uma plataforma de triagem jurídica. Em uma frase:
> **a Nocturis não presta serviço jurídico, ela classifica e direciona.** Nos próximos
> minutos vocês vão ver o problema que ela resolve, ela funcionando ao vivo e como ela foi
> construída."

## 2. O problema (Gustavo Cereja, 1:30)

**Na tela:** slide com as duas pontas: quem precisa de ajuda e quem advoga.

> "Pensem em alguém que trabalhou meses fazendo hora extra sem receber. Essa pessoa sabe que
> tem algo errado, mas não sabe se é caso de advogado, nem de que área, nem onde procurar.
> Muitas vezes ela desiste ali mesmo, porque o primeiro passo parece caro e complicado.
>
> Do outro lado, o Brasil tem mais de um milhão e trezentos mil advogados inscritos na OAB.
> Quem está começando tem dificuldade de ser encontrado, e não pode simplesmente sair
> anunciando, porque o Código de Ética da OAB proíbe captação de clientela.
>
> Então a gente tem duas pontas que precisam se encontrar, e nenhum caminho simples e ético
> entre elas."

## 3. A solução e os objetivos (Gustavo Cereja, 1:00)

**Na tela:** slide com o fluxo em 4 passos: contar o caso, confirmar, ver os compatíveis,
pedir contato.

> "A Nocturis é esse caminho. A pessoa conta o caso com as próprias palavras. Uma
> inteligência artificial identifica a área, cível ou trabalhista, e o assunto. A pessoa
> confere e vê os advogados mais compatíveis: os que atendem aquele assunto, perto de onde
> ela mora. Ela pede contato, o advogado aceita e o contato é liberado.
>
> Nossos objetivos foram três: facilitar o primeiro passo de quem precisa de ajuda, dar
> visibilidade honesta pra quem advoga e fazer isso dentro das regras da OAB e da LGPD.
> Agora o Abade vai mostrar como a gente desenhou essa experiência."

## 4. Pesquisa, design e o que mudou depois da banca (Gustavo Abade, 2:00)

**Na tela:** slides com a identidade visual (coruja, paleta marrom e creme), antes e depois.

> "Obrigado, Cereja. A identidade da Nocturis parte da coruja, que simboliza sabedoria e
> atenção, e de uma paleta marrom e creme, que passa seriedade sem ser fria como os sites
> jurídicos tradicionais.
>
> Na banca de outubro, recebemos três críticas importantes. O visual escuro não agradou, o
> lado do advogado estava fraco e o recurso de denúncias trazia risco jurídico. A gente
> refez o visual inteiro com tema claro, criou um quadro de casos pro advogado e tirou as
> denúncias, porque quem julga conduta profissional é a OAB.
>
> Também testamos com uma pessoa de fora do grupo. Ela achou a triagem repetitiva: eram sete
> perguntas e algumas repetiam o que ela já tinha contado. A triagem virou quatro telas
> curtas, e a IA já deixa os assuntos marcados pra pessoa só conferir.
>
> O site funciona no computador e no celular, pode ser instalado como aplicativo e tirou
> nota máxima de acessibilidade no Lighthouse, a ferramenta de auditoria do Google. O
> Gabriel vai mostrar isso funcionando."

## 5. Demonstração: o cliente (Gabriel Paulucci, 3:00)

**Na tela:** janela do cliente, painel aberto.

> "Valeu, Abade. Essa é a conta de um cliente. No painel ele vê a última triagem, os pedidos
> de contato e advogados da região dele. A ordem desses advogados muda todo dia: não existe
> ranking de mais procurados.
>
> Vou fazer uma triagem nova." *(clica em Nova triagem)*
>
> "Primeiro: o que aconteceu. Eu colo o caso de exemplo: trabalho num restaurante, faço duas
> horas a mais quase todo dia e isso nunca aparece no pagamento." *(cola e avança)*
>
> "Depois: quando aconteceu." *(responde e avança)*
>
> "Aqui a IA já identificou: é um caso trabalhista. Se não fizesse sentido, dava pra trocar.
> E aqui ela marcou o assunto: horas extras não pagas. A pessoa só confere." *(avança)*
>
> "Esse é o resultado: os advogados mais compatíveis, com o motivo de cada um, atende esse
> assunto, atende na sua cidade. A palavra é 'compatíveis', nunca 'melhores'.
>
> Vou abrir o perfil do Marcos Autilio. Tem apresentação, especialidades, currículo e o selo
> de OAB verificada. Repara que não aparece WhatsApp nem e-mail dele." *(clica em Pedir
> contato)*
>
> "Ao pedir contato, eu vejo exatamente o que vai ser enviado e preciso autorizar. Enviei.
> Agora é com o advogado. Guilherme, é com você."

## 6. Demonstração: o advogado e o admin (Guilherme Reche, 2:30)

**Na tela:** janela do advogado (Marcos Autilio).

> "Valeu, Gabriel. Essa é a conta do advogado. O sininho já mostra o pedido novo, e ele
> também recebeu um aviso no celular.
>
> Esse é o quadro de casos: pedidos pendentes, casos em andamento e concluídos. O pedido que
> acabou de chegar está aqui. Eu abro e vejo as respostas da triagem, separadas por pergunta.
> O nome do cliente ainda não aparece: ele só é liberado se eu aceitar.
>
> Vou aceitar." *(clica em Aceitar)*
>
> "O caso foi pra em andamento e o nome apareceu. Posso marcar a prioridade e escrever
> anotações que só eu vejo."
>
> *(o Gabriel mostra o celular do cliente pra banca)*
>
> "E do lado do cliente, o aviso chega no celular, como uma mensagem: o advogado aceitou o
> pedido. Quando ele abre o site, aparece a tela de contato liberado, com o WhatsApp e o
> e-mail do advogado.
>
> *(troca pra janela do admin)* Por último, o administrador. Antes de qualquer advogado
> aparecer, a OAB dele é conferida no Cadastro Nacional dos Advogados. Recusar ou revogar
> exige um motivo, que o advogado recebe por aviso e por e-mail."

## 7. Como funciona por dentro (Guilherme Reche, 2:00)

**Na tela:** slide com o diagrama da arquitetura.

> "Por dentro, a Nocturis tem três partes. O front-end, em React, publicado no Firebase
> Hosting. O back-end, em Node com Express, hospedado no Render. E o banco de dados, que é
> o Firestore, um banco NoSQL do Google, com coleções de usuários, advogados, triagens e
> pedidos de contato.
>
> A triagem usa duas inteligências artificiais em sequência: o Gemini, do Google, e o Groq
> como reserva. Se as duas falharem, entra uma classificação por regras. Ou seja, a triagem
> nunca trava. Avaliamos com 26 casos de teste e ela acertou a área e o assunto em todos.
>
> Na segurança: cada rota confere quem está logado e o que essa pessoa pode fazer, os dados
> que chegam são validados e há limite de pedidos pra evitar abuso. O sistema tem 187 testes
> automáticos, que rodam a cada atualização no GitHub. Os avisos no celular usam o Firebase
> Cloud Messaging, e os e-mails saem pelo nosso próprio domínio."

## 8. Ética, LGPD e fechamento (Gustavo Cereja, 1:30)

**Na tela:** slide com os princípios e, no fim, o slide de agradecimento.

> "Obrigado, Guilherme. Pra fechar, os cuidados que guiaram o projeto.
>
> Na ética da OAB: não existe ranking nem anúncio, só critérios objetivos, assunto e região.
> Quem decide pedir contato é o cliente, e quem decide aceitar é o advogado.
>
> Na LGPD: o cliente dá consentimento no cadastro, o advogado só vê o que o cliente
> autorizou, o nome só depois do aceite, e o cliente pode baixar ou apagar todos os dados
> quando quiser.
>
> Como próximos passos, a gente vê a verificação automática da OAB, mais áreas do Direito e
> um acompanhamento do caso depois do contato.
>
> A Nocturis está no ar, em nocturis.com.br. **Ela não presta serviço jurídico: ela
> classifica e direciona.** Muito obrigado, e estamos à disposição pras perguntas."

---

## Se algo der errado

- **Servidor demorando:** aparece a tela da coruja com dicas. Quem está falando segue
  explicando ("enquanto o servidor acorda, vale dizer que...") e não fica em silêncio.
- **Internet caiu:** dar play no vídeo de plano B no ponto do bloco atual. Quem está falando
  narra por cima do vídeo.
- **O aviso não chegou no celular:** seguir sem ele e mostrar a tela de contato liberado
  recarregando o painel do cliente.
- **Estourou o tempo:** encurtar o bloco 7 (falar só da IA e dos testes) e o bloco 4 (pular
  a parte do Lighthouse).

## Perguntas prováveis

Estão no fim de `ROTEIRO_DEMO.md`. Sugestão de quem responde:

| Assunto | Quem responde |
| --- | --- |
| Ética, OAB, captação de clientela | Cereja |
| Design, usabilidade, acessibilidade | Abade |
| Telas, celular, aplicativo | Gabriel |
| IA, banco de dados, segurança, LGPD técnica | Guilherme |
