import { useEffect, useRef, type RefObject } from 'react'
import { abaPorDeslize, type Aba } from '../utilitarios/gestoAbas'

const controles = 'input,textarea,select,label,[contenteditable]:not([contenteditable=false]),[role=slider],dialog,.roda,.alca-painel,.modelos-card,.musculos-catalogo,.abas-treino,.abas-medidas,.abas-catalogo,.alternador-seletor,.grafico-evolucao,[data-sem-deslize]'

export function useDeslizarAbas(ref: RefObject<HTMLElement | null>, aba: Aba, selecionar: (aba: Aba) => void, ativo: boolean) {
  const bloquearCliqueAte = useRef(0)
  useEffect(() => {
    const main = ref.current
    if (!ativo || !main) return
    let gesto: { id: number; x: number; y: number; inicio: number; horizontal: boolean; scroll: number } | undefined
    const impedido = () => !!document.querySelector('dialog[open]') || document.activeElement?.matches('input,textarea,select,[contenteditable=true]') || !!window.getSelection()?.toString()
    const iniciar = (e: TouchEvent) => {
      bloquearCliqueAte.current = 0
      gesto = undefined
      if (e.touches.length !== 1 || impedido()) return
      const alvo = e.target instanceof Element ? e.target : null
      if (!alvo || alvo.closest(controles)) return
      for (let el: Element | null = alvo; el && el !== main; el = el.parentElement) {
        if (el.scrollWidth > el.clientWidth + 2 && /auto|scroll/.test(getComputedStyle(el).overflowX)) return
      }
      const toque = e.touches[0]
      // Reservar as bordas para Voltar/Avançar do navegador no iPhone.
      if (toque.clientX <= 24 || toque.clientX >= window.innerWidth - 24) return
      gesto = { id: toque.identifier, x: toque.clientX, y: toque.clientY, inicio: performance.now(), horizontal: false, scroll: main.scrollTop }
    }
    const mover = (e: TouchEvent) => {
      if (!gesto) return
      const toque = Array.from(e.touches).find(t => t.identifier === gesto?.id)
      if (e.touches.length !== 1 || !toque || impedido() || performance.now() - gesto.inicio > 800) { gesto = undefined; return }
      const dx = Math.abs(toque.clientX - gesto.x), dy = Math.abs(toque.clientY - gesto.y)
      if (!gesto.horizontal) {
        if (dy >= 10 && dy >= dx) { gesto = undefined; return }
        if (dx < 16 || dx < dy * 1.65) return
        if (Math.abs(main.scrollTop - gesto.scroll) > 4) { gesto = undefined; return }
        gesto.horizontal = true
      }
      if (e.cancelable) e.preventDefault()
    }
    const terminar = (e: TouchEvent) => {
      const atual = gesto; gesto = undefined
      if (!atual || !atual.horizontal || e.touches.length || impedido()) return
      const toque = Array.from(e.changedTouches).find(t => t.identifier === atual.id)
      if (!toque) return
      // Evitar que um deslize sobre cartão/botão seja interpretado como clique.
      bloquearCliqueAte.current = performance.now() + 450
      const proxima = abaPorDeslize(aba, toque.clientX - atual.x, toque.clientY - atual.y, main.clientWidth, performance.now() - atual.inicio)
      if (proxima) selecionar(proxima)
    }
    const cancelar = () => { gesto = undefined }
    const clique = (e: MouseEvent) => {
      if (e.detail !== 0 && performance.now() < bloquearCliqueAte.current) { e.preventDefault(); e.stopPropagation() }
    }
    main.addEventListener('touchstart', iniciar, { passive: true })
    main.addEventListener('touchmove', mover, { passive: false })
    main.addEventListener('touchend', terminar, { passive: true })
    main.addEventListener('touchcancel', cancelar, { passive: true })
    main.addEventListener('click', clique, true)
    return () => {
      main.removeEventListener('touchstart', iniciar); main.removeEventListener('touchmove', mover)
      main.removeEventListener('touchend', terminar); main.removeEventListener('touchcancel', cancelar)
      main.removeEventListener('click', clique, true)
    }
  }, [ref, aba, selecionar, ativo])
}
