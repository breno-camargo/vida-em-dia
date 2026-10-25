import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
export default defineConfig(({ mode }) => {
  if (process.env.VERCEL_ENV === 'production') throw new Error('Esta branch é somente para homologação Preview.')
  const homologacao = mode === 'homologacao'
  if (homologacao) {
    if (process.env.VERCEL_ENV !== 'preview') throw new Error('Backend de homologação permitido somente no Preview.')
    if (process.env.VITE_SUPABASE_URL?.trim() !== 'https://ofzixbpliejnaiyuspti.supabase.co') throw new Error('Projeto Supabase de homologação inesperado.')
    const chave = process.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim() || process.env.VITE_SUPABASE_ANON_KEY?.trim()
    if (!chave || chave.startsWith('sb_secret_')) throw new Error('Configure somente a chave pública do cliente no Preview.')
    if (chave.startsWith('eyJ')) {
      try { if (JSON.parse(Buffer.from(chave.split('.')[1], 'base64url').toString()).role !== 'anon') throw new Error() }
      catch { throw new Error('A chave JWT do cliente deve ter papel anon.') }
    } else if (!chave.startsWith('sb_publishable_')) throw new Error('Formato de chave pública inesperado.')
  }
  return {
  envDir: false,
  define: homologacao ? {} : {
    'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(''),
    'import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY': JSON.stringify(''),
    'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(''),
  },
  build: { rolldownOptions: { output: { codeSplitting: { groups: [{ name: 'supabase', test: /node_modules[\\/]@supabase[\\/]/ }] } } } }, plugins: [react(), tailwindcss(), VitePWA({
  registerType: 'prompt', includeAssets: ['icons/*.png'],
  manifest: {
    name: 'Vida em Dia — Homologação', short_name: 'Vida Teste', lang: 'pt-BR',
    description: 'Seu espaço pessoal de treino, alimentação e evolução.',
    start_url: '/', scope: '/', display: 'standalone', orientation: 'portrait',
    theme_color: '#101714', background_color: '#101714',
    icons: [
      { src: '/icons/icone-universal-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icone-universal-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icons/icone-universal-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
    ]
  },
  workbox: { globPatterns: ['**/*.{js,css,html,png,svg,ico,woff2}'], navigateFallback: '/index.html' }
})] }
})
