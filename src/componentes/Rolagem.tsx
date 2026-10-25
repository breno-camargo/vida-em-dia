import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
export function Rolagem({ valores, inicial, valor, rotulo, escolher, formatar = String }: {
  valores: number[]; inicial: number; valor?: number; rotulo: string; escolher: (valor: number) => void; formatar?: (valor: number) => string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const inicio = useRef(valor ?? inicial)
  const pronta = useRef(false)
  const ultimoValor = useRef(valor ?? inicial)
  const id = useId()
  const [interno, definirInterno] = useState(Math.max(0, valores.indexOf(valor ?? inicial)))
  const [posicao, definirPosicao] = useState(interno)
  const salto = useRef<{ indice: number; behavior: ScrollBehavior } | null>(null)
  const selecionado = valor !== undefined ? Math.max(0, valores.indexOf(valor)) : interno
  // Mantém a extensão e os pontos de encaixe nativos sem montar milhares de botões.
  const primeiro = Math.max(0, posicao - 30)
  const fim = Math.min(valores.length, posicao + 31)
  const selecionar = (indice: number) => {
    if (valores[indice] === ultimoValor.current) return
    ultimoValor.current = valores[indice]
    definirInterno(indice)
    escolher(valores[indice])
  }
  const irPara = (indice: number, behavior: ScrollBehavior = 'auto') => {
    if (indice === posicao) ref.current?.scrollTo({ top: indice * 48, behavior })
    else salto.current = { indice, behavior }
    definirPosicao(indice)
    selecionar(indice)
  }
  useLayoutEffect(() => {
    const destino = salto.current
    if (!destino || !ref.current) return
    salto.current = null
    ref.current.scrollTo({ top: destino.indice * 48, behavior: destino.behavior })
  })

  useEffect(() => {
    const indice = Math.max(0, valores.indexOf(inicio.current))
    definirPosicao(indice)
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
      salto.current = { indice, behavior: 'auto' }
      definirPosicao(indice)
    }
  }, [valor, valores])

  return <div className="coluna-roda"><span>{rotulo}</span><div className="janela-roda"><div className="faixa-roda" aria-hidden="true" />
    <div ref={ref} className="roda" role="listbox" tabIndex={0} aria-label={rotulo} aria-activedescendant={`${id}-${selecionado}`} onKeyDown={e => {
      if (!['ArrowUp', 'ArrowDown', 'Home', 'End'].includes(e.key)) return
      e.preventDefault()
      const indice = e.key === 'Home' ? 0 : e.key === 'End' ? valores.length - 1 : Math.max(0, Math.min(valores.length - 1, selecionado + (e.key === 'ArrowDown' ? 1 : -1)))
      irPara(indice)
    }} onScroll={e => { if (!pronta.current) return; const indice = Math.max(0, Math.min(valores.length - 1, Math.round(e.currentTarget.scrollTop / 48))); definirPosicao(indice); selecionar(indice) }}>
      <div aria-hidden="true" style={{ height: primeiro * 48 }} />
      {valores.slice(primeiro, fim).map((item, offset) => { const indice = primeiro + offset; return <button type="button" role="option" tabIndex={-1} aria-selected={indice === selecionado} aria-posinset={indice + 1} aria-setsize={valores.length} id={`${id}-${indice}`} key={item} onClick={() => irPara(indice, window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth')}>{formatar(item)}</button> })}
      <div aria-hidden="true" style={{ height: (valores.length - fim) * 48 }} />
    </div></div></div>
}
