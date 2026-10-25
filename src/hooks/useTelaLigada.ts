import { useEffect, useRef, useState } from 'react'
import NoSleep from 'nosleep.js'
export function useTelaLigada() {
  const alternativa = useRef<NoSleep | null>(null)
  const bloqueio = useRef<WakeLockSentinel | null>(null)
  const ativo = useRef(false)
  const versao = useRef(0)
  const pedido = useRef<number | null>(null)
  const [habilitada, definirHabilitada] = useState(false)
  const [ocupado, definirOcupado] = useState(false)
  const [estado, definirEstado] = useState('Toque para manter a tela ligada')
  const manter = async () => {
    ativo.current = true
    const videoAtual = (alternativa.current as (NoSleep & { noSleepVideo?: HTMLVideoElement }) | null)?.noSleepVideo
    const alternativaAtiva = alternativa.current?.isEnabled && (!videoAtual || !videoAtual.paused)
    if (pedido.current !== null || (bloqueio.current && !bloqueio.current.released) || alternativaAtiva) return
    const atual = ++versao.current
    pedido.current = atual
    definirOcupado(true)
    definirEstado('Ativando tela ligada…')
    try {
      if ('wakeLock' in navigator) {
        const novo = await navigator.wakeLock.request('screen')
        if (atual !== versao.current || !ativo.current) { await novo.release(); return }
        bloqueio.current = novo
        novo.addEventListener('release', () => {
          if (bloqueio.current !== novo) return
          bloqueio.current = null
          definirHabilitada(false)
          if (ativo.current) {
            // No fundo, aguarde a volta à tela; em primeiro plano, peça nova ação do usuário.
            if (document.visibilityState === 'visible') ativo.current = false
            definirEstado('Tela ligada pausada pelo aparelho')
          }
        })
      } else {
        if (!alternativa.current) {
          alternativa.current = new NoSleep()
          const video = (alternativa.current as NoSleep & { noSleepVideo?: HTMLVideoElement }).noSleepVideo
          video?.addEventListener('pause', () => {
            if (!ativo.current) return
            definirHabilitada(false)
            if (document.visibilityState === 'visible') ativo.current = false
            definirEstado('Tela ligada pausada pelo aparelho')
          })
        }
        const video = (alternativa.current as NoSleep & { noSleepVideo?: HTMLVideoElement }).noSleepVideo
        if (video) { video.muted = true; video.defaultMuted = true; video.setAttribute('playsinline', ''); video.setAttribute('webkit-playsinline', '') }
        await alternativa.current.enable()
      }
      if (atual !== versao.current || !ativo.current) { if (!ativo.current) alternativa.current?.disable(); return }
      definirHabilitada(true)
      definirEstado('Tela ligada durante o treino')
    } catch {
      if (atual === versao.current && ativo.current) {
        ativo.current = false
        definirHabilitada(false)
        definirEstado('Não foi possível ativar. Toque para tentar de novo')
      }
    } finally {
      if (pedido.current === atual) pedido.current = null
      if (atual === versao.current) definirOcupado(false)
      else if (ativo.current) void refManter.current()
    }
  }
  const refManter = useRef(manter)
  const parar = () => {
    ativo.current = false
    versao.current++
    definirHabilitada(false)
    definirOcupado(false)
    definirEstado('Toque para manter a tela ligada')
    const anterior = bloqueio.current
    bloqueio.current = null
    void anterior?.release().catch(() => undefined)
    alternativa.current?.disable()
  }
  useEffect(() => { refManter.current = manter })
  useEffect(() => {
    const voltar = () => { if (ativo.current && document.visibilityState === 'visible') void refManter.current() }
    document.addEventListener('visibilitychange', voltar)
    return () => { ativo.current = false; versao.current++; document.removeEventListener('visibilitychange', voltar); void bloqueio.current?.release().catch(() => undefined); alternativa.current?.disable() }
  }, [])
  const alternar = () => { if (ativo.current) parar(); else void manter() }
  const renovar = () => { if (ativo.current) void manter() }
  return { estado, habilitada, ocupado, manter, parar, alternar, renovar }
}
