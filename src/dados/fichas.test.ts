import 'fake-indexeddb/auto'
import Dexie from 'dexie'
import { beforeEach, expect, test } from 'vitest'
import { banco, tabela } from './banco'
import { iniciarBanco } from './configuracoes'
import { iniciarBiblioteca } from './biblioteca'
import { criarRegistro } from './repositorio'
import { apagarFicha, duplicarFicha, salvarFicha } from './fichas'

beforeEach(async () => { await banco.delete(); await banco.open(); await iniciarBanco(); await iniciarBiblioteca() })
test('inicialize 64 exercícios sem duplicar nem recriar os excluídos', async () => {
  const exercicio = (await tabela('exercicios').toArray())[0]
  await tabela('exercicios').update(exercicio.id, { apagado_em: new Date().toISOString() })
  await Promise.all([iniciarBiblioteca(), iniciarBiblioteca()])
  expect(await tabela('exercicios').count()).toBe(64)
  expect((await tabela('exercicios').get(exercicio.id))?.apagado_em).toBeTruthy()
})
test('duplique fichas com novos IDs e mantenha o planejamento independente', async () => {
  const ex = (await tabela('exercicios').toArray())[0]
  const ficha = { ...criarRegistro(), nome: 'A', ordem: 0 }
  const item = { ...criarRegistro(), ficha_id: ficha.id, exercicio_id: ex.id, ordem: 0, series_planejadas: 4, descanso_segundos: 120 }
  await salvarFicha(ficha, [item]); await duplicarFicha(ficha)
  const copia = (await tabela('fichas').toArray()).find(f => f.id !== ficha.id)!
  const copiados = await tabela('ficha_exercicios').where('ficha_id').equals(copia.id).toArray()
  expect(copiados[0].id).not.toBe(item.id)
  expect(copiados[0].series_planejadas).toBe(4)
  expect(copiados[0].descanso_segundos).toBe(120)
  await apagarFicha(ficha.id)
  expect((await tabela('fichas').get(ficha.id))?.apagado_em).toBeTruthy()
  expect((await tabela('ficha_exercicios').get(item.id))?.apagado_em).toBeTruthy()
  expect((await tabela('fichas').get(copia.id))?.apagado_em).toBeNull()
})
test('rejeite uma ficha inválida sem salvar parcialmente', async () => {
  const ex = (await tabela('exercicios').toArray())[0]
  const ficha = { ...criarRegistro(), nome: 'A', ordem: 0 }
  const item = { ...criarRegistro(), ficha_id: ficha.id, exercicio_id: ex.id, ordem: 0, series_planejadas: 0, descanso_segundos: 90 }
  await expect(salvarFicha(ficha, [item])).rejects.toThrow()
  expect(await tabela('fichas').count()).toBe(0)
})
test('migre registros da versão 1 preservando os dados e acrescentando descanso', async () => {
  const schema = Object.fromEntries(banco.tables.map(t => [t.name, [t.schema.primKey.src, ...t.schema.indexes.map(i => i.src)].join(', ')]))
  await banco.delete()
  const antigo = new Dexie('vida-em-dia')
  antigo.version(1).stores(schema)
  const ficha = { ...criarRegistro(), nome: 'Ficha anterior', ordem: 0 }
  const item = { ...criarRegistro(), ficha_id: ficha.id, exercicio_id: crypto.randomUUID(), ordem: 0, series_planejadas: 5 }
  await antigo.table('fichas').add(ficha)
  await antigo.table('ficha_exercicios').add(item)
  antigo.close(); await banco.open()
  expect((await tabela('fichas').get(ficha.id))?.nome).toBe('Ficha anterior')
  expect((await tabela('ficha_exercicios').get(item.id))?.series_planejadas).toBe(5)
  expect((await tabela('ficha_exercicios').get(item.id))?.descanso_segundos).toBe(90)
})
