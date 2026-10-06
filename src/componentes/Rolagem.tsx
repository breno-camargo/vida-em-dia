import { useEffect, useId, useRef, useState } from 'react'
export function Rolagem({ valores, inicial, rotulo, escolher, formatar = String }: {
  valores: number[]; inicial: number; rotulo: string; escolher: (valor: number) => void; formatar?: (valor: number) => string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const inicio = useRef(inicial)
  const pronta = useRef(false)
  const id = useId()
  const [selecionado, definirSelecionado] = useState(Math.max(0, valores.indexOf(inicial)))
  const selecionar = (indice: number) => { definirSelecionado(indice); escolher(valores[indice]) }
  useEffect(() => {
    const indice = Math.max(0, valores.indexOf(inicio.current))
    // O dialog ainda está oculto nos efeitos dos filhos. Posicione após showModal.
    pronta.current = false
    const quadro = requestAnimationFrame(() => {
      if (ref.current) ref.current.scrollTop = indice * 48
      pronta.current = true
    })
    return () => cancelAnimationFrame(quadro)
  }, [valores])
  return <div className="coluna-roda"><span>{rotulo}</span><div className="janela-roda"><div className="faixa-roda" aria-hidden="true" />
    <div ref={ref} className="roda" role="listbox" tabIndex={0} aria-label={rotulo} aria-activedescendant={`${id}-${selecionado}`} onKeyDown={e => {
      if (!['ArrowUp', 'ArrowDown', 'Home', 'End'].includes(e.key)) return
      e.preventDefault()
      const indice = e.key === 'Home' ? 0 : e.key === 'End' ? valores.length - 1 : Math.max(0, Math.min(valores.length - 1, selecionado + (e.key === 'ArrowDown' ? 1 : -1)))
      ref.current?.scrollTo({ top: indice * 48 }); selecionar(indice)
    }} onScroll={e => { if (!pronta.current) return; const indice = Math.max(0, Math.min(valores.length - 1, Math.round(e.currentTarget.scrollTop / 48))); selecionar(indice) }}>
      {valores.map((valor, indice) => <button type="button" role="option" tabIndex={-1} aria-selected={indice === selecionado} id={`${id}-${indice}`} key={valor} onClick={() => { ref.current?.scrollTo({ top: indice * 48, behavior: 'smooth' }); selecionar(indice) }}>{formatar(valor)}</button>)}
    </div></div></div>
}
