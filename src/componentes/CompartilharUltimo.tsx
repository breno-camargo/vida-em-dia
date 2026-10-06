import { useHistorico } from '../dados/historico'
import { sessoesExercicio } from '../utilitarios/evolucao'
import { volumeSeries } from '../utilitarios/treino'
import { useMemo } from 'react'
import { CardCompartilhavel } from './CardCompartilhavel'
export function CompartilharUltimo({ id, fechar }: { id: string; fechar: () => void }) {
  const historico = useHistorico()
  const dados = useMemo(() => {
    if (!historico) return undefined
    const series = historico.series.filter(s => s.treino_id === id && s.concluida_em)
    const ids = [...new Set(series.map(s => s.exercicio_id))]
    return { volume: volumeSeries(series), exercicios: ids.length, series: series.length, recordes: ids.flatMap(ex => sessoesExercicio(historico.treinos, historico.series, ex).find(s => s.treino.id === id)?.recordes ?? []).length, grupos: [...new Set(ids.map(ex => historico.exercicios.find(e => e.id === ex)?.grupo_muscular).filter((g): g is string => !!g))] }
  }, [historico, id])
  const treino = historico?.treinos.find(t => t.id === id)
  if (!treino || !dados) return <p role="status">Preparando card…</p>
  return <CardCompartilhavel treino={treino} dados={dados} fechar={fechar} />
}
