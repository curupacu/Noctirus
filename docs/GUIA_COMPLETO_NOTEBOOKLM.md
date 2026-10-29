# Nocturis: guia completo do projeto, do zero ao estado atual

Documento de estudo para ser carregado no Google NotebookLM. Escrito em 29/10/2026 a partir do código real do
repositório (frontend, backend, banco de dados, testes e publicação). Ele explica o que é a Nocturis, como cada
parte funciona, o que cada pasta e arquivo faz, por que as decisões foram tomadas e como responder à banca.

---

## PARTE 0. Instruções para o NotebookLM

Este material é longo de propósito. A pessoa que vai estudar não tem formação em programação e precisa entender
o projeto inteiro para defender o TCC. Ao gerar qualquer conteúdo a partir dele, siga estas regras:

1. **Explique como para alguém leigo.** Sempre que aparecer um termo técnico (API, rota, token, componente,
   banco de dados, deploy), explique em uma frase simples e dê um exemplo da própria Nocturis.
2. **Não resuma demais.** Prefira o formato longo e aprofundado. É melhor ficar comprido do que pular partes.
3. **Siga a ordem das partes** deste documento (1 a 19). Cada parte pode virar um episódio de áudio ou um bloco
   de slides.
4. **Use analogias.** A analogia principal do projeto é a de um restaurante: o frontend é o salão e o cardápio,
   o backend é a cozinha, o banco de dados é a despensa e o login é o porteiro que confere o crachá.
5. **Sempre ligue a parte técnica ao motivo.** Toda escolha do sistema tem um porquê (ética da OAB, LGPD,
   segurança, custo zero, experiência do usuário). Explique o porquê junto com o como.
6. **Fale em português do Brasil**, num tom de conversa, sem juridiquês e sem jargão desnecessário.

### Sugestões de pedidos (copie e cole no NotebookLM)

**Áudio (Visão geral em áudio / Audio Overview).** Gere vários áudios, um por bloco, em vez de um só. Escolha o
formato mais aprofundado e a duração mais longa que aparecer. Exemplos de instrução para o campo de
personalização:

- Áudio 1: "Explique para um estudante leigo o que é a Nocturis, o problema que ela resolve e a arquitetura
  geral (partes 1 a 5). Use a analogia do restaurante. Seja longo e detalhado."
- Áudio 2: "Explique o frontend da Nocturis por completo (parte 6): cada pasta, cada tela, os componentes e as
  ferramentas, com exemplos de uso. Seja longo e detalhado."
- Áudio 3: "Explique o backend da Nocturis por completo (parte 7): cada rota, os middlewares, a inteligência
  artificial da triagem com as três camadas e os serviços. Seja longo e detalhado."
- Áudio 4: "Explique o banco de dados, a segurança e a LGPD da Nocturis (partes 8 e 9), mostrando quem vê o
  quê. Seja longo e detalhado."
- Áudio 5: "Percorra passo a passo os fluxos completos da Nocturis (parte 10): cadastro, validação da OAB,
  triagem, pedido de contato, aceite e quadro de casos. Seja longo e detalhado."
- Áudio 6: "Explique testes, publicação, custos e manutenção da Nocturis (partes 11 a 13)."
- Áudio 7: "Faça um debate sobre a ética da OAB e a defesa da ideia (partes 14 e 17), com as perguntas difíceis
  da banca e as respostas."

**Slides (Apresentação de slides / Video Overview, se disponível).** Peça a versão detalhada:
"Crie uma apresentação longa e detalhada, com um slide por assunto, cobrindo todas as partes deste documento na
ordem. Cada slide deve ter um título, três a cinco tópicos curtos e um exemplo da Nocturis. Inclua slides de
diagrama para a arquitetura e para os fluxos."

**Outros formatos úteis:**
- Guia de estudo: "Crie um guia de estudo com perguntas e respostas sobre cada parte, para uma banca de TCC."
- Questionário: "Crie 40 perguntas de múltipla escolha sobre a parte técnica da Nocturis, com a explicação de
  cada resposta."
- Mapa mental: "Crie um mapa mental da arquitetura da Nocturis: frontend, backend, banco, serviços externos."
- Perguntas da banca: "Simule uma banca de TCC fazendo 20 perguntas difíceis sobre a Nocturis e responda cada
  uma usando o documento."

---

## PARTE 1. O que é a Nocturis

A Nocturis é uma **plataforma web de triagem e direcionamento jurídico**. Ela foi criada como Trabalho de
Conclusão de Curso pela empresa fictícia do grupo, a **Aggrem**. Está no ar em **https://nocturis.com.br**.

**O problema:** uma pessoa comum tem um problema (foi demitida e não recebeu as horas extras, está com o nome
negativado indevidamente, precisa de pensão para o filho), mas não sabe se aquilo é "caso de advogado", nem de
que área do Direito é, nem onde procurar. Muitas vezes desiste. Do outro lado, existem mais de 1,4 milhão de
advogados no Brasil, metade com menos de 10 anos de carreira, com dificuldade de serem encontrados, e que não
podem sair anunciando por causa das regras de publicidade da OAB.

**A solução:** a pessoa conta o caso com as próprias palavras. Uma inteligência artificial identifica a área
(cível ou trabalhista) e os assuntos. A pessoa confere e vê os advogados **mais compatíveis** com o caso: os que
atendem aquele assunto, no estado dela, com os da mesma cidade primeiro. Ela pede contato, o advogado aceita ou
recusa, e só depois do aceite o WhatsApp e o e-mail do advogado são liberados. A conversa acontece fora da
plataforma.

**Os três tipos de usuário (papéis):**

| Papel | O que faz na Nocturis |
| --- | --- |
| **Cliente** | Faz a triagem, vê os advogados compatíveis, pede contato, acompanha os pedidos. |
| **Advogado** | Tem um perfil público (depois que a OAB é conferida), recebe pedidos, aceita ou recusa, organiza os casos num quadro, gera cartão de visita. |
| **Admin** | Confere o número da OAB de cada advogado no Cadastro Nacional dos Advogados e aprova, recusa ou revoga. |

**Áreas atendidas:** cível (26 assuntos, como divórcio, pensão alimentícia, guarda, inventário, cobrança
indevida, aluguel e despejo, defeito de produto, plano de saúde, banco e cartão, dano moral, acidente de
trânsito, golpe do Pix, voo atrasado, multa de trânsito, CNH, Lei Seca) e trabalhista (23 assuntos, como
demissão sem justa causa, verbas rescisórias, FGTS, horas extras, assédio moral, acidente de trabalho, trabalho
sem carteira e também os assuntos de INSS: aposentadoria, auxílio-doença, BPC/LOAS, pensão por morte).

**Princípios que guiaram o projeto:**
- Custo zero: tudo roda em planos gratuitos.
- Ética da OAB: ninguém paga, ninguém compra posição, a iniciativa é sempre do cliente, sem promessa de
  resultado, a palavra usada é "mais compatíveis", nunca "melhores".
- LGPD: consentimento no cadastro, o cliente autoriza o que o advogado vê, pode baixar e apagar seus dados.
- Funciona no celular como aplicativo (PWA), com avisos no celular.

---

## PARTE 2. Glossário para leigos

