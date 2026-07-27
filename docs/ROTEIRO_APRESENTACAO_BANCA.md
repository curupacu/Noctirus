# Nocturis — Roteiro de Apresentação para Banca Avaliadora

> Roteiro completo (~18–20 minutos de fala + Q&A), escrito assumindo que o
> `PLANO_ATE_NOVEMBRO.md` foi cumprido integralmente: UI unificada em todo o app, triagem
> calibrada com casos reais, avaliação/reputação do advogado, upload de foto/currículo,
> Termos de Uso e Aviso de Privacidade publicados.
>
> **Composição da banca a considerar:** professores do curso (área técnica), professores
> de marketing, jogos e administração (fora da área), e um representante da FATEC — a
> faculdade que vocês pretendem cursar em seguida. Isso muda a estratégia de fala: cada
> vez que o roteiro pedir uma explicação técnica, existe uma "tradução" ao lado para quem
> não é da área. **Regra de ouro: toda vez que for citar uma tecnologia (Firebase, IA,
> Firestore), explique o que ela faz em uma frase antes do nome.**

---

## Antes de começar — divisão de falas sugerida

| Bloco | Quem fala | Por quê |
| --- | --- | --- |
| Abertura, problema, justificativa, negócio, fechamento | **Gustavo** (líder, análise/documentação) | É quem mais domina a narrativa e os dados da pesquisa de campo |
| Demonstração ao vivo do app | **Gabriel** (front-end/design) | É quem construiu a experiência que está sendo mostrada |
| Arquitetura, decisões técnicas, segurança | **Guilherme** (back-end/BD) | É quem tomou as decisões técnicas e pode responder perguntas de profundidade |

Todos os três devem conseguir responder qualquer pergunta básica sobre as outras partes —
a banca costuma testar isso de propósito perguntando para quem não apresentou aquele
bloco.

---

## 1. Abertura (0–1 min) — Gustavo

> "Bom dia/tarde. Somos o Gustavo, o Gabriel e o Guilherme, do curso Técnico em
> Desenvolvimento de Sistemas, e vamos apresentar o Nocturis: uma plataforma de triagem e
> indicação jurídica desenvolvida pela nossa empresa fictícia, a Aggrem."
>
> *Nota:* usar deliberadamente **"triagem e indicação jurídica"**, não "advocacia
> virtual" — é o ajuste de posicionamento que consta na análise estratégica (a Nocturis
> indica advogados, não presta advocacia, que é atividade exclusiva de quem tem OAB).

## 2. O problema (1–3 min) — Gustavo

> "O ponto de partida foi uma pesquisa que fizemos com dois públicos: pessoas que já
> precisaram de ajuda jurídica, e advogados, principalmente recém-formados."
>
> *(mostrar 1 ou 2 gráficos da pesquisa de campo — os mesmos da monografia)*
>
> "Do lado do usuário, o problema mais citado não foi desconfiança do advogado — foi não
> saber **por onde começar**: qual área do Direito é meu caso, e a quem eu recorro. Do
> lado do advogado, o problema foi captação de cliente: sem indicação, é muito difícil
> começar carreira."
>
> **Tradução pra quem não é da área técnica:** pensem nisso como o mesmo problema que
> qualquer marketplace de dois lados enfrenta — como o iFood no começo precisava
> convencer restaurante e cliente ao mesmo tempo. Aqui, o "restaurante" é o advogado e o
> "cliente" é quem precisa de ajuda jurídica.

## 3. Objetivo e justificativa (3–4:30) — Gustavo

> "Nosso objetivo foi construir essa ponte: um sistema que ajuda a pessoa a entender o
> próprio problema jurídico e a conecta com o profissional certo, de forma organizada e
> acessível."
>
> "A justificativa vai além do TCC: o projeto se alinha ao Objetivo de Desenvolvimento
> Sustentável 16 da ONU, sobre acesso à justiça e instituições eficazes — não é só uma
> ideia de sistema, é uma causa social real."

## 4. Metodologia (breve) (4:30–6 min) — Gustavo

> "Trabalhamos em sprints semanais, com Kanban no Trello pra organizar tarefas, e todo o
> código versionado no GitHub com revisão em Pull Request antes de qualquer mudança
> entrar no ar."
>
> **Tradução:** "sprint" é só um bloco fechado de uma semana de trabalho com uma meta
> clara — é a mesma lógica de um cronograma de produção usada em outras áreas, só que
> revisado toda semana em vez de fechado no início do ano.

## 5. Demonstração ao vivo (6–13 min) — Gabriel

**Este é o bloco mais longo de propósito — é o que a banca mais lembra depois.** Roteiro
passo a passo (ajustar conforme o estado real do app em novembro):

1. **Home/cadastro** — mostrar a tela inicial redesenhada, cadastro como cliente.
2. **Triagem** — descrever um caso real e simples ("fui demitido sem receber verbas") em
   texto livre + responder as perguntas guiadas.
3. **Resultado** — mostrar a IA identificando a área (trabalhista), o tipo de advogado
   ideal, e a lista de advogados compatíveis por especialidade e cidade.
4. **Perfil público do advogado** — abrir um perfil, mostrar currículo, foto (se o upload
   estiver pronto), e o **selo de avaliação/reputação**.
5. **Contato direto** — clicar no botão de WhatsApp, mostrar que abre a conversa
   pré-preenchida.
6. **Denúncia** — mostrar rapidamente o fluxo de denúncia e a tela onde o autor acompanha
   a decisão ("Minhas denúncias").
7. **Painel admin** — mostrar o painel de moderação: lista de denúncias, ação de suspender
   um advogado, e o efeito disso no perfil público (aviso "suspenso da plataforma").

