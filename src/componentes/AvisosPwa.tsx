import { useRegisterSW } from 'virtual:pwa-register/react'
import { useState } from 'react'
const chaveAvisoOffline = 'vida-em-dia:aviso-offline-visto'
export function AvisosPwa() {
  const [entendido, definirEntendido] = useState(() => {
    try { return localStorage.getItem(chaveAvisoOffline) === 'sim' } catch { return false }
  })
  const { needRefresh: [atualizar], offlineReady: [offline, definirOffline], updateServiceWorker } = useRegisterSW({
    onRegisteredSW(_url, registro) {
      if (registro) window.setInterval(() => { if (navigator.onLine) void registro.update().catch(() => undefined) }, 60 * 60 * 1000)
    },
  })
  return <>{atualizar && <div className="aviso-pwa" role="status"><p>Nova versão disponível.</p>
    <button onClick={() => void updateServiceWorker(true)}>Tocar para atualizar</button></div>}
    {offline && !atualizar && !entendido && <div className="aviso-pwa" role="status"><p>App pronto para usar offline.</p>
      <button onClick={() => {
        definirOffline(false); definirEntendido(true)
        try { localStorage.setItem(chaveAvisoOffline, 'sim') } catch { /* Mantém fechado nesta abertura. */ }
      }}>Entendi</button></div>}</>
}
