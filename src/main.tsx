import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './estilos/controles.css'
import './estilos/novo-visual.css'
import './estilos/paleta-clara.css'
import './estilos/contraste-claro.css'
import './estilos/superficies.css'
import './estilos/transicoes.css'
import App from './App.tsx'
import { iniciarConta } from './sincronizacao/estado'
import { prepararTrocaIdentidade } from './sincronizacao/trocaIdentidade'

const raiz = createRoot(document.getElementById('root')!)
prepararTrocaIdentidade(() => raiz.unmount())
raiz.render(<p role="status">Abrindo seu espaço…</p>)
void iniciarConta().then(() => raiz.render(
  <StrictMode>
    <App />
  </StrictMode>,
)).catch(erro => {
  if (import.meta.env.DEV) console.error('Falha na inicialização local:', erro instanceof Error ? erro.stack : 'Erro desconhecido')
  raiz.render(<p role="alert">Não foi possível abrir seu espaço local. Reabra o app. Seus registros foram preservados.</p>)
})
