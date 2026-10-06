import 'fake-indexeddb/auto'
import { beforeEach, expect, test } from 'vitest'
import { banco, tabela } from './banco'
import { iniciarBanco } from './configuracoes'
import { iniciarBiblioteca } from './biblioteca'
import { iniciarTreino, treinoAtivo, concluirSerie } from './treinos'
import { criarRegistro } from './repositorio'
import { salvarFicha } from './fichas'
import { cargaTotal, volumeSeries, segundosRestantes } from '../utilitarios/treino'

beforeEach(async () => { await banco.delete(); await banco.open(); await iniciarBanco(); await iniciarBiblioteca() })
async function preparar() {
  const ex = (await tabela('exercicios').toArray()).find(e => e.tipo === 'forca')!
  const ficha = { ...criarRegistro(), nome: 'A', ordem: 0 }
  await salvarFicha(ficha, [{ ...criarRegistro(), ficha_id: ficha.id, exercicio_id: ex.id, ordem: 0, series_planejadas: 2, descanso_segundos: 120 }])
  return { ficha, ex }
}
test('inicie um único treino e preserve o andamento ao reabrir', async () => {
  const { ficha } = await preparar()
  const ids = await Promise.all([iniciarTreino(ficha.id), iniciarTreino(ficha.id)])
  expect(ids[0]).toBe(ids[1])
  expect(await tabela('treinos').count()).toBe(1)
  expect(await tabela('series_treino').count()).toBe(2)
  banco.close(); await banco.open()
  expect((await treinoAtivo())?.id).toBe(ids[0])
})
test('salve carga por lado e descanso; a última série não dispara outro descanso', async () => {
  const { ficha } = await preparar(); const id = await iniciarTreino(ficha.id)
  const series = await tabela('series_treino').where('treino_id').equals(id).sortBy('numero_serie')
  await concluirSerie({ ...series[0], peso_digitado: 30, modo_carga: 'por_lado', peso_barra: 20, repeticoes: 10 })
  expect((await tabela('series_treino').get(series[0].id))?.peso_total).toBe(80)
  const fim = (await tabela('treinos').get(id))!.descanso_fim!
  expect(segundosRestantes(fim)).toBeGreaterThanOrEqual(119)
  await concluirSerie(series[0])
  expect((await tabela('treinos').get(id))?.descanso_fim).toBe(fim)
  await concluirSerie(series[1])
  expect((await tabela('treinos').get(id))?.descanso_fim).toBeNull()
})
test('exclua aquecimento do volume e some reduções de drop set pela carga total', async () => {
  const { ficha } = await preparar(); const id = await iniciarTreino(ficha.id)
  const series = await tabela('series_treino').where('treino_id').equals(id).sortBy('numero_serie')
  await concluirSerie({ ...series[0], tipo: 'aquecimento', peso_digitado: 100, repeticoes: 10 })
  expect(segundosRestantes((await tabela('treinos').get(id))!.descanso_fim!)).toBeLessThanOrEqual(30)
  await concluirSerie({ ...series[1], tipo: 'dropset', modo_carga: 'por_lado', peso_barra: 20, peso_digitado: 30, repeticoes: 10, reducoes: [{ peso_digitado: 20, repeticoes: 5 }] })
  expect(volumeSeries(await tabela('series_treino').where('treino_id').equals(id).toArray())).toBe(1100)
})
test('preencha a próxima sessão com o desempenho da última sessão finalizada', async () => {
  const { ficha } = await preparar(); const id = await iniciarTreino(ficha.id)
  const series = await tabela('series_treino').where('treino_id').equals(id).sortBy('numero_serie')
  await concluirSerie({ ...series[0], peso_digitado: 25, repeticoes: 12 })
  await tabela('treinos').update(id, { fim: new Date().toISOString() })
  const novo = await iniciarTreino(ficha.id)
  const planejadas = await tabela('series_treino').where('treino_id').equals(novo).toArray()
  expect(planejadas.every(s => s.peso_digitado === 25 && s.repeticoes === 12 && !s.concluida_em)).toBe(true)
})
test('calcule tempo pelo término mesmo após suspender a execução', () => {
  expect(segundosRestantes('2026-10-05T12:00:00Z', Date.parse('2026-10-05T12:00:20Z'))).toBe(-20)
  expect(cargaTotal(30, 'por_lado', 20)).toBe(80)
})
