import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import * as Sentry from '@sentry/react'
import './components/Input/Input.css'
import './index.css'
import App from './App.jsx'
import { acordarServidor } from './lib/api'
import { aplicarPreferencias } from './lib/preferencias'

// Tamanho do texto e animações escolhidos nas Configurações, antes da primeira tela aparecer.
aplicarPreferencias()

// Já cutuca o backend (Render grátis hiberna) enquanto a pessoa vê a Home ou o login.
acordarServidor()

// VITE_SENTRY_DSN é opcional de propósito — sem ela (dev local sem configurar), o app
// roda normal, só sem reportar erro pra lugar nenhum.
if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE,
  })
}

// Sem isso, um erro de render em qualquer componente derrubava a árvore inteira pra tela
// em branco (comportamento padrão do React 18+ sem error boundary) — pelo menos mostra
// alguma coisa e dá pra tentar de novo.
function ErroFallback() {
  return (
    <main>
      <span className="eyebrow">Erro</span>
      <h1>Algo deu errado</h1>
      <p className="text-muted">Recarregue a página pra tentar de novo.</p>
      <button className="button button--primary" onClick={() => window.location.reload()}>
        Recarregar
      </button>
    </main>
  )
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Sentry.ErrorBoundary fallback={<ErroFallback />}>
      <App />
    </Sentry.ErrorBoundary>
  </StrictMode>,
)
