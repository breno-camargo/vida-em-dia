import { useLayoutEffect, useRef, type RefObject } from 'react'

// Não remonta conteúdo, não anima dimensões nem bloqueia a interação.
export function useTransicaoSuave(ref: RefObject<HTMLElement | null>, chave: string) {
  const anterior = useRef(chave)
  useLayoutEffect(() => {
    if (anterior.current === chave) return
    anterior.current = chave
    const preferencia = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (preferencia.matches) return
    const elemento = ref.current
    // Opacidade pode ser composta sem recalcular o layout em cada quadro.
    // Não animar left nem transformar o main: os rodapés continuam fixos à janela.
    const quadros = elemento?.id === 'conteudo'
      ? [{ opacity: 0.92 }, { opacity: 1 }]
      : [{ opacity: 0.85 }, { opacity: 1 }]
    const animacao = elemento?.animate?.(quadros, { duration: elemento.id === 'conteudo' ? 260 : 220, easing: 'cubic-bezier(.22,.61,.36,1)' })
    const reduzir = () => { if (preferencia.matches) animacao?.cancel() }
    preferencia.addEventListener('change', reduzir)
    return () => { animacao?.cancel(); preferencia.removeEventListener('change', reduzir) }
  }, [chave, ref])
}