| Termo | Explicação simples | Exemplo na Nocturis |
| --- | --- | --- |
| **Frontend** | A parte que a pessoa vê e toca no navegador. | As telas da triagem, do painel, do quadro de casos. |
| **Backend** | O programa que roda num servidor, longe do usuário, com as regras e os dados. | A parte que chama a IA e filtra os advogados. |
| **API** | O "cardápio" de pedidos que o frontend pode fazer ao backend. | "Classifique este caso", "liste meus pedidos". |
| **Rota (endpoint)** | Um endereço da API, cada um faz uma coisa. | `POST /triagem/area` identifica a área do caso. |
| **Requisição** | Um pedido do frontend para o backend. | Clicar em "Continuar" na triagem manda uma requisição. |
| **GET, POST, PUT, PATCH, DELETE** | Os tipos de pedido: buscar, criar, substituir, alterar um pedaço, apagar. | `GET /solicitacoes/minhas` busca; `DELETE /users/me` apaga a conta. |
| **Banco de dados** | Onde as informações ficam guardadas de forma permanente. | O Firestore guarda usuários, triagens e pedidos. |
| **Coleção e documento** | No Firestore, uma coleção é uma gaveta e cada documento é uma ficha dentro dela. | A coleção `triagens` tem um documento por triagem. |
| **Autenticação** | Provar quem você é (login). | Entrar com e-mail e senha, ou com Google. |
| **Token** | Um "crachá" digital que o login gera e que vai junto em cada pedido. | O backend confere o token antes de mostrar os pedidos. |
| **Papel (role)** | O tipo de usuário, que define o que ele pode fazer. | Só quem tem papel "admin" aprova OAB. |
| **Middleware** | Um "porteiro" que roda antes da rota e pode barrar o pedido. | `verificarToken` barra quem não está logado. |
| **Componente** | Um pedaço de tela reaproveitável (como uma peça de Lego). | O cartão do advogado (`AdvogadoCard`). |
| **Biblioteca / dependência** | Código pronto feito por outras pessoas que o projeto usa. | React, Express, Zod. |
| **Framework** | Uma biblioteca grande que dá a estrutura do projeto. | React no frontend, Express no backend. |
| **Deploy (publicar)** | Colocar uma versão nova no ar. | Enviar o site novo para o Firebase Hosting. |
| **Hospedagem** | O serviço que deixa o site ou o servidor ligados na internet. | Firebase Hosting (site) e Render (backend). |
| **Variável de ambiente** | Uma configuração secreta guardada fora do código. | A chave da IA Gemini. |
| **PWA** | Um site que pode ser instalado como aplicativo no celular. | "Instalar a Nocturis" nas Configurações. |
| **Service worker** | Um pequeno programa do site que roda no celular mesmo com o site fechado. | Mostra os avisos no celular. |
| **Teste automatizado** | Um código que verifica se outro código funciona, sozinho. | 187 testes do backend. |
| **CI (integração contínua)** | Um robô que roda os testes a cada mudança no código. | GitHub Actions. |
| **Git e GitHub** | Git guarda o histórico de mudanças do código; GitHub é onde esse histórico fica online. | Cada melhoria vira um "commit". |
| **IA / LLM** | Um modelo de linguagem que entende texto. | Gemini e Groq leem o caso e dizem a área. |
| **Fallback** | Um plano B automático quando algo falha. | Se as duas IAs falharem, entram regras de palavras-chave. |

---

## PARTE 3. A arquitetura (as quatro peças)

```
 [Navegador ou celular do usuário]
        |   (vê e toca nas telas)
        v
 FRONTEND  (React + Vite)  ---- hospedado no Firebase Hosting (nocturis.com.br)
        |   (pede coisas pela API, levando o token do login)
        v
 BACKEND   (Node.js + Express)  ---- hospedado no Render
        |          |            |              |             |
        v          v            v              v             v
   Firestore   Firebase Auth  Gemini / Groq  Cloudinary    Resend
  (banco de    (login e      (IA da         (fotos)       (e-mails)
   dados)       papéis)       triagem)
        |
        +-- Firebase Cloud Messaging (avisos no celular)
```

**A regra de ouro:** o frontend nunca escreve no banco sozinho. Ele sempre pede ao backend, e o backend decide se
pode. A única leitura direta do frontend no banco é a das notificações do sininho (em tempo real), e mesmo assim
as regras do banco só deixam cada pessoa ler as próprias notificações.

**Analogia do restaurante:**
- Salão e cardápio = frontend.
- Garçom = o arquivo `api.js`, que leva os pedidos até a cozinha.
- Porteiro que confere o crachá = Firebase Auth + o middleware `verificarToken`.
- Cozinha = backend (Express).
- Cozinheiro especialista = os "services" (triagem, filtro de advogados, notificações).
- Despensa = Firestore.
- Fornecedores = Gemini, Groq, Cloudinary, Resend.

---

## PARTE 4. Linguagens e ferramentas

**Linguagem principal: JavaScript**, usada nos dois lados (frontend e backend). Isso permite que um time pequeno
mexa em tudo com uma linguagem só.

| Tipo de arquivo | O que é | Quantidade aproximada |
| --- | --- | --- |
| `.js` | JavaScript puro (regras, servidor, utilitários, testes) | 67 |
| `.jsx` | JavaScript com marcação parecida com HTML, usada pelo React para desenhar telas | 62 |
| `.css` | Estilo visual: cores, tamanhos, espaçamentos, animações | 30 |
| `.json` | Configurações e dados (lista de dependências, advogados de exemplo) | 8 |
| `.html` | A página base do site (`index.html`) | 1 |
| `.md` | Documentação em texto | 14 |

**Frontend:**

| Ferramenta | Para que serve |
| --- | --- |
| React 19 | Monta as telas a partir de componentes. |
| Vite 8 | Junta os arquivos e gera o site final otimizado; também roda o site no computador durante o desenvolvimento. |
| React Router 7 | Troca de tela pelo endereço sem recarregar a página. |
| vite-plugin-pwa | Transforma o site em aplicativo instalável, com service worker. |
| Firebase (SDK web) | Login e leitura das notificações em tempo real. |
| html-to-image, jsPDF, qrcode | Geram a imagem e o PDF do cartão de visita, com QR code para o perfil. |
| Sentry | Registra erros que acontecem no navegador dos usuários. |
| oxlint | Revisor automático que aponta erros de código. |

**Backend:**

| Ferramenta | Para que serve |
| --- | --- |
| Node.js 22 | Roda JavaScript no servidor. |
| Express 4 | Organiza o servidor em rotas e middlewares. |
| firebase-admin | Acesso total e seguro ao banco e ao login a partir do servidor. |
| Zod | Valida os dados que chegam (formato, tamanho, campos obrigatórios). |
| @google/genai | Conversa com a IA Gemini. |
| groq-sdk | Conversa com a IA da Groq (segunda opinião). |
| Cloudinary | Guarda e entrega as fotos de perfil. |
| Multer | Recebe o arquivo de foto enviado pelo formulário. |
| Resend | Envia e-mails. |
| Helmet | Liga cabeçalhos de segurança nas respostas. |
| CORS | Só deixa o nosso site chamar a API. |
| express-rate-limit | Limita quantos pedidos cada pessoa faz por período (contra abuso). |
| express-async-errors | Garante que um erro numa rota não derrube o servidor inteiro. |
| Sentry | Registra erros do servidor. |
| Vitest + Supertest | Rodam os testes automatizados da API. |

---

## PARTE 5. As pastas do repositório

