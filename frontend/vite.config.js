import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // "prompt": nunca troca a versão embaixo do usuário sem avisar — com "autoUpdate"
      // uma pessoa no meio de uma triagem podia levar um refresh silencioso e perder o
      // que tava digitando. O aviso (ver components/AtualizacaoDisponivel) deixa a pessoa
      // escolher a hora.
      registerType: 'prompt',
      // false porque o registro é feito na mão via virtual:pwa-register/react (ver
      // components/AtualizacaoDisponivel) — deixar o "auto" registrar também duplicava o
      // service worker sendo registrado duas vezes.
      injectRegister: false,
      includeAssets: [
        'favicon.ico',
        'favicon.svg',
        'apple-touch-icon.png',
        'robots.txt',
        'og-image.png',
      ],
      manifest: {
        name: 'Nocturis — Advocacia Virtual',
        short_name: 'Nocturis',
        description:
          'Triagem e direcionamento jurídico em áreas cível e trabalhista, com matching de advogados por localização e especialidade.',
        start_url: '/',
        id: '/',
        display: 'standalone',
        background_color: '#14120f',
        theme_color: '#61402c',
        lang: 'pt-BR',
        orientation: 'portrait-primary',
        icons: [
          { src: '/favicon-48.png', sizes: '48x48', type: 'image/png' },
          { src: '/favicon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/favicon-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
          { src: '/favicon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/favicon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
        // Atalho de segurar o ícone do app — só ajuda quem já tem conta (as duas rotas
        // exigem login), mas não atrapalha quem não tem: RotaProtegida manda pro /login.
        shortcuts: [
          {
            name: 'Nova triagem',
            url: '/triagem',
            icons: [{ src: '/favicon-192.png', sizes: '192x192' }],
          },
          {
            name: 'Ver advogados',
            url: '/advogados',
            icons: [{ src: '/favicon-192.png', sizes: '192x192' }],
          },
        ],
      },
      workbox: {
        // API/Firestore ficam de fora de propósito — cache de dado dinâmico aqui vira
        // dado velho mentindo pro usuário (contato, denúncia, conversa). Só o app shell
        // (JS/CSS/HTML/ícones) é pré-cacheado; o resto segue sempre pela rede.
        globPatterns: ['**/*.{js,css,html,svg,png,ico,webmanifest}'],
        navigateFallbackDenylist: [/^\/api\//],
        runtimeCaching: [
          {
            // Fontes do Google — vale cachear porque nunca mudam de conteúdo (URL
            // versionada), e é o único jeito de manter a tipografia certa offline.
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\//,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts',
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
        ],
      },
    }),
  ],
})
