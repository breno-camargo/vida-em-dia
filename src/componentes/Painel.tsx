import { useEffect, useRef, type ReactNode } from 'react'
export function Painel({ titulo, fechar, children, centralizado = false, acao }: { titulo: string; fechar: () => void; children: ReactNode; centralizado?: boolean; acao?: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => { ref.current?.showModal(); const estilo = document.body.style.overflow; document.body.style.overflow = 'hidden'; return () => { document.body.style.overflow = estilo } }, [])
  return <dialog ref={ref} className={`painel-modal${centralizado ? ' painel-centralizado' : ''}`} aria-label={titulo} onCancel={fechar}>
    <header><h2>{titulo}</h2>{acao}<button type="button" className="botao-icone" onClick={fechar} aria-label="Fechar painel">✕</button></header>
    <div className="conteudo-modal">{children}</div>
  </dialog>
}
