import { useEffect, useRef } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Dumbbell } from 'lucide-react'
import { tabela } from '../dados/banco'
export function MiniaturaExercicio({ id }: { id: string }) {
  const foto = useLiveQuery(() => tabela('fotos').where('exercicio_id').equals(id).filter(f => !f.apagado_em && Boolean(f.miniatura_local)).first(), [id])
  const ref = useRef<HTMLImageElement>(null)
  useEffect(() => {
    if (!foto?.miniatura_local) return
    const url = URL.createObjectURL(foto.miniatura_local)
    if (ref.current) ref.current.src = url
    return () => URL.revokeObjectURL(url)
  }, [foto])
  return <span className="miniatura-exercicio">{foto ? <img ref={ref} alt="" /> : <Dumbbell size={28} aria-hidden="true" />}</span>
}