```
Noctirus/
├── frontend/          as telas (React)
│   ├── index.html     a página base
│   ├── vite.config.js configuração do Vite e do PWA
│   ├── public/        arquivos públicos (ícones, robots.txt, sitemap.xml, push-sw.js)
│   └── src/           o código das telas
├── backend/           a API (Node + Express)
│   ├── src/           o código do servidor
│   └── scripts/       script que mede a taxa de acerto da triagem
├── database/          regras de segurança do banco, índices, modelo de dados e dados de exemplo
├── docs/              documentação (roteiros, design, sprints, testes, defesa)
├── video/             os vídeos promocionais feitos em Remotion
├── .github/workflows/ automações: testes a cada mudança e "manter o servidor acordado"
├── firebase.json      configuração da hospedagem do site e das regras do banco
└── package.json       atalho para rodar frontend e backend juntos no computador
```

---

## PARTE 6. O frontend por dentro

### 6.1 Como o site liga

1. `index.html`: a página única. Contém só um espaço vazio onde o React desenha tudo, mais as informações para
   o Google (título, descrição, dados estruturados) e os ícones.
2. `src/main.jsx`: liga o React, carrega os estilos base, aplica as preferências de acessibilidade salvas no
   aparelho antes da primeira tela aparecer, liga o Sentry e já "cutuca" o backend para ele ir acordando
   (o Render grátis dorme quando fica sem uso).
3. `src/App.jsx`: envolve tudo com o `AuthContext`, que sabe quem está logado e qual o papel dele.
4. `src/routes/AppRouter.jsx`: o mapa de telas. Olha o endereço e mostra a tela certa, sempre com o cabeçalho
   (`Header`) e, no celular, a barra de baixo (`BottomNav`). Cada tela é carregada sob demanda (lazy loading):
   só é baixada quando a pessoa abre.

### 6.2 Conceitos de React usados

- **Componente:** função que desenha um pedaço de tela.
- **Props:** os dados que o componente recebe (o mesmo cartão desenha "Thiago" ou "Fernanda").
- **Estado (`useState`):** o que a tela lembra enquanto está aberta (o texto digitado, o passo da triagem).
- **Efeito (`useEffect`):** algo que roda quando a tela abre ou quando um dado muda (buscar dados, ligar um
  temporizador).
- **Hook:** função que começa com `use` e dá um "poder" à tela (`useCarregar`, `useTitulo`, `useAuth`).
- **Contexto:** informação compartilhada por todas as telas sem precisar passar de mão em mão (quem está logado).

### 6.3 O mapa de telas (todas as rotas do frontend)

| Endereço | Tela | Quem pode abrir |
| --- | --- | --- |
| `/` | Home (página inicial pública) | Todos |
| `/login` | Entrar | Todos |
| `/cadastro` | Criar conta (cliente ou advogado) | Todos |
| `/recuperar-senha` | Esqueci a senha | Todos |
| `/privacidade` | Política de privacidade | Todos |
| `/termos` | Termos de uso | Todos |
| `/advogados/:uid` | Perfil público de um advogado | Todos |
| `/advogados/:uid/contato` | Pedir contato a um advogado | Cliente |
| `/painel` | Painel do cliente | Cliente |
| `/triagem` | Fazer uma triagem (4 passos) | Cliente |
| `/triagem/:id` | Resultado de uma triagem | Cliente |
| `/minhas-triagens` | Histórico de triagens | Cliente |
| `/minhas-solicitacoes` | Meus pedidos de contato | Cliente |
| `/perfil` | Perfil (painel do advogado, ou dados do cliente e do admin) | Logado |
| `/perfil/editar` | Editar perfil e currículo | Advogado |
| `/cartao` | Cartão de visita | Advogado |
| `/casos` | Quadro de casos (Kanban) | Advogado |
| `/configuracoes` | Configurações: acessibilidade, avisos, app, dados, sair | Logado |
| `/admin/advogados` | Validação de OAB | Admin |
| `*` | Página não encontrada (404) | Todos |

Redirecionamentos antigos: `/advogados` volta para a Home, `/solicitacoes` vai para `/casos`, `/meus-dados` vai
para as Configurações. A **tela inicial de cada papel** (`rotaInicial.js`): cliente vai para `/painel`, advogado
para `/perfil`, admin para `/admin/advogados`.

**`RotaProtegida`:** antes de mostrar uma tela restrita, confere se há login e se o papel é o certo. Sem login,
manda para `/login`. Com o papel errado, manda para a tela inicial do papel. Conta do Google que ainda não
completou o cadastro vai para `/cadastro`. Importante: isso é conforto de navegação. A segurança de verdade está
no backend, que confere o token em todo pedido.

**Navegação:**
- **Celular:** barra de baixo com Início, Triagem (cliente) ou Casos (advogado), e Perfil.
- **Computador:** os mesmos itens no cabeçalho.
- **Cabeçalho, nos dois:** o sininho de notificações, a foto do usuário (leva ao perfil) e a engrenagem das
  Configurações, que é onde fica o "Sair".

### 6.4 `src/features/`: as telas por assunto

- **`auth/`**
  - `AuthContext.jsx`: guarda quem está logado, o papel (que vem dentro do token) e as funções de entrar e sair. Ao trocar de conta, apaga a memória das telas para um usuário não ver dados do anterior.
  - `LoginPage.jsx`, `CadastroPage.jsx`, `RecuperarSenhaPage.jsx`: as telas de entrada. O cadastro tem passos, pede o papel (cliente ou advogado); para advogado pede OAB (número e estado), áreas, especialidades, cidade, WhatsApp e bio; e exige marcar "Li e aceito os termos de uso e a política de privacidade" (consentimento da LGPD).
  - `EntradaLayout.jsx` e `entrada.css`: o visual comum das telas de entrada.
  - `RotaProtegida.jsx` e `rotaInicial.js`: explicados acima.
- **`triagem/`**
  - `TriagemPage.jsx`: a triagem em 4 telas com barra de progresso:
    1. "O que aconteceu?" (texto livre, com mínimo de caracteres);
    2. "Quando?";
    3. a área que a IA identificou, que o cliente confirma ou troca;
    4. os assuntos em "chips" já marcados pela IA, mais um detalhe opcional.
    Depois mostra uma tela de espera "Montando seu resultado".
  - `ResultadoPage.jsx`: o resultado. Mostra um cartão de destaque com a área e o assunto, quantos advogados atendem no estado, um ajuste fino opcional dos assuntos e a lista dos advogados mais compatíveis (os da mesma cidade primeiro), com o motivo de cada um aparecer ("Atua no assunto do seu caso", "Atende na sua cidade"). Tem um pequeno atraso proposital de "revelação" para dar sensação de análise, que respeita quem pediu menos animação.
  - `MinhasTriagensPage.jsx`: histórico das triagens do cliente.
- **`painel/PainelPage.jsx`**: o início do cliente. Mostra:
  - a saudação e o cartão de destaque (a última triagem ou um convite para fazer a primeira);
  - uma "prateleira" de advogados;
  - os pedidos de contato recentes e as triagens;
  - o cartão para ativar avisos no celular;
  - o destaque de "contato liberado" quando um advogado aceita.
- **`advogados/`**: `AdvogadoPublicoPage.jsx` é o perfil público (foto, nome, OAB verificada, cidade, sobre,
  especialidades, currículo). `ContatoAdvogadoPage.jsx` é o pedido de contato: o cliente escolhe qual triagem
  vai junto, vê exatamente o que será enviado e precisa autorizar.
- **`solicitacoes/MinhasSolicitacoesPage.jsx`**: os pedidos do cliente, com a situação (pendente, aceito,
  recusado) e, nos aceitos, os botões de WhatsApp e e-mail.
