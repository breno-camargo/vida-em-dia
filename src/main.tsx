import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './estilos/controles.css'
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
)).catch(() => raiz.render(<p role="alert">Não foi possível abrir seu espaço local. Reabra o app. Seus registros foram preservados.</p>))
