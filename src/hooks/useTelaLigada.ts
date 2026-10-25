import { useEffect, useRef, useState } from 'react'
import NoSleep from 'nosleep.js'
let alternativa: NoSleep | undefined
export function useTelaLigada() {
  const bloqueio = useRef<WakeLockSentinel | null>(null)
  const ativo = useRef(false)
  const [estado, definirEstado] = useState('Toque para manter a tela ligada')
  const manter = async () => {
    ativo.current = true
    try {
      if ('wakeLock' in navigator) {
        if (!bloqueio.current || bloqueio.current.released) bloqueio.current = await navigator.wakeLock.request('screen')
      } else { alternativa ??= new NoSleep(); await alternativa.enable() }
      definirEstado('Tela ligada durante o treino')
    } catch { definirEstado('Tela ligada indisponível; tente novamente') }
  }
  const refManter = useRef(manter)
  const parar = () => { ativo.current = false; void bloqueio.current?.release(); alternativa?.disable() }
  useEffect(() => { refManter.current = manter })
  useEffect(() => {
    const voltar = () => { if (ativo.current && document.visibilityState === 'visible') void refManter.current() }
    document.addEventListener('visibilitychange', voltar)
    return () => { ativo.current = false; document.removeEventListener('visibilitychange', voltar); void bloqueio.current?.release(); alternativa?.disable() }
  }, [])
  return { estado, manter, parar }
}
