# DESIGN.md — Nocturis (reformulação visual)

Estética-alvo: **app jurídico noturno e sóbrio** — fundo escuro quente, texto quase
branco, marrons da coruja nos detalhes, amarelo-dourado só nos acentos. Serifada
elegante nos títulos, combinando com a logo. Sério e premium, com cara de app mobile
(NÃO landing page de escritório).

Este documento é a fonte de verdade do visual. Siga-o à risca.

---

## 0. Contexto importante sobre a logo e o fundo

- A logo (coruja + "Nocturis") tem **fundo transparente** — o cinza que aparece em
  alguns exports é só o canvas do Figma, **não é cor da marca**. Ignore esse cinza.
- Portanto o fundo do app é uma ESCOLHA nossa, e a escolha está fixada nos tokens
  abaixo (`--ink-950`). Não use o cinza do Figma.
- Por que o fundo é quente e não cinza neutro: a coruja tem marrom e amarelo (cores
  quentes). Fundo frio/cinza "briga" com ela e a deixa sem vida; fundo escuro e quente
  faz o marrom e o amarelo brilharem. Preto puro também não — some com o marrom escuro
  da coruja. Por isso: carvão quente escuro.

**Decisão da equipe: dois fundos em camadas** (isto cria profundidade, é intencional):
- `#14120F` (quase-preto quente) = **fundo BASE da tela**, atrás de tudo.
- `#61402C` (marrom médio quente) = **superfície ELEVADA em destaque** — só em cards de
  destaque, header e no card de resultado da triagem. NÃO usar como fundo de tela inteira.
- Cards comuns usam um marrom intermediário (`--ink-850` nos tokens), entre os dois.

Por que assim: o card "flutua" sobre o fundo mais escuro — é o visual em camadas das
referências premium. Tudo na mesma cor fica chapado e sem graça.

Cuidado de contraste: `#61402C` é claro; texto creme sobre ele funciona, mas confira que
fica legível. Se um texto pequeno ficar lavado, escureça o fundo daquele card ou clareie
o texto. Nunca texto marrom-médio sobre marrom-médio.

---

## 1. Referências (o que seguir e o que evitar)

Baseado em sites de advocacia premium (fundo escuro + dourado + serifada):

FAZER:
- Fundo escuro CHAPADO (carvão quente), o mesmo em todas as telas.
- Cards de cor SÓLIDA com borda fininha de 1px.
- Dourado com PARCIMÔNIA: botão principal, uma linha de "eyebrow", uma palavra no
  título. O resto é creme/cinza. A contenção é o que dá sofisticação.
- Cantos DISCRETOS (8–12px). Botão de canto sutil, não pílula.
- Advogado com FOTO real (ou placeholder neutro), nunca inicial em fundo dourado.
- Sombra preta e discreta. Ícones SVG (sem emoji). Muito espaço pra respirar.

NÃO FAZER (erros das telas antigas):
- Fundo branco ou card branco sobre fundo branco. NUNCA.
- Degradê em card ou brilho colorido (glow). Card é cor chapada.
- Dourado espalhado (título inteiro dourado, chips dourados, avatar dourado). Errado.
- Pílulas muito arredondadas (border-radius 999px em tudo). Deixa "app fofo", não sério.
- Emoji na interface. Cores berrantes (azul/vermelho vivos).

---

## 2. Logo

A equipe fornece a logo em SVG. Colocar os arquivos em `frontend/src/assets/`:
- `logo-nocturis.svg` — versão completa (coruja + nome).
- `logo-icon.svg` — versão só-coruja (ícone).

Uso:
- Versão completa: tela de abertura/login e topo da Home.
- Só-coruja: header das telas internas e favicon.
- Usar o SVG COMO ESTÁ, via `<img src=...>` (a logo é colorida e fixa, não precisa de
  SVG inline nem trocar cor por CSS). NÃO recriar a coruja em CSS, NÃO redesenhar.

---

## 3. Regra de ouro

