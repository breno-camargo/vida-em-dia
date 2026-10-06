import { useRegisterSW } from 'virtual:pwa-register/react'
export function AvisosPwa() {
  const { needRefresh: [atualizar], offlineReady: [offline, definirOffline], updateServiceWorker } = useRegisterSW({
    onRegisteredSW(_url, registro) {
      if (registro) window.setInterval(() => { if (navigator.onLine) void registro.update().catch(() => undefined) }, 60 * 60 * 1000)
    },
  })
  return <>{atualizar && <div className="aviso-pwa" role="status"><p>Nova versão disponível.</p>
    <button onClick={() => void updateServiceWorker(true)}>Tocar para atualizar</button></div>}
    {offline && !atualizar && <div className="aviso-pwa" role="status"><p>App pronto para usar offline.</p>
      <button onClick={() => definirOffline(false)}>Entendi</button></div>}</>
}
