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
  features/       auth, triagem, advogados, curriculo, perfil, painel, admin
  components/     UI reutilizável — Button, Input, Select, ChoiceCard, BottomNav,
                  ProgressSteps, Header
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

Login, Cadastro, Home e a busca pública de advogados (`/advogados`) já passaram por um redesign
completo — tela cheia, sem cards flutuando soltos, seletores em pills. O resto das telas usa o
design system base (`components/Button`, `Input`, `Select` + classes utilitárias como `.card`,
`.stack`, `.row`, `.badge`, `.chip`), mas ainda não recebeu esse mesmo tratamento visual — ver a
seção "Pontos fracos" do README na raiz do repo.
