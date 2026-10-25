import 'fake-indexeddb/auto'
import { beforeEach, expect, test } from 'vitest'
import { banco, tabela } from './banco'
import { iniciarBanco } from './configuracoes'
import { criarRegistro } from './repositorio'
import { recordesDoTreino } from './historico'
import { desempenho, sessoesExercicio, superados } from '../utilitarios/evolucao'
import type { SerieTreino, Treino } from './modelos'

beforeEach(async () => { await banco.delete(); await banco.open(); await iniciarBanco() })
async function treino(id: string, extra: Partial<Treino> = {}) {
  await tabela('treinos').put({ ...criarRegistro(), id, data: '2026-10-25', inicio: '2026-10-25T10:00:00Z', observacao: '', fim: id === 'atual' ? undefined : '2026-10-25T11:00:00Z', ...extra })
}
async function serie(treino_id: string, extra: Partial<SerieTreino> = {}) {
  await tabela('series_treino').put({ ...criarRegistro(), treino_id, exercicio_id: 'exercicio', numero_serie: 1, tipo: 'normal', modo_carga: 'total', peso_digitado: 20, peso_total: 20, repeticoes: 10, recorde: false, concluida_em: '2026-10-25T10:10:00Z', ...extra })
}
async function conferir(esperado: string[]) {
  const treinos = await tabela('treinos').filter(t => !!t.fim && !t.apagado_em && t.id !== 'atual').toArray()
  const series = await tabela('series_treino').filter(s => !s.apagado_em).toArray()
  const referencia = superados(desempenho(series.filter(s => s.treino_id === 'atual' && s.exercicio_id === 'exercicio')), sessoesExercicio(treinos, series, 'exercicio').filter(s => s.series.some(serie => serie.tipo !== 'aquecimento')))
  expect(await recordesDoTreino('atual', 'exercicio')).toEqual(referencia)
  expect(referencia).toEqual(esperado)
}
test('consulta por exercício preserva recordes e ignora outras sessões, exclusões e séries pendentes', async () => {
  await treino('antigo'); await treino('atual'); await serie('antigo'); await serie('atual', { peso_digitado: 30, peso_total: 30 })
  await treino('removido', { apagado_em: '2026-10-25' }); await serie('removido', { peso_total: 999 })
  await treino('aberto', { fim: undefined }); await serie('aberto', { peso_total: 999 })
  await serie('antigo', { peso_total: 999, concluida_em: undefined })
  await serie('antigo', { peso_total: 999, apagado_em: '2026-10-25' })
  await serie('antigo', { exercicio_id: 'outro-exercicio', peso_total: 999 })
  await conferir(['carga', 'volume', 'rm'])
})
test('peso corporal continua comparando repetições, inclusive com histórico sem treino correspondente', async () => {
  await treino('antigo'); await treino('atual')
  await serie('antigo', { modo_carga: 'peso_corporal', peso_total: 0 })
  await serie('atual', { modo_carga: 'peso_corporal', peso_total: 0, repeticoes: 12 })
  await serie('inexistente', { modo_carga: 'peso_corporal', repeticoes: 999 })
  await conferir(['reps'])
})
test('histórico composto só de aquecimento não cria primeiro recorde', async () => {
  await treino('antigo'); await treino('atual'); await serie('antigo', { tipo: 'aquecimento' }); await serie('atual')
  await conferir([])
})
test('drop set mantém o volume e a força estimada das reduções', async () => {
  await treino('antigo'); await treino('atual'); await serie('antigo')
  await serie('atual', { tipo: 'dropset', reducoes: [{ peso_digitado: 20, repeticoes: 20 }] })
  await conferir(['volume', 'rm'])
})
