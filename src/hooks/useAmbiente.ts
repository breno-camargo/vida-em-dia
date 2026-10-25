import { useEffect, useState } from 'react'
export function useAmbiente() {
  const [online, definirOnline] = useState(navigator.onLine)
  const [instalado, definirInstalado] = useState(false)
  const [persistente, definirPersistente] = useState<boolean | null>(null)
  useEffect(() => {
    const media = matchMedia('(display-mode: standalone)')
    const atualizar = () => {
      definirOnline(navigator.onLine)
      definirInstalado(media.matches || Boolean((navigator as Navigator & { standalone?: boolean }).standalone))
    }
    atualizar()
    window.addEventListener('online', atualizar); window.addEventListener('offline', atualizar)
    media.addEventListener('change', atualizar)
    void (async () => {
      try {
        if (navigator.storage?.persist) definirPersistente(await navigator.storage.persist())
      } catch { definirPersistente(false) }
    })()
    return () => { window.removeEventListener('online', atualizar); window.removeEventListener('offline', atualizar); media.removeEventListener('change', atualizar) }
  }, [])
  return { online, instalado, persistente }
}
