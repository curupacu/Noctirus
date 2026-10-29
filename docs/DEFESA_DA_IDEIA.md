# Parte 1: por que a Nocturis faz sentido e como responder "a OAB não deixa"

Material de estudo do grupo (29/10/2026). Primeiro o problema com números, depois o que as regras da OAB dizem
de verdade, depois como a Nocturis foi desenhada pra ficar do lado permitido, e por fim as respostas prontas.

## 1. O problema é real (com números)

**Do lado de quem precisa de ajuda:**
- **40,9% das comarcas estaduais e 59,8% das subseções federais não têm Defensoria Pública.** São 37,4 milhões
  de pessoas sem cobertura na Justiça estadual, 34,4 milhões delas vulneráveis (renda de até três salários
  mínimos). Fonte: Pesquisa Nacional da Defensoria Pública (Condege, CNCG e DPU), dados de junho de 2024,
  noticiada pelo [Conjur](https://www.conjur.com.br/2025-fev-21/41-das-comarcas-estaduais-e-60-das-subsecoes-federais-nao-tem-defensor-publico//?print=1).
- Pesquisa do CNJ resume a visão da população: a Justiça é vista como **cara e complexa**
  ([Diário de Pernambuco](https://www.diariodepernambuco.com.br/politica/2025/07/7793726-brasileiros-consideram-o-judiciario-caro-e-complexo-aponta-pesquisa-do-cnj.html)).
- A pessoa comum nem sabe se o problema dela é "caso de advogado", nem de que área. É aí que ela desiste.

**Do lado de quem advoga:**
- O Brasil tem **1.447.518 advogados inscritos** (estatística do Conselho Federal citada pelo
  [Jornal do Comércio](https://www.jornaldocomercio.com/colunas/espaco-vital/2025/06/1205230-maioria-feminina-nos-quase-100-mil-advogados-no-rs.html), junho de 2025).
- **52% têm menos de 10 anos de carreira** ([Rota Jurídica](https://www.rotajuridica.com.br/?p=138294)).
  Quem está começando tem dificuldade de ser encontrado e não pode sair anunciando, porque a publicidade da
  advocacia é muito restrita.

**A frase pra banca:** existem milhões de pessoas sem caminho até um advogado e mais de um milhão de advogados
sem caminho até quem precisa deles. A Nocturis é a ponte, dentro das regras.

**Ligação com a ODS 16, meta 16.3:** "promover o Estado de Direito e garantir a igualdade de acesso à justiça
para todos". É a meta mais forte pro projeto. (Atenção: a monografia ainda cita a meta 16.6 por causa das
denúncias, que saíram do projeto. Vale trocar pela 16.3.)

## 2. O que as regras da OAB dizem de verdade

Não digam "a OAB permite". A resposta honesta é: **existe uma zona cinzenta, a gente conhece as regras e
desenhou o sistema pra ficar do lado permitido.**

| Regra | O que diz |
| --- | --- |
| **Estatuto da Advocacia (Lei 8.906/94), art. 34, IV** | É infração do advogado "angariar ou captar causas, com ou sem a intervenção de terceiros". É daqui que vem o "a OAB não deixa". (Obs.: em alguns arquivos internos isso aparece como "art. 34, IV do Código de Ética", mas o artigo é do **Estatuto**.) |
| **Código de Ética e Disciplina (2015), capítulo da publicidade** | A publicidade do advogado tem que ser informativa, discreta e sóbria, sem captação de clientela nem mercantilização. |
| **Provimento 205/2021** | Atualizou a publicidade: **permite** presença digital, sites e plataformas, desde que a comunicação seja informativa e sem captação indevida. Está sendo revisado pelo Conselho Federal ([OAB-RS](https://www2.oabrs.org.br/jornalDaOrdem/oab-publica-no-diario-eletronico-o-provimento-sobre-a-publicidade-na-advocacia/47710), [Tupi](https://www.tupi.fm/?p=2258855)). |
| **Tribunal de Ética da OAB-SP, Proc. 25.0886.2024.023887-5 (20/03/2025)** | **A decisão mais importante.** Considerou vedadas as plataformas que fazem "conexões personalizadas, recomendações ou encaminhamentos" entre clientes e advogados. Considerou **permitido** o advogado estar num "banco de dados, desprovido de serviço de aproximação", em que a iniciativa do contato parte só do usuário, sem "estímulo ou direcionamento promovido pelo sistema" ([Migalhas](https://www.migalhas.com.br/quentes/428666/plataformas-de-conexao-entre-advogados-e-clientes-fere-codigo-de-etica)). |
| **Corregedoria nacional da OAB (2020)** | Disse que plataformas de intermediação não são permitidas pelas regras de então ([Folha PE](https://www.folhape.com.br/noticias/oab-aperta-cerco-a-sites-e-plataformas-que-oferecem-servicos-juridicos/158150/)). |

**Detalhes que ajudam na defesa:**
- A decisão da OAB-SP é uma **resposta a consulta de uma seccional**, sobre a conduta do advogado. Não é lei e
  não vale pro Brasil inteiro, mas mostra como a OAB pensa. Por isso a gente leva a sério.
- O critério dela não é "tecnologia sim ou não". É: **o sistema empurra o cliente pra um advogado, ou o cliente
  procura e escolhe sozinho?** E: **alguém está lucrando com a captação?**

## 3. Como a Nocturis foi desenhada pra ficar do lado permitido

Cada escolha do sistema responde a um ponto da regra (dá pra mostrar no código, em
`backend/src/services/matching.js` e nas rotas de pedidos de contato):

1. **Ninguém paga nada.** O advogado não paga pra aparecer nem por cliente, não há comissão, o cliente não
   paga. Sem dinheiro no meio, não há mercantilização da profissão.
2. **Ninguém compra posição.** A ordem dos advogados vem só de critérios objetivos e iguais pra todos: atende a
   área do caso, atende no estado do cliente, é da mesma cidade, atua nos assuntos marcados. Funciona como um
   **filtro de busca**, do mesmo jeito que o Cadastro Nacional da OAB deixa buscar advogado por estado.
3. **A iniciativa é sempre do cliente.** O advogado não vê lista de clientes, não manda mensagem primeiro e não
   tem como "ir atrás" de ninguém. Ele só fica sabendo de quem pediu contato com ele.
4. **O advogado decide se aceita.** O contato (WhatsApp e e-mail) só é liberado depois do aceite, e a conversa
   acontece fora da plataforma.
5. **Só aparece advogado com OAB conferida** pelo admin no Cadastro Nacional dos Advogados. Se a inscrição
   deixar de valer, a aprovação é revogada com motivo registrado.
6. **Sem promessa, sem ranking de "melhores", sem depoimentos.** O site fala em "os mais compatíveis com o seu
   caso", nunca "os melhores". Não mostra resultado de processo nem avaliação de cliente, que são os pontos que a
   publicidade da advocacia mais proíbe.
7. **A triagem não dá parecer jurídico.** Ela só identifica a área e o assunto, e o próprio cliente confere e
   pode trocar. O site diz que a Nocturis não presta serviços jurídicos (rodapé da Home e termos de uso).
8. **O perfil do advogado é só informativo:** formação, áreas, OAB e cidade, como o Provimento 205 permite.

**O ponto fraco, pra vocês saberem antes da banca:** mostrar "os mais compatíveis" e avisar o advogado quando
chega um pedido se parece com o que a OAB-SP chamou de "recomendação" e "aproximação". Não escondam isso. A
resposta madura é:

> "A gente conhece a decisão do Tribunal de Ética da OAB-SP de 2025. Por isso a ordem é por critério objetivo,
> ninguém paga, e a iniciativa é sempre do cliente. Se a Nocturis virasse produto de verdade, o primeiro passo
> seria uma consulta formal ao Tribunal de Ética antes de lançar, e se precisasse a gente transformaria o
> resultado num diretório puro: todos os advogados aprovados da área e da região, sem sugestão. Hoje ela é um
> projeto acadêmico, gratuito, com dados de demonstração."

## 4. Respostas prontas

- **"A OAB não deixa isso."**
  "A OAB proíbe captação de clientela e propaganda que mercantiliza a advocacia. O próprio Provimento 205 de
  2021 permite presença digital e plataformas, desde que informativas. A Nocturis não cobra de ninguém, não vende
  posição, e quem procura e escolhe é o cliente. O advogado nunca vai atrás de ninguém."
- **"Isso não é captação?"**
  "Captação é o advogado, ou alguém por ele, ir atrás de cliente. Aqui é o contrário: o cliente procura, filtra
  pelo assunto e pela cidade, e escolhe. É o mesmo princípio de um diretório, só que com uma triagem que ajuda a
  pessoa a saber de que área é o problema dela."
- **"Mas vocês mostram os mais compatíveis. Isso não é recomendar?"**
  "É ordenar por critério objetivo, o mesmo pra todos: área, assunto e proximidade. Ninguém paga pra subir. E se
  a OAB entendesse que até isso é demais, dá pra virar diretório puro mudando só a ordenação, sem mexer no resto."
- **"Como vocês ganhariam dinheiro?"**
  Cuidado: cobrar do advogado por cliente seria mercantilização. Um caminho compatível seria cobrar pelas
  **ferramentas** do advogado (o quadro de casos, o cartão de visita, a gestão), como qualquer software jurídico,
  sem relação com quantos clientes ele recebe. Outro caminho é parceria institucional com faculdades, núcleos de
  prática jurídica e a própria OAB.
- **"E se a IA errar a área?"**
  "O cliente vê a área sugerida e pode trocar, e confere os assuntos antes de ver os advogados. Se a IA cair, uma
  classificação por regras assume."
- **"Já existe algo assim?"**
  "Existem plataformas jurídicas grandes, como o Jusbrasil, e a OAB-SP mostra que o tema está em debate. A
  diferença da Nocturis é o foco em quem não sabe nem por onde começar, com a triagem, e o desenho pensado desde
  o início pra respeitar as regras de publicidade."

## 5. Complementos (29/10/2026)

- **Golpe do falso advogado:** a OAB registrou mais de 2.100 denúncias até maio de 2025 e a OAB-SP lançou o
  ConfirmADV, um sistema de verificação de identidade profissional, depois de 1.600 denúncias
  ([Migalhas](https://www.migalhas.com.br/quentes/429558/falso-advogado-oab-sp-lanca-sistema-apos-1-600-denuncias)).
  A Nocturis só mostra advogado com inscrição conferida no CNA: protege o cliente do mesmo problema que a OAB
  está combatendo.
- **Fala de ética proativa** logo depois da demonstração (ver resposta no chat de 29/10).
- **Limitações a admitir antes de perguntarem:** só duas áreas, IA em camada gratuita (dito na política de
  privacidade), dados de demonstração, poucos testes com usuários reais, a decisão da OAB-SP.
