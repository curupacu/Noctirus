# DESIGN.md — Nocturis

> **Visual atual: redesign de outubro/2026.** Depois da banca (início de outubro), que
> rejeitou o visual escuro, o time adotou uma direção nova baseada no protótipo de alta da
> landing page feito no Figma: marrom da marca, creme, caramelo e dourado, títulos em serifa,
> cantos quase retos e fotos de banco de imagem. **Não existe mais modo escuro nem modo
> claro**: o site tem um padrão só. As versões anteriores deste documento (escuro fixo de
> julho, híbrido claro/escuro de agosto) estão no histórico do git.

## 1. Plano do redesign

O redesign é feito direto no código, em etapas pequenas, com aprovação a cada passo:

1. **Home (landing)** — refeita seguindo o protótipo de alta do Figma. Não muda nenhuma
   funcionalidade, só o visual e alguns textos.
2. **Funcionalidades novas** — implementar os requisitos revisados depois da banca
   (triagem em duas etapas, pedido de contato com aceite do advogado, quadro de casos do
   advogado, validação de OAB com recusa/revogação). Essas mudanças mexem nas mesmas telas
   internas, por isso vêm antes do visual delas.
3. **Demais telas** — login, cadastro, painéis e telas internas ganham o visual novo
   depois que a funcionalidade delas estiver no lugar.

| Tela | Situação |
| --- | --- |
| Home (landing) | Refeita seguindo o protótipo de alta (07/10) |
| Login e Cadastro | Depois das funcionalidades |
| Painel do cliente | Depois das funcionalidades |
| Painel do advogado (quadro de casos) | A desenhar junto com a funcionalidade |
| Demais telas internas | Pegaram só a paleta nova, layout antigo |

As telas de celular do Figma (abertura, login, painel do cliente) servem de referência de
layout, **mas não de cor de fundo**: o fundo preto e o amarelo-claro delas foram descartados.

## 2. Paleta (espelha `frontend/src/styles/tokens.css`)

| Token | Valor | Uso |
| --- | --- | --- |
| `--brown` | `#765039` | Cor principal da marca. Hero, seção "Sobre", rodapé, cabeçalho |
| `--brown-deep` | `#5C3E2B` | Hover do marrom |
| `--brown-ink` | `#3B281C` | Texto e botões escuros sobre o caramelo |
| `--gold` | `#D9A41E` | Botão principal, marcadores, barras de destaque |
| `--gold-dim` | `#C08F17` | Hover do dourado |
| `--gold-ink` | `#87600A` | Dourado escurecido pra texto/link sobre fundo claro |
| `--cream` | `#F6EEDF` | Texto sobre o marrom |
| `--bg` | `#FAF6EE` | Fundo das telas internas |
| `--surface` | `#FFFFFF` | Cartões das telas internas |
| `--border` | `#E6DED0` | Linhas e bordas |
| `--text` | `#2A1F16` | Texto principal |
| `--text-dim` | `#5E4E3B` | Texto secundário |

Cores próprias da Home (variáveis locais em `routes/HomePage.css`, prefixo `--home-`):

| Variável | Valor | Onde |
| --- | --- | --- |
| `--home-cream` | `#F5EDD2` | Fundo de "Serviços", pergunta aberta do FAQ, barra fixa do celular |
| `--home-card` | `#FFFCF2` | Cartões de assunto |
| `--home-tan` | `#CBA576` | Fundo de "Advogados cadastrados" |
| `--home-dark` | `#261C14` | Fundo das perguntas frequentes (marrom quase preto, nunca preto puro) |
| `--home-on-brown-dim` | `#E6D8BF` | Texto secundário sobre o marrom (contraste ≥ 4,5:1) |

**Regras de cor**

- **Um padrão só**, sem alternância de tema.
- **Dourado com parcimônia**: botão principal, marcadores pequenos, a barra fina em cima dos
  cartões, o risco embaixo do título do hero. Nunca fundo de área grande.
- **Dourado puro não serve pra texto sobre fundo claro** (some no creme). Pra texto e link,
  usar `--gold-ink`.
- **Nada de preto puro.** O tom mais escuro é o marrom `#261C14` do FAQ.
- Degradê só onde não tem outro jeito; a regra é cor chapada.