- **`casos/QuadroCasosPage.jsx`**: o quadro de casos do advogado, no estilo Kanban, com três colunas (novos
  pedidos, em andamento, concluídos). Clicar num caso abre um painel lateral com a triagem do cliente, a
  prioridade (baixa, média, alta), anotações privadas, mover de coluna e arquivar. Novos pedidos têm os botões
  aceitar e recusar.
- **`perfil/`**:
  - `PerfilPage.jsx`: para o advogado é um painel com saudação, aviso da situação da OAB, números (pedidos novos, casos em andamento), a barra de completude do perfil e os atalhos com prévia; para cliente e admin mostra os dados básicos editáveis e os atalhos.
  - `EditarPerfilPage.jsx`: o advogado edita foto, bio, áreas, especialidades, cidade, contatos e o currículo.
- **`curriculo/CurriculoForm.jsx`**: o formulário do currículo (formação, especializações, cursos, experiências).
- **`cartao/`**: o cartão de visita do advogado.
  - `templates.jsx`: os 5 modelos (Com foto, Clássico, Elegante, Duas cores, Claro), cada um com frente e verso, com nome, OAB, áreas, contatos e um QR code que leva ao perfil público.
  - `CartaoPage.jsx`: escolhe o modelo e baixa PNG em alta resolução.
  - `pdfCartao.js`: gera o PDF para imprimir (uma folha com frente e verso, ou uma folha com 3 cartões para recortar).
- **`admin/AdminAdvogadosPage.jsx`**: a validação de OAB. Abas Pendentes, Aprovados, Recusados e Revogados, com
  busca por nome ou número. Cada cartão tem:
  - "Verificar no CNA": copia o número e abre o site oficial da OAB;
  - aprovar, recusar ou revogar, sendo que recusar e revogar exigem um motivo;
  - o histórico das decisões.
- **`conta/ConfiguracoesPage.jsx`**: as Configurações:
  - acessibilidade: tamanho do texto normal, grande ou maior; reduzir animações; texto em negrito; contraste reforçado; ouvir os textos em voz alta; voltar ao padrão;
  - avisos no celular: ligar ou desligar;
  - App: instalar;
  - privacidade e dados: baixar meus dados e excluir a conta;
  - ajuda: perguntas frequentes, termos e privacidade;
  - sair da conta.

Páginas públicas em `src/routes/`: `HomePage.jsx` (a página inicial com o hero, como funciona, áreas, alguns
advogados, perguntas frequentes e rodapé), `PrivacidadePage.jsx`, `TermosPage.jsx`, `NaoEncontradaPage.jsx`.

### 6.5 `src/components/`: as peças reaproveitáveis

- **Estrutura:**
  - `Header`: cabeçalho;
  - `BottomNav`: barra do celular;
  - `NotificationBell`: sininho com o painel de notificações, marcar como lida e tempo relativo;
  - `Esqueleto`: blocos de carregamento;
  - `Loading`;
  - `AvisoServidor`: a coruja animada quando o servidor está acordando;
  - `AtualizacaoDisponivel`: o aviso "Nova versão do app disponível", que deixa a pessoa escolher a hora de atualizar para não perder o que estava digitando.
- **Cartões:**
  - `AdvogadoCard`: cartão do advogado, na versão normal e na de destaque;
  - `CartaoTriagem`: a triagem como cartão;
  - `AceiteDestaque`: a tela de "contato liberado", que aparece uma vez por aceite, e o cartão no painel;
  - `RespostasTriagem`: mostra pergunta e resposta da triagem;
  - `PerfilCompletude`: a barra "seu perfil está X% completo".
- **Formulários:**
  - `Input` e `Button`;
  - `ChoiceCard`: opções grandes clicáveis;
  - `CampoLocalizacao`: estado e cidade;
  - `BotaoGoogle`: entrar com Google.
- **Marca:**
  - `Logo`: coruja mais o nome;
  - `OwlMark`: a coruja sozinha;
  - `CorujaAnimada`: a coruja respirando e piscando;
  - `LinhasFundo`: as linhas curvas do fundo;
  - `Avatar`: foto ou inicial em tons de marrom;
  - `SeloOab`: o selo "OAB verificada";
  - `AreaIcon`: o ícone de cada área.
- **Recursos:**
  - `AvisosCelular` e `PassosIphone`: o cartão de ativar avisos, com o passo a passo do iPhone;
  - `BotaoOuvir`: lê o texto em voz alta com a voz do próprio navegador.

### 6.6 `src/lib/`: as ferramentas sem tela

- **`api.js`:** o "garçom".
  - Toda conversa com o backend passa por aqui, sempre levando o token do login.
  - Se o servidor estiver dormindo (erros 502, 503 ou 504, ou falha de rede), tenta de novo em 2, 4 e 8 segundos, só nas buscas. Não repete gravações, para não duplicar uma ação.
  - Se um pedido passa de 3 segundos, avisa a tela para mostrar o aviso de servidor acordando.
- **`firebase.js`:** liga o Firebase. O banco (Firestore) só é carregado quando precisa, para o site abrir mais
  rápido.
- **`useCarregar.js`:** padrão de "buscar dados quando a tela abre", com estado de carregando, erro, recarregar e
  uma memória que evita buscar de novo a cada troca de tela. A memória é apagada ao sair ou trocar de conta.
- **`useNotificacoes.js`:** escuta a coleção de notificações em tempo real (onSnapshot), sem precisar
  recarregar.
- **`avisosCelular.js`:** pede permissão, registra o aparelho no Firebase Cloud Messaging e manda o token para o
  backend. Também desliga os avisos.
- **`preferencias.js`:** as preferências de acessibilidade, salvas no próprio aparelho, aplicadas como atributos
  na página para o CSS agir no site inteiro.
- **`usePwaInstall.js`:** guarda o evento do navegador que permite instalar o app.
- **`areas.js`, `situacaoOab.js`, `solicitacoes.js`, `localizacao.js`, `avatarColor.js`, `telasVitrine.js`:**
  textos e regras pequenas (nomes das áreas, rótulos da situação da OAB, link do WhatsApp com o código do Brasil,
  cores do avatar, telas sem cabeçalho).
- **`useTitulo.js`, `useOnClickOutside.js`:** título da aba do navegador; fechar um menu ao clicar fora.

### 6.7 Estilo visual

- `src/styles/tokens.css`: as cores e fontes da marca em variáveis. Marrom `#765039`, marrom escuro, bege e
  creme. Fontes IBM Plex Sans (texto) e Libre Baskerville (títulos com serifa).
- `src/index.css`: estilos globais e ajustes finais.
- Cada componente e tela tem seu próprio `.css` ao lado.
- Decisões de design: um tema só, claro e quente (a banca rejeitou o visual escuro), só marrom, bege e creme, sem
  azul, vermelho, verde ou amarelo, sem as "pílulas" arredondadas com cara de inteligência artificial, e
  tipografia grande.

### 6.8 PWA e desempenho

- Instalável no celular e no computador. No iPhone, o site ensina o passo a passo do Safari.
- O service worker guarda os arquivos no aparelho (abre rápido) e mostra os avisos no celular
  (`public/push-sw.js`).
- Cada tela é baixada só quando aberta (lazy loading). Quem abre a Home não baixa o quadro de casos.
- SEO: título, descrição, dados estruturados do Google, `sitemap.xml` e `robots.txt`.

---

