import 'fake-indexeddb/auto'
import Dexie from 'dexie'
import { beforeEach, expect, test } from 'vitest'
import { banco, tabela } from './banco'
import { iniciarBanco } from './configuracoes'
import { iniciarBiblioteca } from './biblioteca'
import { iniciarTreino, treinoAtivo, concluirSerie, aplicarValoresProximas } from './treinos'
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
test('inicie a ficha escolhida no lugar de um treino livre vazio', async () => {
  const { ficha } = await preparar()
  const livre = await iniciarTreino()
  const id = await iniciarTreino(ficha.id)
  expect(id).not.toBe(livre)
  expect((await treinoAtivo())?.ficha_id).toBe(ficha.id)
  expect((await tabela('treinos').get(id))?.titulo).toBe('A')
  expect(await tabela('series_treino').where('treino_id').equals(id).count()).toBe(2)
  expect((await tabela('treinos').get(livre))?.apagado_em).toBeTruthy()
})
test('avise sobre outro treino em andamento sem substituir seus registros', async () => {
  const { ficha } = await preparar()
  const livre = await iniciarTreino()
  await tabela('treinos').update(livre, { observacao: 'Meu treino de hoje' })
  await expect(iniciarTreino(ficha.id)).rejects.toThrow('Há um treino em andamento')
  expect((await treinoAtivo())?.id).toBe(livre)
  expect((await tabela('treinos').get(livre))?.observacao).toBe('Meu treino de hoje')
  expect(await tabela('treinos').count()).toBe(1)
})
test('exclua aquecimento do volume e some reduções de drop set pela carga total', async () => {
  const { ficha } = await preparar(); const id = await iniciarTreino(ficha.id)
  const series = await tabela('series_treino').where('treino_id').equals(id).sortBy('numero_serie')
  await concluirSerie({ ...series[0], tipo: 'aquecimento', peso_digitado: 100, repeticoes: 10 })
  expect(segundosRestantes((await tabela('treinos').get(id))!.descanso_fim!)).toBeLessThanOrEqual(30)
  await concluirSerie({ ...series[1], tipo: 'dropset', modo_carga: 'por_lado', peso_barra: 20, peso_digitado: 30, repeticoes: 10, reducoes: [{ peso_digitado: 20, repeticoes: 5 }] })
  expect(volumeSeries(await tabela('series_treino').where('treino_id').equals(id).toArray())).toBe(1100)
})
test('mantenha o descanso entre exercícios enquanto houver séries pendentes', async () => {
  const { ficha } = await preparar()
  const outro = (await tabela('exercicios').toArray()).find(e => e.tipo === 'forca' && e.grupo_muscular === 'Costas')!
  await tabela('ficha_exercicios').add({ ...criarRegistro(), ficha_id: ficha.id, exercicio_id: outro.id, ordem: 1, series_planejadas: 1, descanso_segundos: 60 })
  const id = await iniciarTreino(ficha.id)
  const series = await tabela('series_treino').where('treino_id').equals(id).toArray()
  for (const serie of series.filter(s => s.exercicio_id !== outro.id)) await concluirSerie(serie)
  expect((await tabela('treinos').get(id))?.descanso_fim).toBeTruthy()
  await concluirSerie(series.find(s => s.exercicio_id === outro.id)!)
  expect((await tabela('treinos').get(id))?.descanso_fim).toBeNull()
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
test('aplique valores às próximas séries pendentes sem alterar as concluídas', async () => {
  const { ficha } = await preparar(); const id = await iniciarTreino(ficha.id)
  const series = await tabela('series_treino').where('treino_id').equals(id).sortBy('numero_serie')
  await concluirSerie({ ...series[1], peso_digitado: 10, repeticoes: 8 })
  const extra = { ...series[0], ...criarRegistro(), numero_serie: 3 }
  await tabela('series_treino').add(extra)
  await aplicarValoresProximas({ ...series[0], peso_digitado: 25, repeticoes: 12, modo_carga: 'por_lado', peso_barra: 20 })
  expect((await tabela('series_treino').get(extra.id))?.peso_total).toBe(70)
  expect((await tabela('series_treino').get(extra.id))?.repeticoes).toBe(12)
  expect((await tabela('series_treino').get(series[1].id))?.peso_total).toBe(10)
  expect((await tabela('series_treino').get(series[1].id))?.repeticoes).toBe(8)
})
test('preserve sessões e cargas anteriores ao migrar a versão 2 para 3', async () => {
  const schema = Object.fromEntries(banco.tables.filter(t => t.name !== 'treino_exercicios').map(t => [t.name, [t.schema.primKey.src, ...t.schema.indexes.map(i => i.src)].join(', ')]))
  await banco.delete()
  const antigo = new Dexie('vida-em-dia'); antigo.version(2).stores(schema)
  const treino = { ...criarRegistro(), data: '2026-10-05', inicio: new Date().toISOString(), observacao: 'Registro antigo' }
  const serie = { ...criarRegistro(), treino_id: treino.id, exercicio_id: crypto.randomUUID(), numero_serie: 1, tipo: 'normal', peso_digitado: 30, peso_total: 30, repeticoes: 10, recorde: false }
  await antigo.table('treinos').add(treino); await antigo.table('series_treino').add(serie)
  antigo.close(); await banco.open()
  expect((await tabela('treinos').get(treino.id))?.observacao).toBe('Registro antigo')
  expect((await tabela('series_treino').get(serie.id))?.peso_total).toBe(30)
  expect((await tabela('series_treino').get(serie.id))?.modo_carga).toBe('total')
  expect(await tabela('treino_exercicios').count()).toBe(0)
})

test('salve o treino anterior ao iniciar outro e preserve as séries', async () => {
  const { ficha } = await preparar()
  const anterior = await iniciarTreino(ficha.id)
  const series = await tabela('series_treino').where('treino_id').equals(anterior).toArray()
  await concluirSerie(series[0])
  const novo = await iniciarTreino(undefined, true)
  expect(novo).not.toBe(anterior)
  expect((await tabela('treinos').get(anterior))?.fim).toBeTruthy()
  expect((await treinoAtivo())?.id).toBe(novo)
  expect((await tabela('series_treino').get(series[0].id))?.concluida_em).toBeTruthy()
  expect((await tabela('series_treino').get(series[1].id))?.concluida_em).toBeUndefined()
})
