import { useLiveQuery } from 'dexie-react-hooks'
import { tabela, banco } from './banco'
import { sessoesExercicio, desempenho, superados } from '../utilitarios/evolucao'
export function useHistorico() {
  return useLiveQuery(async () => ({
    treinos: await tabela('treinos').filter(t => !!t.fim && !t.apagado_em).toArray(),
    series: await tabela('series_treino').filter(s => !s.apagado_em).toArray(),
    exercicios: await tabela('exercicios').toArray(),
    itens: await tabela('treino_exercicios').filter(i => !i.apagado_em).toArray(),
  }))
}
export async function removerTreino(id: string) {
  const agora = new Date().toISOString()
  await banco.transaction('rw', tabela('treinos'), async () => { await tabela('treinos').update(id, { apagado_em: agora, atualizado_em: agora }) })
}
export async function restaurarTreino(id: string) { await tabela('treinos').update(id, { apagado_em: null, atualizado_em: new Date().toISOString() }) }

export async function recordesDoTreino(treinoId: string, exercicioId: string) {
  const treinos = await tabela('treinos').filter(t => !!t.fim && !t.apagado_em && t.id !== treinoId).toArray()
  const series = await tabela('series_treino').filter(s => !s.apagado_em).toArray()
  const atual = series.filter(s => s.treino_id === treinoId && s.exercicio_id === exercicioId)
  const sessoes = sessoesExercicio(treinos, series, exercicioId).filter(s => s.series.some(serie => serie.tipo !== 'aquecimento'))
  return superados(desempenho(atual), sessoes)
}