## PARTE 7. O backend por dentro

### 7.1 Como o servidor liga

1. `backend/src/instrument.js`: liga o Sentry antes de tudo (precisa vir primeiro para capturar erros de
   qualquer rota).
2. `backend/src/index.js`: inicia o servidor na porta configurada.
3. `backend/src/app.js`: monta o Express, nesta ordem:
   1. `trust proxy`: o Render fica atrás de um proxy, e isso faz o limite de pedidos contar por visitante, não pelo proxy;
   2. **CORS**: só as origens permitidas (o nosso domínio) podem chamar a API pelo navegador;
   3. **Helmet**: cabeçalhos de segurança;
   4. `express.json()`: entende o corpo dos pedidos em JSON;
   5. a rota `/health`, antes do limite de pedidos, porque é chamada com frequência para manter o servidor acordado;
   6. **limite geral**: 300 pedidos a cada 15 minutos por pessoa;
   7. as rotas: auth, users, advogados, currículos, triagem, solicitações, tarefas;
   8. o tratamento de erro do Sentry e uma resposta genérica "Erro interno", que não expõe detalhes.

### 7.2 Middlewares (os porteiros)

- **`auth.js`:**
  - `verificarToken` lê o cabeçalho `Authorization: Bearer <token>`, confere o token no Firebase e coloca na requisição o uid, o e-mail e o papel. Sem token responde 401.
  - `tentarVerificarToken` faz o mesmo sem barrar (rotas públicas que mudam se houver alguém logado).
  - `requireRole(...)` barra com 403 quem não tem o papel exigido.
- **`rateLimit.js`:**
  - geral: 300 pedidos a cada 15 minutos;
  - triagem: 30 a cada 15 minutos, porque a IA tem cota;
  - recuperar senha: 5 a cada 15 minutos, para ninguém usar a rota para encher a caixa de alguém de e-mails.
- **`validar.js`:** recebe um esquema do Zod e recusa com 400 qualquer corpo fora do formato (campo faltando,
  tamanho errado, tipo errado).

### 7.3 Todas as rotas da API

**Saúde:**
- `GET /health`: responde que o servidor está vivo. Usado pelo agendamento que impede o Render de dormir.

**Autenticação (`routes/auth.js`):**
- `POST /auth/completar-cadastro`: depois que a pessoa cria o login no Firebase, esta rota conclui o
  cadastro. Exige o consentimento da LGPD marcado. Para advogado, valida o formato da OAB e se ela já não está
  cadastrada. Grava o papel como "custom claim" dentro do token (é assim que o papel não pode ser falsificado),
  cria o documento em `users`, e para advogado cria também `advogados` (com a OAB em análise) e um currículo
  vazio.
- `POST /auth/recuperar-senha`: manda o e-mail de redefinição de senha, com limite baixo de pedidos.

**Usuário (`routes/users.js`):**
- `GET /users/me`: os dados da própria conta.
- `PUT /users/me`: edita nome, telefone e cidade.
- `POST /users/me/foto`: envia a foto do cliente (só formatos de imagem comuns, nunca SVG, que pode esconder
  código malicioso).
- `POST /users/me/avisos-celular`: registra o aparelho para receber avisos (guarda os 5 mais recentes).
- `GET /users/me/dados`: baixa tudo que a Nocturis tem sobre a pessoa (direito de acesso da LGPD).
- `DELETE /users/me`: apaga a conta (direito de eliminação da LGPD): login, cadastro, triagens e, se for
  advogado, perfil e currículo. Os pedidos de contato ficam, porque também são registro do advogado.

**Advogados (`routes/advogados.js`):**
- `GET /advogados`: lista pública com filtro por área e localização (só aprovados).
- `GET /advogados/:uid`: perfil público. Só existe para advogado aprovado; o próprio advogado e o admin veem em
  qualquer situação. O WhatsApp e o e-mail nunca saem aqui.
- `PUT /advogados/:uid`: o próprio advogado edita áreas, especialidades, cidade, contatos e bio. Não pode mexer
  na OAB nem na situação dela.
- `POST /advogados/:uid/foto`: foto de perfil (vai para o Cloudinary).
- `GET /admin/advogados`: o admin lista todos, em qualquer situação.
- `PATCH /advogados/:uid/situacao-oab`: só o admin aprova, recusa ou revoga. Recusar e revogar exigem motivo.
  Cada decisão entra no histórico e o advogado é avisado pelo sininho, pelo celular e por e-mail.

**Currículos (`routes/curriculos.js`):**
- `GET /curriculos/:uid`: o currículo público.
- `PUT /curriculos/:uid`: o próprio advogado edita.

**Triagem (`routes/triagem.js`):**
- `GET /triagem/perguntas`: os textos das perguntas e o catálogo de assuntos (o frontend lê daqui, então o texto
  das perguntas mora só no backend).
- `POST /triagem/area`: etapa 1. Recebe o "o que aconteceu" e o "quando" e devolve a área sugerida e os assuntos
  prováveis.
- `POST /triagem/classificar`: etapa 2. Recebe a área confirmada, os assuntos marcados e o detalhe opcional,
  classifica de novo dentro da área, salva a triagem e devolve os advogados compatíveis.
- `GET /triagem/historico`: as triagens do cliente.
- `GET /triagem/:id`: uma triagem do próprio cliente, com os advogados compatíveis recalculados com a cidade
  atual dele.

**Pedidos de contato (`routes/solicitacoes.js`):**
- `POST /solicitacoes`: o cliente pede contato. Regras: a triagem tem que ser dele, o advogado tem que estar
  aprovado, o cliente precisa autorizar o envio das respostas, e não pode haver outro pedido pendente ou aceito
  para o mesmo advogado. O advogado é avisado.
- `GET /solicitacoes/minhas`: os pedidos do cliente. O contato do advogado só aparece nos aceitos.
- `GET /solicitacoes/recebidas`: os pedidos do advogado, com o caso autorizado. O nome do cliente só aparece
  depois do aceite.
- `PATCH /solicitacoes/:id`: o advogado aceita ou recusa um pedido pendente. O cliente é avisado nos dois casos.
- `PATCH /solicitacoes/:id/caso`: o advogado organiza um caso aceito no quadro: muda a etapa (em andamento,
  concluído), a prioridade, as anotações privadas ou arquiva.

**Tarefas (`routes/tarefas.js`):**
- `POST /tarefas/lembretes`: chamada pelo agendamento do GitHub. Manda no máximo um lembrete por triagem e um por
  pedido, só entre 9h e 20h. Pode exigir uma chave secreta no cabeçalho.

### 7.4 Os serviços (os cozinheiros especialistas)

**`services/triagem.js`: a inteligência da triagem.**
- Guarda as perguntas da etapa 1 (o que aconteceu, quando), a pergunta opcional da etapa 2 e o catálogo de
  assuntos (`CATEGORIAS_POR_AREA`: 26 cíveis e 23 trabalhistas).
- `montarDescricao`: junta perguntas e respostas num texto só, que é o que vai para a IA e o que o advogado lê.
- **Três camadas de classificação, para a triagem nunca travar:**
  1. **Gemini** (modelo configurável, padrão `gemini-3.5-flash-lite`), com limite de 5 segundos. Se responder
     com confiança abaixo de 0,5, não serve.
  2. **Groq** (modelo padrão `openai/gpt-oss-120b`), segunda opinião, com limite de 4 segundos.
  3. **Regras por palavras-chave** (`classificarPorRegras`): conta palavras de cada assunto no texto e escolhe a
     área e os assuntos com mais ocorrências. Sempre funciona, mesmo sem internet para a IA.
