import { useLayoutEffect, type RefObject } from 'react'

export function useReservaAcoes(conteudo: RefObject<HTMLElement | null>, acoes: RefObject<HTMLElement | null>, ativo: boolean) {
  useLayoutEffect(() => {
    const raiz = conteudo.current, rodape = acoes.current
    const main = raiz?.closest('main')
    if (!ativo || !raiz || !rodape || !main) return
    const ajustar = () => {
      const margemMain = parseFloat(getComputedStyle(main).paddingBottom) || 0
      const reserva = Math.max(0, rodape.getBoundingClientRect().height + 16 - margemMain)
      raiz.style.setProperty('--reserva-acoes', `${reserva}px`)
    }
    ajustar()
    const observador = new ResizeObserver(ajustar)
    observador.observe(rodape); observador.observe(main)
    return () => observador.disconnect()
  }, [ativo, conteudo, acoes])
}
