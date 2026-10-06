import 'fake-indexeddb/auto'
import { beforeEach, expect, test } from 'vitest'
import { banco, tabela } from './banco'
import { iniciarBanco } from './configuracoes'
import { criarRegistro, repositorio } from './repositorio'
import { dataLocal } from '../utilitarios/data'

beforeEach(async () => { await banco.delete(); await banco.open() })
test('crie todas as tabelas e inicialize configurações uma única vez', async () => {
  expect(banco.tables).toHaveLength(16)
  await Promise.all([iniciarBanco(), iniciarBanco()])
  expect(await tabela('configuracoes').count()).toBe(1)
  expect((await tabela('configuracoes').toArray())[0].user_id).toBeNull()
})
test('mantenha registros apagados e os dados após reabrir o banco', async () => {
  const fichas = repositorio('fichas')
  const ficha = { ...criarRegistro(), nome: 'Ficha A', ordem: 1 }
  await fichas.salvar(ficha)
  banco.close(); await banco.open()
  expect((await fichas.listar())[0].nome).toBe('Ficha A')
  await fichas.apagar(ficha.id)
  expect(await fichas.listar()).toEqual([])
  expect((await fichas.obter(ficha.id))?.apagado_em).toBeTruthy()
  expect(await tabela('fichas').count()).toBe(1)
})
test('guarde a data do calendário no fuso local', () => {
  expect(dataLocal(new Date(2026, 0, 2, 23, 59))).toBe('2026-01-02')
})