- O resultado guarda a `origem` ("ia" ou "regras"), a área, os assuntos, o tipo de advogado sugerido e uma
  justificativa.
- O prompt pede resposta em formato estruturado (JSON) e o código confere se a área e os assuntos que vieram
  existem no catálogo, descartando qualquer coisa inventada pela IA.

**`services/matching.js`: o filtro dos advogados.**
- Busca os advogados e mantém só os de **OAB aprovada**.
- Filtra pela **área**, pelo **estado** do cliente.
- Ordena com dois critérios objetivos e iguais para todos: primeiro os da **mesma cidade** (comparada sem
  diferenciar acento e maiúscula), depois quem atua em **mais assuntos do caso**. Os assuntos reordenam, não
  excluem, para sempre sobrar alguém para contatar.
- `perfilPublico`: remove do que sai para o público os contatos, o histórico da OAB e quem decidiu.

**`services/oab.js`:** as situações da OAB e as transições permitidas. Todo advogado nasce "em análise". O admin
pode aprovar; recusar só quem está em análise; revogar só quem está aprovado; quem foi recusado ou revogado pode
ser aprovado de novo. Também valida o formato do número e do estado.

**`services/avisosOab.js`:** os textos que o advogado recebe a cada decisão do admin, em linguagem simples, no
sininho e por e-mail. Se o aviso falhar, a decisão não é desfeita.

**`services/notificacoes.js`:** cria as notificações do sininho no Firestore e manda o mesmo aviso para o
celular. Nunca derruba a ação principal se falhar.

**`services/push.js`:** envia o aviso pelo Firebase Cloud Messaging para cada aparelho registrado e remove os
aparelhos que não existem mais.

**`services/lembretes.js`:** os lembretes. Para o cliente que viu advogados e não pediu contato, e para o
advogado com pedidos esperando resposta. Só dados objetivos (quantos advogados atendem, quantos pedidos esperam),
nunca "melhores", porque aviso empurrando advogado viraria captação de clientela.

### 7.5 `backend/src/lib/`

- `firebase-admin.js`: liga o Firebase com permissão de administrador (só o servidor tem essa chave).
- `email.js` e `emailTemplates.js`: enviam e-mails pelo Resend, a partir de `mail.nocturis.com.br`, com modelos
  prontos. Sem a chave configurada, o servidor não quebra, só não manda e-mail.
- `cloudinary.js`: envia as fotos.
- `localizacao.js`: as 27 siglas de estado válidas.

### 7.6 Script de avaliação

`backend/scripts/avaliar-triagem.js` roda casos de teste reais contra a triagem e mede a taxa de acerto. Ele já
revelou um problema real: a IA estava estourando a cota gratuita (10 pedidos por minuto) e o erro era engolido em
silêncio. Depois disso, o erro passou a ser registrado.

---

## PARTE 8. O banco de dados (Firestore)

O Firestore é um banco "de documentos": coleções (gavetas) com documentos (fichas). As datas são guardadas como
texto no padrão ISO. Quando o documento representa "uma coisa por usuário", o identificador é o próprio uid do
login.

| Coleção | O que guarda | Campos principais |
| --- | --- | --- |
| `users` | Todas as contas | papel, nome, e-mail, telefone, cidade (cliente), foto, aparelhos para aviso, data |
| `advogados` | O perfil profissional | OAB (número e estado, não editável), áreas, especialidades, cidade, contatos (privados), bio (até 240 caracteres), foto, situação da OAB, motivo, quem decidiu e quando, histórico |
| `curriculos` | O currículo | formação, especializações, cursos, experiências |
| `triagens` | Cada triagem | cliente, respostas das duas etapas, descrição, região, área, assuntos, especialidade, origem (ia ou regras), justificativa, advogados sugeridos, data |
| `solicitacoes` | Os pedidos de contato | cliente, advogado, triagem, quando autorizou, cópia do caso, situação (pendente, aceita, recusada), etapa no quadro, prioridade, anotações (só do advogado), arquivado, datas |
| `notificacoes` | O sininho | destinatário, tipo, texto, link, lida, data |

**Quem vê o quê:**
- O advogado vê o caso desde o pedido, mas o **nome do cliente só depois de aceitar**.
- O cliente vê o **WhatsApp e o e-mail do advogado só depois do aceite**.
- As anotações do advogado nunca vão para o cliente.

**Regras de segurança do banco (`database/firestore.rules`):** a segunda camada de proteção.
- **Tudo começa negado.**
- `users`: só o dono e o admin leem. Ninguém troca o próprio papel.
- `advogados`: leitura pública. O dono não pode mexer na OAB nem na situação dela (sem essa trava, um advogado
  poderia se autoaprovar escrevendo direto no banco).
- `triagens` e `solicitacoes`: só leitura pelos envolvidos; escrita só pelo backend.
- `notificacoes`: o dono lê e só pode mudar o campo "lida".

O backend usa a permissão de administrador e por isso não depende dessas regras. Elas existem porque as chaves do
Firebase no navegador são públicas por natureza, então "só o backend faz isso" não protege nada sem a regra.

`database/seed/`: scripts de dados de exemplo:
- `seed.js` e `lawyers.json`: advogados fictícios;
- `criar-admin.js`;
- `demo-casos.js`: os casos de demonstração do quadro e do painel;
- `atualizar-bio-foto.js`;
- `migrar-situacao-oab.js`: a migração do antigo "verificado sim ou não" para as quatro situações.

---

## PARTE 9. Segurança e privacidade (LGPD)

**Segurança, em camadas:**
1. Login pelo Firebase Auth (e-mail e senha, ou Google).
2. Token conferido no backend em toda rota privada.
3. Papel guardado dentro do token (custom claim), que o usuário não consegue alterar.
4. Verificação de papel por rota (`requireRole`) e de dono (só o dono mexe no que é dele).
5. Validação de todos os dados de entrada com Zod.
6. Limite de pedidos (rate limit) contra abuso e contra gasto da cota da IA.
7. CORS: só o nosso site chama a API pelo navegador.
8. Helmet: cabeçalhos de segurança.
9. Regras do Firestore como segunda camada.
10. Upload de foto só em formatos de imagem comuns, nunca SVG.
11. Erros genéricos para o público, detalhes só no Sentry, sem dados pessoais.

**LGPD:**
- Consentimento explícito no cadastro (art. 8º), com link para termos e política.
- O cliente escolhe a triagem e autoriza o envio antes de cada pedido de contato.
- Minimização: o advogado só vê o nome depois de aceitar; o cliente só vê o contato depois do aceite.
- Direito de acesso e portabilidade: baixar os dados em Configurações.
- Direito de eliminação: excluir a conta em Configurações.
- Transparência: a política de privacidade lista os serviços de terceiros e avisa que a IA roda em camada
  gratuita, recomendando não digitar dados identificáveis como CPF e endereço.

---

## PARTE 10. Os fluxos completos, passo a passo

**Cadastro de cliente:**
1. Cria o login (e-mail e senha ou Google) no Firebase.
2. Preenche nome, telefone, cidade e estado, e aceita os termos.
3. O frontend chama `POST /auth/completar-cadastro`.
4. O backend grava o papel no token e cria o documento em `users`.
5. A pessoa vai para o painel.