NUNCA branco (#FFF) como fundo, nunca card branco. Todo fundo é carvão; texto é creme.
Esse era o problema das telas antigas (cartão branco-no-branco).

---

## 4. Tokens (substituir o conteúdo de tokens.css por estes)

```css
:root {
  /* Fundos — escada de profundidade (quase-preto -> marrom), CHAPADOS */
  --ink-950: #14120F;   /* fundo BASE da tela (atrás de tudo) */
  --ink-900: #1E1913;   /* seções */
  --ink-850: #2A2118;   /* cards comuns (sólido, SEM degradê) */
  --ink-800: #37291C;   /* hover / elevado */
  --surface-warm: #61402C; /* superfície de DESTAQUE (card resultado, header) — usar pouco */
  --border:  #47382A;   /* borda fininha 1px */

  /* Marrons da coruja — só em detalhes (ícones, tags, divisórias) */
  --brown-400: #C89B6A;
  --brown-600: #8A5E38;
  --brown-800: #4A3420;

  /* Amarelo-dourado (olhos da coruja) — só acentos */
  --gold:     #F2D98A;   /* botão principal, eyebrow, 1 palavra no título, ícone/bico */
  --gold-dim: #D8B95E;   /* hover do dourado */

  /* Texto — creme quente, NUNCA branco puro */
  --cream:       #F3ECDF;   /* título / texto principal */
  --cream-dim:   #B3A994;   /* secundário */
  --cream-faint: #7E7566;   /* legenda / placeholder */

  /* Apoio (usar pouco) */
  --green: #7FB98A;   /* sucesso / verificado */
  --red:   #C77B5E;   /* erro / denúncia */

  /* Tipografia */
  --font-display: "Fraunces", Georgia, serif;   /* títulos — combina com a logo */
  --font-body: "Inter", system-ui, sans-serif;  /* texto / UI */

  /* Forma — cantos discretos */
  --radius: 12px;
  --radius-sm: 8px;
  --shadow: 0 10px 28px -14px rgba(0,0,0,0.75);
}
```

Importar as fontes no `index.html` (Google Fonts): `Fraunces` (títulos) e `Inter` (corpo).

---

## 5. Regras visuais (aplicar em todos os componentes)

- **Títulos:** `--font-display` (Fraunces). No máximo UMA palavra em `--gold` itálico
  para destaque; o resto em `--cream`.
- **Corpo/UI:** `--font-body` (Inter).
- **Cards comuns:** fundo `--ink-850` chapado, borda 1px `--border`, `--radius`, `--shadow`.
  PROIBIDO degradê e brilho colorido.
- **Cards de destaque** (resultado da triagem, header): fundo `--surface-warm` (#61402C)
  chapado, mesma borda e raio. Usar com parcimônia — 1 por tela no máximo. Conferir que o
  texto creme em cima fica legível.
- **Botão primário:** fundo `--gold`, texto `--ink-950`, `--radius-sm` (canto discreto).
  Hover: `--gold-dim`.
- **Botão secundário:** transparente, borda `--border`, texto `--cream`. Hover: fundo `--ink-800`.
- **Inputs:** fundo `--ink-850`, borda `--border`, texto `--cream`, placeholder
  `--cream-faint`. Foco: borda `--gold` + leve sombra.
- **Advogado:** FOTO em círculo ou quadrado arredondado. Sem foto no seed → placeholder
  cinza neutro (`--ink-800`) com ícone de pessoa. Nunca inicial em fundo dourado.
- **Dourado com parcimônia:** por tela, o dourado só em poucos lugares (1 botão principal
  + 1 ou 2 acentos). Se estiver dourado demais, está errado — reduza.
- **Espaçamento:** generoso; padding lateral mínimo 20px; respiro entre seções.
- **Ícones:** SVG (lucide ou similar). Sem emoji.
- **Estados obrigatórios:** hover, foco visível (borda dourada), carregando, vazio, erro.
  Textos de erro objetivos ("Descreva a denúncia com pelo menos 10 caracteres"), não vagos.

---

## 6. Tarefa

Repagine TODAS as páginas usando os tokens e regras acima — apenas CSS e classes, SEM
mudar lógica, rotas ou nomes de função:
Home, Login, Cadastro, Triagem, Resultado da triagem, Lista de advogados, Perfil do
advogado, Currículo, Denúncia, Minhas denúncias, Painel admin (usuários/advogados/
denúncias), Perfil.

Aplique a MESMA cara em todas, de forma consistente — nunca uma tela num estilo e outra
noutro. Coloque a logo completa no login/home e o ícone da coruja no header interno.

**Fluxo obrigatório:**
1. ANTES de tocar em qualquer arquivo, me mostre um PLANO curto: quais páginas, como vai
   aplicar os tokens, e a abordagem da navbar/header. Espere eu aprovar.
2. Só depois, aplique em todas as páginas de uma vez.

---

## 7. Antes de dizer que terminou

- Tire um SCREENSHOT de cada página e verifique você mesmo: nenhum fundo branco, nenhum
  card branco-no-branco, nenhum degradê em card, dourado usado com parcimônia, contraste
  legível (creme sobre carvão), foco visível.
- LISTE cada arquivo que você alterou. Nada de "pronto" vago.
- Deploy é `firebase deploy` de verdade — commit no git NÃO é deploy. Confirme a URL no ar.

---

## 8. Prioridade (se faltar tempo)

Faça primeiro as telas que a banca vê: **Resultado da triagem, Triagem, Lista de
advogados, Login**. Painel admin e denúncias depois. Melhor 4 telas redondas que 10 pela
metade — não deixe nenhuma pela metade dizendo que acabou.
