import { useLiveQuery } from 'dexie-react-hooks'
import { tabela, banco } from './banco'
import { desempenho, superados } from '../utilitarios/evolucao'
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
  const series = await tabela('series_treino').where('exercicio_id').equals(exercicioId).filter(s => !s.apagado_em && !!s.concluida_em).toArray()
  const atual = series.filter(s => s.treino_id === treinoId)
  const ids = [...new Set(series.filter(s => s.treino_id !== treinoId).map(s => s.treino_id))]
  const treinos = await tabela('treinos').bulkGet(ids)
  const finalizados = new Set(treinos.filter(t => t && !!t.fim && !t.apagado_em).map(t => t!.id))
  const grupos = new Map<string, typeof series>()
  for (const serie of series) {
    if (!finalizados.has(serie.treino_id)) continue
    const grupo = grupos.get(serie.treino_id) ?? []
    grupo.push(serie)
    grupos.set(serie.treino_id, grupo)
  }
  const anteriores = [...grupos.values()].filter(grupo => grupo.some(s => s.tipo !== 'aquecimento')).map(desempenho)
  return superados(desempenho(atual), anteriores)
}