**Cadastro de advogado e validação da OAB:**
1. Mesmo começo, escolhendo "advogado" e informando OAB, áreas, especialidades, cidade, WhatsApp e bio.
2. O backend confere o formato da OAB e se ela não está repetida, e cria o perfil com a situação "em análise".
3. Enquanto está em análise, o perfil não aparece para nenhum cliente, e o painel do advogado explica isso.
4. O admin abre a validação de OAB, clica em "Verificar no CNA" (o número é copiado e o site oficial abre) e
   confere.
5. O admin aprova, ou recusa com motivo. O advogado recebe o aviso no sininho, no celular e por e-mail.
6. Se foi recusado, o advogado corrige a OAB e volta para "em análise". Se depois a inscrição deixar de valer, o
   admin revoga com motivo.

**Triagem:**
1. O cliente escreve o que aconteceu e quando.
2. `POST /triagem/area` passa pelo Gemini, pelo Groq ou pelas regras e devolve a área sugerida.
3. O cliente confirma ou troca a área.
4. Na tela dos assuntos, os sugeridos já vêm marcados. Ele desmarca ou marca outros e pode acrescentar um
   detalhe.
5. `POST /triagem/classificar` classifica dentro da área, salva a triagem e o `matching.js` monta a lista.
6. O resultado mostra a área, o assunto e os advogados mais compatíveis do estado, os da cidade primeiro.

**Pedido de contato e aceite:**
1. O cliente abre um advogado e toca em pedir contato.
2. Escolhe qual triagem vai junto, vê o que será enviado e autoriza.
3. `POST /solicitacoes` cria o pedido e avisa o advogado.
4. No quadro de casos, o pedido aparece em "novos" com o caso do cliente, sem o nome.
5. O advogado aceita: o caso vai para "em andamento", o cliente é avisado e aparece para ele a tela "contato
   liberado", com WhatsApp e e-mail. O advogado passa a ver o nome do cliente.
6. A conversa segue fora da plataforma. O advogado organiza o caso no quadro: prioridade, anotações privadas,
   concluído e arquivado.

**Notificações:**
- Sininho em tempo real: o backend cria, o frontend escuta.
- Avisos no celular: Firebase Cloud Messaging.
- E-mails: Resend.
- Lembretes: o agendamento do GitHub, a cada 10 minutos, chama a rota de tarefas, que manda no máximo um
  lembrete por triagem e por pedido, entre 9h e 20h.

**Excluir a conta:**
1. Configurações, depois Excluir.
2. Confirma.
3. `DELETE /users/me` apaga o login e os dados.
4. A pessoa sai e volta para a Home.

---

## PARTE 11. Testes e qualidade

- **187 testes automatizados no backend**, com Vitest e Supertest. Eles chamam as rotas de verdade contra um
  Firebase falso em memória (`backend/src/test-utils/fakeFirebase.js`). Assim os testes rodam sem tocar no banco
  real, por exemplo, conferindo que um cliente não vê pedido de outro e que o nome só aparece depois do aceite.
- Há arquivos de teste ao lado de cada rota (`*.integration.test.js`) e de cada serviço (`*.test.js`).
- **CI no GitHub Actions** (`.github/workflows/ci.yml`): a cada envio de código para `main` ou `develop`, um
  robô instala tudo, roda os testes do backend, revisa o frontend com o oxlint e gera o site. Se algo quebrar,
  aparece o aviso antes de ir para o ar.
- **Script de avaliação da triagem**, para medir a taxa de acerto da IA com casos reais.
- **Sentry** no frontend e no backend, para saber de erros que acontecem com usuários.
- **Teste com pessoa de fora do time**, que levou ao redesenho da triagem em outubro de 2026, porque as
  perguntas eram repetitivas.

---

## PARTE 12. Hospedagem, publicação e custos

| Parte | Onde fica | Como publica |
| --- | --- | --- |
| Frontend | Firebase Hosting, no domínio nocturis.com.br | `npm run build` gera a pasta `frontend/dist`, depois `firebase deploy --only hosting`. |
| Backend | Render (plano gratuito) | Publica sozinho a cada envio de código para o ramo `main` do GitHub. |
| Banco, login e avisos | Firebase (projeto nocturis-web) | Regras e índices publicados pelo Firebase. |

- **O site é uma "página única"** (SPA): o `firebase.json` manda qualquer endereço para o `index.html`, e o
  React decide a tela. Os arquivos com nome versionado ficam guardados por um ano no navegador; o `index.html` e
  o service worker nunca ficam guardados, para a versão nova chegar.
- **O Render gratuito dorme** depois de uns 15 minutos sem uso, e a primeira chamada pode levar até um minuto.
  Soluções:
  - o agendamento `manter-acordado.yml` chama o `/health` a cada 10 minutos entre 7h e 23h;
  - o frontend tenta de novo sozinho;
  - o frontend mostra a coruja de "servidor acordando".
- **Variáveis de ambiente** (configurações secretas, nunca no código):
  - no backend: porta, projeto do Firebase, credencial do Firebase, chaves e modelos do Gemini e do Groq, chave e remetente do Resend, dados do Cloudinary, origens permitidas, Sentry e a chave das tarefas;
  - no frontend: o endereço da API, a configuração do Firebase, a chave VAPID dos avisos e o Sentry.
- **Ordem de publicação quando muda o backend:**
  1. enviar o código para o GitHub, e o Render publica;
  2. esperar a API responder;
  3. publicar o frontend no Firebase.
- **Custo:** zero. Tudo usa planos gratuitos (Firebase Spark, Render free, Gemini e Groq na camada gratuita,
  Resend, Cloudinary e Sentry gratuitos). O único custo é o domínio.

---

## PARTE 13. Decisões de projeto e a história

- **O chat saiu.** Antes havia um chat com mensagens prontas (sem texto livre, por causa da ética da OAB). Em
  outubro de 2026 virou o pedido de contato com aceite, mais simples e mais seguro eticamente. A conversa
  acontece fora da plataforma.
- **As denúncias saíram.** A plataforma não tem competência para julgar conduta profissional (isso é papel da
  OAB), e remover um advogado poderia gerar processo.
- **A validação da OAB é manual,** porque não existe API pública gratuita da OAB. O admin confere no CNA.
- **A triagem foi redesenhada** depois do teste com uma pessoa de fora: de muitas perguntas de múltipla escolha
  para duas perguntas abertas, mais a confirmação da área e dos assuntos.
- **Só duas áreas** (cível e trabalhista), com os assuntos de trânsito dentro do cível e os de INSS dentro do
  trabalhista, como muitos escritórios atuam.
- **Visual:** tema claro e quente, só marrom, bege e creme, tipografia grande, sem detalhes coloridos e sem
  pílulas.
- **Linguagem:** "os mais compatíveis", nunca "os melhores". Lembretes só com números objetivos.
- **Configurações** concentram acessibilidade, avisos, app, dados e sair (a engrenagem substituiu o "Sair" do
  cabeçalho).

---

## PARTE 14. Ética da OAB e defesa da ideia

**As regras:**
- O **Estatuto da Advocacia (Lei 8.906/94, art. 34, IV)** proíbe o advogado de "angariar ou captar causas, com
  ou sem a intervenção de terceiros".
- O **Código de Ética e Disciplina** exige publicidade informativa, discreta e sóbria, sem mercantilização.
- O **Provimento 205/2021** permite presença digital e plataformas, desde que informativas.
- Em **20/03/2025, o Tribunal de Ética da OAB-SP** (processo 25.0886.2024.023887-5) considerou vedadas as
  plataformas que fazem "conexões personalizadas, recomendações ou encaminhamentos", e considerou permitido o
  advogado estar num "banco de dados, desprovido de serviço de aproximação", em que a iniciativa do contato parte
  só do usuário.

