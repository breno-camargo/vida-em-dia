import { memo, useEffect, useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { iconeExercicio } from '../utilitarios/iconeExercicio'
import { tabela } from '../dados/banco'
import type { Exercicio } from '../dados/modelos'
import { grupoMuscularVisual } from '../dados/grupoMuscularVisual'
import { IndicadorMusculo } from './IndicadorMusculo'

const pendentes = new Map<Element, () => void>()
let observador: IntersectionObserver | undefined
function observar(elemento: Element, mostrar: () => void) {
  if (typeof IntersectionObserver === 'undefined') {
    const quadro = requestAnimationFrame(mostrar)
    return () => cancelAnimationFrame(quadro)
  }
  observador ??= new IntersectionObserver(entradas => {
    for (const entrada of entradas) if (entrada.isIntersecting) {
      const aplicar = pendentes.get(entrada.target)
      pendentes.delete(entrada.target); observador?.unobserve(entrada.target); aplicar?.()
    }
  }, { rootMargin: '160px' })
  pendentes.set(elemento, mostrar); observador.observe(elemento)
  return () => { pendentes.delete(elemento); observador?.unobserve(elemento) }
}
type Props = { id: string; abrir?: () => void; nome?: string; dados?: Exercicio }
function ConteudoMiniatura({ id, nome, dados }: Props) {
  const carregado = useLiveQuery(() => dados ? undefined : tabela('exercicios').get(id), [id, dados])
  const exercicio = dados ?? carregado
  return grupoMuscularVisual(exercicio?.grupo_muscular, exercicio?.nome ?? nome, exercicio?.tipo)
    ? <IndicadorMusculo grupo={exercicio?.grupo_muscular} nome={exercicio?.nome ?? nome} tipo={exercicio?.tipo} />
    : iconeExercicio(exercicio?.grupo_muscular, exercicio?.nome ?? nome, exercicio?.tipo)
}
export const MiniaturaExercicio = memo(function MiniaturaExercicio({ id, abrir, nome, dados }: Props) {
  const ref = useRef<HTMLElement | null>(null)
  const [visivel, definirVisivel] = useState(false)
  useEffect(() => { if (ref.current) return observar(ref.current, () => definirVisivel(true)) }, [])
  const conteudo = visivel ? <ConteudoMiniatura id={id} nome={nome} dados={dados} /> : iconeExercicio(dados?.grupo_muscular, dados?.nome ?? nome, dados?.tipo)
  const atribuir = (elemento: HTMLElement | null) => { ref.current = elemento }
  return abrir ? <button ref={atribuir} type="button" className="miniatura-exercicio" aria-label={`Ver detalhes de ${nome ?? 'exercício'}`} onClick={e => { e.preventDefault(); e.stopPropagation(); abrir() }}>{conteudo}</button> : <span ref={atribuir} className="miniatura-exercicio">{conteudo}</span>
})

