import { useEffect, useRef, type ReactNode } from 'react'
export function Painel({ titulo, fechar, children, centralizado = false }: { titulo: string; fechar: () => void; children: ReactNode; centralizado?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => { ref.current?.showModal(); const estilo = document.body.style.overflow; document.body.style.overflow = 'hidden'; return () => { document.body.style.overflow = estilo } }, [])
  return <dialog ref={ref} className={`painel-modal${centralizado ? ' painel-centralizado' : ''}`} aria-label={titulo} onCancel={fechar}>
    <header><h2>{titulo}</h2><button type="button" className="botao-icone" onClick={fechar} aria-label="Fechar painel">✕</button></header>
    <div className="conteudo-modal">{children}</div>
  </dialog>
}
