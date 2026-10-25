import { useLayoutEffect, useRef, type RefObject } from 'react'
import { sequenciaAbas, type Aba } from '../utilitarios/gestoAbas'

// Não remonta conteúdo, não anima dimensões nem bloqueia a interação.
export function useTransicaoSuave(ref: RefObject<HTMLElement | null>, chave: string) {
  const anterior = useRef(chave)
  useLayoutEffect(() => {
    if (anterior.current === chave) return
    const antiga = anterior.current
    anterior.current = chave
    const preferencia = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (preferencia.matches) return
    const elemento = ref.current
    const antes = sequenciaAbas.indexOf(antiga as Aba), depois = sequenciaAbas.indexOf(chave as Aba)
    const deslocamento = elemento?.id === 'conteudo' && antes >= 0 && depois >= 0 ? (depois > antes ? 20 : -20) : 0
    // Posição relativa preserva a ancoragem dos botões fixos à janela.
    // Não transformar o main: transform criaria outro bloco para position:fixed.
    const quadros = elemento?.id === 'conteudo'
      ? [{ opacity: 0.72, left: `${deslocamento}px` }, { opacity: 1, left: '0px' }]
      : [{ opacity: 0.85 }, { opacity: 1 }]
    const animacao = elemento?.animate?.(quadros, { duration: elemento.id === 'conteudo' ? 260 : 220, easing: 'cubic-bezier(.22,.61,.36,1)' })
    const reduzir = () => { if (preferencia.matches) animacao?.cancel() }
    preferencia.addEventListener('change', reduzir)
    return () => { animacao?.cancel(); preferencia.removeEventListener('change', reduzir) }
  }, [chave, ref])
}