**Como a Nocturis responde:**
1. Ninguém paga nada; não há comissão.
2. Ninguém compra posição; a ordem é por critério objetivo e igual para todos (área, assunto, cidade), como um
   filtro de busca.
3. A iniciativa é sempre do cliente; o advogado nunca procura cliente.
4. O contato só é liberado depois do aceite do advogado.
5. Só aparece advogado com OAB conferida no CNA.
6. Sem "melhores", sem depoimentos, sem promessa de resultado.
7. A triagem não dá parecer, só aponta a área.
8. O perfil do advogado é só informativo.

**O ponto fraco e a resposta madura:** mostrar "os mais compatíveis" lembra "recomendação". Resposta: "A gente
conhece a decisão de 2025. Se a Nocturis virasse produto, faríamos uma consulta formal ao Tribunal de Ética antes
de lançar e, se precisasse, transformaríamos o resultado num diretório puro, mudando só a ordenação. Hoje é um
projeto acadêmico, gratuito, com dados de demonstração."

**Dados do problema:**
- 40,9% das comarcas estaduais e 59,8% das subseções federais não têm Defensoria Pública; são 37,4 milhões de
  pessoas sem cobertura na Justiça estadual (Pesquisa Nacional da Defensoria Pública, dados de junho de 2024).
- O Brasil tem 1.447.518 advogados (Conselho Federal da OAB, 2025), e 52% têm menos de 10 anos de carreira.
- A OAB registrou mais de 2.100 denúncias de golpe do falso advogado até maio de 2025, e a OAB-SP criou o
  ConfirmADV. A Nocturis só mostra advogado com OAB conferida: ajuda a combater o mesmo problema.

**ODS:** a meta mais forte é a **16.3**: promover o Estado de Direito e garantir a igualdade de acesso à justiça
para todos.

**Modelo de negócio compatível com a ética:** nunca cobrar do advogado por cliente (seria mercantilização).
Caminhos possíveis: cobrar pelas ferramentas do advogado (quadro de casos, cartão de visita, gestão), como
qualquer software jurídico, ou parcerias com faculdades, núcleos de prática jurídica e a própria OAB.

---

## PARTE 15. Design e acessibilidade

- **Identidade:** a coruja (sabedoria e "noturno", de Nocturis), marrom `#765039` com bege e creme, fontes IBM
  Plex Sans e Libre Baskerville.
- **Acessibilidade nas Configurações:**
  - **tamanho do texto:** aumenta a página inteira por zoom;
  - **reduzir animações:** desliga transições e efeitos, e o site também respeita a preferência do sistema;
  - **texto em negrito;**
  - **contraste reforçado:** escurece textos claros e bordas;
  - **ouvir os textos:** voz do próprio navegador, na triagem e no perfil do advogado;
  - **voltar ao padrão.**
- **Outros cuidados:**
  - botões com área de toque de pelo menos 44 pixels;
  - foco visível para quem navega pelo teclado;
  - textos alternativos e rótulos para leitores de tela;
  - funciona no celular e no computador.

---

## PARTE 16. Os vídeos (pasta `video/`)

Feitos com **Remotion**, que escreve vídeo em React. Três composições:

| Composição | Formato e duração | O que mostra |
| --- | --- | --- |
| `Reels` | Vertical, 1080x1920, cerca de 24 segundos | Logo animada, problemas em letras gigantes, triagem, resultado em carrossel e aceite, com música ("Gimme That Groove", da Mixkit) e efeitos sonoros (pacote Sonniss GDC 2024) cortados na batida. |
| `Pitch` | Horizontal, 2 minutos | O animatic do pitch com bonequinhos, mostrando o plano de cada cena como guia de filmagem. |
| `Promo` | Horizontal, 30 segundos | A primeira versão, mais calma. |

A música e os efeitos ficam só no computador, porque as licenças não permitem redistribuir os arquivos.

---

## PARTE 17. Perguntas técnicas prováveis da banca e respostas

- **"Por que React e Node?"** Uma linguagem só nos dois lados, muito material de estudo, bibliotecas maduras e
  hospedagem gratuita.
- **"Por que Firebase?"** Login pronto (inclusive com Google), banco em tempo real, hospedagem e avisos no
  celular no mesmo lugar, com plano gratuito.
- **"Por que um backend se o Firebase já tem banco?"** Porque as regras de negócio e os segredos não podem ficar
  no navegador: a chave da IA, a validação da OAB, quem vê o nome e o contato, os limites de uso.
- **"E se a IA errar?"** O cliente confere e pode trocar a área e os assuntos. Há validação contra o catálogo, e
  se a IA falhar existem a segunda IA e as regras.
- **"E se a IA cair ou a cota acabar?"** As três camadas garantem que a triagem sempre termina.
- **"Como vocês garantem que um usuário não vê dados de outro?"** O token é conferido em toda rota, o papel está
  dentro do token, cada rota confere o dono, e as regras do banco são a segunda camada. Os testes automatizados
  verificam esses casos.
- **"Como vocês testaram?"** 187 testes automatizados, robô de testes a cada mudança, script de taxa de acerto da
  triagem e teste com uma pessoa de fora do time.
- **"Quanto custa manter?"** Praticamente zero, só o domínio.
- **"Escala?"** O filtro de advogados hoje roda em memória, adequado ao tamanho do protótipo. Para crescer, a
  troca seria por consultas com índice no banco, e o Render e o Firebase têm planos pagos que crescem sem mudar
  o código.
- **"E a LGPD?"** Consentimento, autorização por pedido, minimização, baixar e excluir dados, política
  transparente.
- **"Por que a OAB é conferida à mão?"** Não existe API pública gratuita da OAB. O admin confere no CNA e cada
  decisão fica registrada com motivo e histórico.

---

## PARTE 18. Limitações e próximos passos

**Limitações (admitir antes que perguntem):**
- só duas áreas;
- IA em camada gratuita;
- dados de demonstração e poucos advogados reais;
- pouco teste com usuários de fora;
- filtro em memória;
- validação da OAB manual;
- a decisão da OAB-SP sobre plataformas de aproximação.

**Próximos passos:**
- consulta formal ao Tribunal de Ética;
- mais áreas;
- IA em plano pago que não usa os dados para treino;
- testes com mais usuários;
- consultas com índice;
- parcerias com núcleos de prática jurídica e com a OAB.

---

## PARTE 19. Resumo em uma página

A Nocturis é uma plataforma web gratuita que ajuda quem tem um problema jurídico a descobrir de que área ele é e a
chegar a um advogado com OAB conferida, dentro das regras da OAB e da LGPD.
- **Frontend:** React, publicado no Firebase Hosting e instalável como aplicativo.
- **Backend:** Node.js com Express, no Render, com as regras, a segurança e a triagem por IA em três camadas
  (Gemini, Groq e regras).
- **Banco e login:** Firestore e Firebase Auth.
- **Serviços:** fotos no Cloudinary, e-mails pelo Resend, avisos no celular pelo Firebase Cloud Messaging.
- **Qualidade:** 187 testes automatizados e um robô de testes a cada mudança.
- **Ética:** ninguém paga, ninguém compra posição, a iniciativa é do cliente e o contato só é liberado depois que
  o advogado aceita.
