import { useEffect, useRef } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { iconeExercicio } from '../utilitarios/iconeExercicio'
import { tabela } from '../dados/banco'
export function MiniaturaExercicio({ id, abrir, nome }: { id: string; abrir?: () => void; nome?: string }) {
  const exercicio = useLiveQuery(() => tabela('exercicios').get(id), [id])
  const foto = useLiveQuery(() => tabela('fotos').where('exercicio_id').equals(id).filter(f => !f.apagado_em && Boolean(f.miniatura_local)).first(), [id])
  const ref = useRef<HTMLImageElement>(null)
  useEffect(() => {
    if (!foto?.miniatura_local) return
    const url = URL.createObjectURL(foto.miniatura_local)
    if (ref.current) ref.current.src = url
    return () => URL.revokeObjectURL(url)
  }, [foto])
  const conteudo = foto ? <img ref={ref} alt="" /> : iconeExercicio(exercicio?.grupo_muscular, exercicio?.nome ?? nome, exercicio?.tipo)
  return abrir ? <button type="button" className="miniatura-exercicio" aria-label={`Ver detalhes de ${nome ?? 'exercício'}`} onClick={e => { e.preventDefault(); e.stopPropagation(); abrir() }}>{conteudo}</button> : <span className="miniatura-exercicio">{conteudo}</span>
}

