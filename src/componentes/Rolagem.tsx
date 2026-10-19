import { useEffect, useId, useRef, useState } from 'react'
export function Rolagem({ valores, inicial, valor, rotulo, escolher, formatar = String }: {
  valores: number[]; inicial: number; valor?: number; rotulo: string; escolher: (valor: number) => void; formatar?: (valor: number) => string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const inicio = useRef(valor ?? inicial)
  const pronta = useRef(false)
  const ultimoValor = useRef(valor ?? inicial)
  const id = useId()
  const [interno, definirInterno] = useState(Math.max(0, valores.indexOf(valor ?? inicial)))
  const selecionado = valor !== undefined ? Math.max(0, valores.indexOf(valor)) : interno
  const selecionar = (indice: number) => {
    ultimoValor.current = valores[indice]
    definirInterno(indice)
    escolher(valores[indice])
  }

  useEffect(() => {
    const indice = Math.max(0, valores.indexOf(inicio.current))
    pronta.current = false
    const quadro = requestAnimationFrame(() => {
      if (ref.current) ref.current.scrollTop = indice * 48
      pronta.current = true
    })
    return () => cancelAnimationFrame(quadro)
  }, [valores])

  useEffect(() => {
    if (valor === undefined || valor === ultimoValor.current) return
    ultimoValor.current = valor
    const indice = valores.indexOf(valor)
    if (indice >= 0 && pronta.current && ref.current) {
      // Saltos posicionam imediatamente: não ignore gestos do usuário por um timer.
      ref.current.scrollTop = indice * 48
    }
  }, [valor, valores])

  return <div className="coluna-roda"><span>{rotulo}</span><div className="janela-roda"><div className="faixa-roda" aria-hidden="true" />
    <div ref={ref} className="roda" role="listbox" tabIndex={0} aria-label={rotulo} aria-activedescendant={`${id}-${selecionado}`} onKeyDown={e => {
      if (!['ArrowUp', 'ArrowDown', 'Home', 'End'].includes(e.key)) return
      e.preventDefault()
      const indice = e.key === 'Home' ? 0 : e.key === 'End' ? valores.length - 1 : Math.max(0, Math.min(valores.length - 1, selecionado + (e.key === 'ArrowDown' ? 1 : -1)))
      ref.current?.scrollTo({ top: indice * 48 }); selecionar(indice)
    }} onScroll={e => { if (!pronta.current) return; const indice = Math.max(0, Math.min(valores.length - 1, Math.round(e.currentTarget.scrollTop / 48))); if (valor !== undefined && valores[indice] === valor) return; selecionar(indice) }}>
      {valores.map((item, indice) => <button type="button" role="option" tabIndex={-1} aria-selected={indice === selecionado} id={`${id}-${indice}`} key={item} onClick={() => { ref.current?.scrollTo({ top: indice * 48, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }); selecionar(indice) }}>{formatar(item)}</button>)}
    </div></div></div>
}
