import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
export default defineConfig({ plugins: [react(), tailwindcss(), VitePWA({
  registerType: 'prompt', includeAssets: ['icons/*.png'],
  manifest: {
    name: 'Vida em Dia', short_name: 'Vida em Dia', lang: 'pt-BR',
    description: 'Seu espaço pessoal de treino, alimentação e evolução.',
    start_url: '/', scope: '/', display: 'standalone', orientation: 'portrait',
    theme_color: '#101714', background_color: '#101714',
    icons: [
      { src: '/icons/icone-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icone-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icons/icone-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
    ]
  },
  workbox: { globPatterns: ['**/*.{js,css,html,png,svg,ico,woff2}'], navigateFallback: '/index.html' }
})] })
