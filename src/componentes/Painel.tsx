import { useEffect, useRef, type ReactNode } from 'react'
export function Painel({ titulo, fechar, children, centralizado = false, acao, fechamentoLivre = true }: { titulo: string; fechar: () => void; children: ReactNode; centralizado?: boolean; acao?: ReactNode; fechamentoLivre?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null)
  const arrasto = useRef<{ id: number; inicio: number; distancia: number; tempo: number } | null>(null)
  const quadro = useRef<number | null>(null)
  const restaurar = () => {
    if (quadro.current !== null) cancelAnimationFrame(quadro.current)
    quadro.current = null
    if (ref.current) ref.current.style.transform = ''
    arrasto.current = null
  }
  useEffect(() => { ref.current?.showModal(); ref.current?.focus({ preventScroll: true }); const estilo = document.body.style.overflow; document.body.style.overflow = 'hidden'; return () => { document.body.style.overflow = estilo } }, [])
  return <dialog ref={ref} tabIndex={-1} className={`painel-modal${centralizado ? ' painel-centralizado' : ''}`} aria-label={titulo} onCancel={e => { e.preventDefault(); if (fechamentoLivre) fechar() }}>
    <div className={`topo-painel${!centralizado && fechamentoLivre ? ' topo-arrastavel' : ''}`}
      onPointerDown={e => {
        if (centralizado || !fechamentoLivre || !e.isPrimary || e.button !== 0) return
        const alvo = e.target as Element
        if (alvo.closest('button,a,input,select,textarea,[role=button]') && !alvo.closest('.alca-painel')) return
        // O gesto assume o controle mesmo se a animação de entrada ainda não terminou.
        ref.current?.getAnimations().forEach(animacao => {
          if ('animationName' in animacao && animacao.animationName === 'subir-painel') animacao.cancel()
        })
        e.preventDefault()
        arrasto.current = { id: e.pointerId, inicio: e.clientY, distancia: 0, tempo: performance.now() }
        e.currentTarget.setPointerCapture(e.pointerId)
      }} onPointerMove={e => {
        const gesto = arrasto.current
        if (!gesto || gesto.id !== e.pointerId) return
        gesto.distancia = Math.max(0, e.clientY - gesto.inicio)
        if (quadro.current === null) quadro.current = requestAnimationFrame(() => {
          quadro.current = null
          if (ref.current && arrasto.current) ref.current.style.transform = `translateY(${arrasto.current.distancia}px)`
        })
      }} onPointerUp={e => {
        if (arrasto.current?.id !== e.pointerId) return
        const distancia = Math.max(arrasto.current.distancia, e.clientY - arrasto.current.inicio)
        const velocidade = distancia / Math.max(1, performance.now() - arrasto.current.tempo)
        const deveFechar = distancia >= 40 || (distancia >= 18 && velocidade > 0.3)
        restaurar()
        if (deveFechar) fechar()
      }} onPointerCancel={restaurar} onLostPointerCapture={restaurar}>
    {!centralizado && fechamentoLivre && <button type="button" className="alca-painel" aria-label="Arraste para baixo para fechar o painel" onClick={e => { if (e.detail === 0) fechar() }}><span aria-hidden="true" /></button>}
    <header><h2>{titulo}</h2>{acao}{fechamentoLivre && <button type="button" className="botao-icone" onClick={fechar} aria-label="Fechar painel">✕</button>}</header></div>
    <div className="conteudo-modal">{children}</div>
  </dialog>
}

