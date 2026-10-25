import { useRef, type ReactNode } from 'react'
import { useTransicaoSuave } from '../hooks/useTransicaoSuave'

// Anima só a opacidade; a troca não remonta filhos nem desloca campos/foco.
export function TransicaoConteudo({ chave, children }: { chave: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  useTransicaoSuave(ref, chave)
  return <div ref={ref} className="conteudo-alternado">{children}</div>
}
