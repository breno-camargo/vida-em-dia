import { useLayoutEffect, useRef, type ReactNode } from 'react'

// Anima só a opacidade; a troca não remonta filhos nem desloca campos/foco.
export function TransicaoConteudo({ chave, children }: { chave: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const ultimaChave = useRef(chave)
  useLayoutEffect(() => {
    if (ultimaChave.current === chave) return
    ultimaChave.current = chave
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const animacao = ref.current?.animate?.([{ opacity: 0.7 }, { opacity: 1 }], { duration: 120, easing: 'ease-out' })
    return () => animacao?.cancel()
  }, [chave])
  return <div ref={ref} className="conteudo-alternado">{children}</div>
}
