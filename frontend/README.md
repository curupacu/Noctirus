# Nocturis — frontend

React 19 + Vite + React Router. Design system próprio da Nocturis (coruja, tons marrom/amarelo)
— ver `src/styles/tokens.css` pros tokens de cor/tipografia/espaçamento.

## Rodando localmente

```
cp .env.example .env   # preencha a config do Web App do Firebase (ver abaixo)
npm install
npm run dev             # http://localhost:5173 (ou próxima porta livre)
```

Precisa do `backend/` rodando em paralelo (`VITE_API_URL`, padrão `http://localhost:3001`) pra
qualquer coisa além de navegar pelas telas estáticas — login, triagem, listagem de advogados etc.
todas dependem da API.

## Variáveis de ambiente (`.env`)

- `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`,
  `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID` —
  config do Web App do Firebase (Firebase Console > Configurações do projeto > Seus apps > SDK
  setup). Usada só pro Firebase Authentication no cliente.
- `VITE_API_URL` — URL do backend (local: `http://localhost:3001`).

`.env.production` fixa a `VITE_API_URL` pro backend do Render no build de produção.

## Estrutura

```
src/
  features/       auth, triagem, advogados, curriculo, perfil (dashboard do advogado em
                  /perfil + formulário em /perfil/editar), painel (landing do cliente),
                  conversas (chat do advogado), contatos (Meus Contatos do cliente), admin
  components/     UI reutilizável — Button, Input, Select, ChoiceCard, BottomNav,
                  ProgressSteps, Header, ChatThread, AdvogadoCard, AreaIcon, Avatar,
                  PerfilCompletude, OwlIllustration
  lib/            cliente Firebase, cliente HTTP da API
  routes/         AppRouter (rotas) + HomePage
  styles/         tokens.css (design tokens)
  index.css       classes utilitárias (layout, cards, pills, splash screen etc.)
```

## Scripts

```
npm run dev       # servidor de desenvolvimento (Vite)
npm run build     # build de produção em dist/
npm run preview   # serve o build localmente
npm run lint       # oxlint
```

## Estado do design

Todas as telas do fluxo principal já passaram pelo redesign (tela cheia nas telas de entrada,
sem cards flutuando soltos, seletores em pills, listas como `.list-row`/`AdvogadoCard` em vez de
bullets dentro de caixas). Tema claro (padrão) e escuro alternável pelo botão no header —
`lib/theme.js` guarda a escolha em `localStorage`, tokens em `styles/tokens.css`
(`:root` = claro, `:root[data-theme="dark"]` = escuro; dourado/marrom do header ficam fixos nos
dois temas). Falta validar responsividade mobile de verdade nas telas mais recentes — ver a
seção "Pontos fracos" do README na raiz do repo.

`/perfil` do advogado é dashboard-only (saudação, estatísticas, completude de perfil,
conversas recentes, atalhos); o formulário de edição (dados, foto, especialidades, currículo)
vive à parte em `/perfil/editar`. O chat entre cliente e advogado (`ChatThread`) usa só
mensagens pré-definidas por categoria — nunca texto livre, ver `database/schema.md` (coleção
`mensagensChat`) pro porquê.