## 3. Textura: linhas curvas no fundo

O hero e a seção "Sobre" têm linhas curvas finas, quase invisíveis, no fundo marrom (detalhe
do protótipo). É um SVG (`LinhasFundo` em `HomePage.jsx`) esticado na faixa inteira, traço
creme com 8% de opacidade e espessura fixa (`vector-effect: non-scaling-stroke`). Não pode
ficar mais forte que isso: a ideia é sentir a textura sem perceber que ela está ali.

## 4. Tipografia

- **Títulos**: Libre Baskerville (`--font-serif`), peso 400.
- **Corpo e interface**: IBM Plex Sans (`--font-body`).
- Rótulos pequenos acima dos títulos: Plex 12px, 600, maiúsculas, espaçamento 0,12em.
- As duas fontes vêm do Google Fonts no `frontend/index.html`.

## 5. Forma

- **Cantos quase retos**: `--radius-sharp` (3px) em botões, cartões, fotos e campos. Só é
  redondo o que é círculo de verdade (botões de seta, ícone do FAQ, avatar).
- Profundidade por borda de 1px; sombra só na foto do hero, que "flutua" sobre o marrom.
- Ícones em SVG de traço, sem emoji.

## 6. Fotos

- Fotos de banco de imagem do **Unsplash** (licença gratuita, uso comercial liberado, crédito
  não obrigatório; mesmo assim o rodapé diz "Fotos: Unsplash"). Servidas direto da CDN do
  Unsplash, recortadas pelo próprio link (`fotoUnsplash()` em `HomePage.jsx`).
- **Foto de banco nunca representa um advogado cadastrado.** Os cartões de "Advogados
  cadastrados" usam só a foto real de cada perfil (ou a inicial, se não tiver).
- Não usar Freepik/Storyset sem dar o crédito que o plano grátis exige.

## 7. Home (landing page)

| # | Seção | Fundo | Conteúdo |
| --- | --- | --- | --- |
| 1 | Hero | `#765039` + linhas curvas | Navegação, título serifado, risco dourado, botão "Criar conta", foto em retrato |
| 2 | Serviços | `#F5EDD2` | Foto + "Como funciona" e 8 cartões de assunto (borda dourada em cima) |
| 3 | Advogados | `#CBA576` | Carrossel com até 8 advogados reais da API (`GET /advogados`), setas redondas |
| 4 | Sobre | `#765039` + linhas curvas | Título, foto e 3 textos que trocam pelas setas (o problema, pra quem procura, pra quem advoga) |
| 5 | Perguntas | `#261C14` | FAQ numerado (mesmo texto do JSON-LD do `index.html`) + foto |
| 6 | Rodapé | `#765039` | Links e aviso de que a Nocturis não presta serviço jurídico |

- Os assuntos dos cartões vêm da taxonomia real da triagem (`backend/src/services/triagem.js`).
  A Home nunca promete uma área que o sistema não classifica.
- **Sem depoimento inventado.** A plataforma ainda não tem cliente real; a seção 4 explica o
  problema que o projeto resolve.
- Usuário logado vê "Meu painel" no lugar de "Entrar"/"Criar conta".
- No celular aparece uma barra fixa com "Criar conta grátis" no rodapé da tela (só deslogado).
- Se a API de advogados falhar, a seção 3 mostra só o link "Ver todos os advogados".

## 8. Pendências

- **Conta "Advogado Teste" no banco**: tem OAB verificada e foto (um desenho), então aparece
  em primeiro no carrossel da Home. Renomear ou remover do banco antes de apresentar.
- **Fotos do seed em baixa resolução**: os advogados fictícios usam fotos de 128px do
  randomuser.me, que ficam levemente borradas nos cartões grandes da Home.
- **Cor por área** (`--area-civel` verde, `--area-trabalhista` terracota no `AreaIcon`): o
  verde destoa da paleta nova. Decidir na etapa das telas internas.

## 9. Antes de dizer que uma tela terminou

- Conferir no navegador em desktop e em celular (375px), sem rolagem lateral.
- Conferir contraste: texto pequeno com pelo menos 4,5:1.
- Listar os arquivos alterados.
- Deploy é `firebase deploy` de verdade; commit no git não é deploy.