> **Frase de transição pra quem não é da área:** "O que vocês estão vendo no passo 3 não
> é uma lista fixa — é uma inteligência artificial (a mesma família de tecnologia por
> trás do ChatGPT) lendo o que a pessoa escreveu e decidindo a classificação na hora, com
> um plano B automático caso ela falhe ou demore, pra nunca travar a experiência."

## 6. Arquitetura e decisões técnicas (13–15 min) — Guilherme

> "Por trás da tela, o sistema tem três camadas: o que a pessoa vê (frontend, feito em
> React), o que processa as regras de negócio e fala com a inteligência artificial
> (backend, em Node.js), e onde os dados ficam guardados (Firestore, um banco de dados na
> nuvem do Google)."
>
> "Um ponto que temos orgulho de trazer pra essa banca: durante o desenvolvimento,
> encontramos e corrigimos **três falhas reais de segurança** nas regras de acesso ao
> banco — por exemplo, um advogado conseguia se auto-aprovar sem passar pelo
> administrador. Testamos os ataques de verdade, corrigimos, e testamos de novo antes de
> publicar. Isso é mencionado porque **segurança de dado pessoal é a base de qualquer
> sistema que lida com informação sensível**, e preferimos mostrar o processo de
> encontrar e corrigir do que fingir que nunca existiu."
>
> **Tradução pra quem não é da área:** pensem nisso como testar a fechadura de uma porta
> tentando arrombar ela mesmo antes de entregar a chave pro cliente — encontramos três
> fechaduras mal ajustadas e consertamos antes que alguém de fora encontrasse.

## 7. Resultados e validação (15–16:30) — Gustavo ou Guilherme

> "O sistema está no ar hoje em [https://nocturis-web.web.app](https://nocturis-web.web.app),
> testado por pessoas de fora do grupo, com 30 advogados fictícios cobrindo 14 estados
> pra simular um cenário realista de uso. Rodamos casos de teste reais pra calibrar a
> precisão da triagem antes de considerar essa parte pronta."

## 8. Modelo de negócio e viabilidade (16:30–18 min) — Gustavo

> "Pensando além do TCC: a receita viria de uma assinatura de visibilidade paga pelo
> advogado, não do usuário — que usa de graça. Evitamos de propósito cobrar por
> indicação individual, porque isso esbarra nas regras de publicidade da OAB; uma
> assinatura fixa, como uma vitrine profissional, é o caminho que plataformas jurídicas
> maduras adotam."
>
> "Documentamos tudo isso — modelo de negócio, análise de mercado, plano de segurança e
> de conformidade com a LGPD — num plano de negócios completo que está anexado à
> monografia."

## 9. Fechamento (18–19 min) — Gustavo

> "O Nocturis já resolve, de ponta a ponta, o problema que apresentamos no início: ajudar
> alguém a entender seu problema jurídico e encontrar o profissional certo. Sabemos
> exatamente o que falta pra crescer além do TCC, e é um projeto que **queremos
> continuar** — se ele fizer sentido pra essa banca, pretendemos levá-lo pra frente na
> FATEC."
>
> *(olhar para o representante da FATEC ao dizer essa última frase — é o momento de
> plantar essa semente diretamente)*
>
> "Obrigado, ficamos à disposição para perguntas."

---

## Perguntas prováveis — e como responder sem jargão

| Quem pode perguntar | Pergunta provável | Resposta sugerida |
| --- | --- | --- |
| Prof. de marketing | "Como vocês pretendem atrair os primeiros advogados?" | "Por parcerias com núcleos de prática jurídica e faculdades de Direito, e com advogados recém-formados — que são exatamente o público que mais precisa de visibilidade, então o custo de convencê-los é baixo." |
| Prof. de administração | "Qual o custo pra manter isso rodando?" | "Hoje, praticamente zero — usamos só os planos gratuitos da infraestrutura em nuvem. Se crescer, calculamos entre R$50 e R$150 por mês, valor documentado no nosso plano de negócios." |
| Prof. de jogos | "A parte de inteligência artificial foi difícil de implementar?" | "O desafio maior não foi a IA em si, foi garantir que o sistema nunca travasse se ela falhasse — por isso existe um plano B automático por regras, sempre testado." |
| FATEC | "Vocês pretendem continuar isso na faculdade?" | "Sim — é exatamente essa a nossa intenção, e adoraríamos orientação de vocês sobre como formalizar isso, seja como projeto de extensão, iniciação ou incubação." |
| Prof. da área técnica | "Por que Firestore e não um banco relacional?" | "Porque os dados do projeto são bem auto-contidos por entidade — o currículo do advogado já é um objeto dentro do próprio perfil dele, sem necessidade de relações complexas entre tabelas." |
| Qualquer um | "O que vocês fariam diferente se recomeçassem?" | Seja honesto: "Teríamos escrito testes automatizados desde o início, não só a partir do meio do projeto — isso teria evitado retrabalho." (Mostra maturidade, não fraqueza.) |

---

## Checklist de ensaio (fazer antes do dia)

- [ ] Ensaiar com cronômetro real — 18–20 min de fala, sem contar perguntas.
- [ ] Testar a demonstração ao vivo em rede diferente da de casa (Wi-Fi de escola pode ser
  mais lento) — ter um vídeo gravado de backup caso a internet falhe.
- [ ] Decidir com antecedência quem responde perguntas técnicas vs. de negócio, mas todos
  os três devem saber responder qualquer pergunta básica.
- [ ] Revisar se as telas mostradas na demo batem com o que está escrito neste roteiro —
  ajustar o passo a passo da seção 5 se alguma tela mudar de nome ou de lugar.
