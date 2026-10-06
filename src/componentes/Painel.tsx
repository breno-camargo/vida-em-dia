import { useEffect, useRef, type ReactNode } from 'react'
export function Painel({ titulo, fechar, children, centralizado = false, acao }: { titulo: string; fechar: () => void; children: ReactNode; centralizado?: boolean; acao?: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null)
  const arrasto = useRef<{ id: number; inicio: number; distancia: number } | null>(null)
  const restaurar = () => {
    if (ref.current) ref.current.style.transform = ''
    arrasto.current = null
  }
  useEffect(() => { ref.current?.showModal(); const estilo = document.body.style.overflow; document.body.style.overflow = 'hidden'; return () => { document.body.style.overflow = estilo } }, [])
  return <dialog ref={ref} className={`painel-modal${centralizado ? ' painel-centralizado' : ''}`} aria-label={titulo} onCancel={fechar}>
    {!centralizado && <button type="button" className="alca-painel" aria-label="Arraste para baixo para fechar o painel" onClick={e => { if (e.detail === 0) fechar() }}
      onPointerDown={e => {
        if (!e.isPrimary || e.button !== 0) return
        arrasto.current = { id: e.pointerId, inicio: e.clientY, distancia: 0 }
        e.currentTarget.setPointerCapture(e.pointerId)
      }} onPointerMove={e => {
        const gesto = arrasto.current
        if (!gesto || gesto.id !== e.pointerId) return
        gesto.distancia = Math.max(0, e.clientY - gesto.inicio)
        if (ref.current) ref.current.style.transform = `translateY(${gesto.distancia}px)`
      }} onPointerUp={e => {
        if (arrasto.current?.id !== e.pointerId) return
        const deveFechar = arrasto.current.distancia >= 80
        restaurar()
        if (deveFechar) fechar()
      }} onPointerCancel={restaurar} onLostPointerCapture={restaurar}><span aria-hidden="true" /></button>}
    <header><h2>{titulo}</h2>{acao}<button type="button" className="botao-icone" onClick={fechar} aria-label="Fechar painel">✕</button></header>
    <div className="conteudo-modal">{children}</div>
  </dialog>
}
