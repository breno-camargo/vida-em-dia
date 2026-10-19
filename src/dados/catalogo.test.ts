import 'fake-indexeddb/auto'
import { beforeEach, expect, test } from 'vitest'
import { banco, tabela } from './banco'
import { iniciarBanco } from './configuracoes'
import { ampliarBiblioteca, iniciarBiblioteca } from './biblioteca'
import { criarRegistro } from './repositorio'
import { buscarExercicios } from '../componentes/FiltrosExercicios'

beforeEach(async () => { await banco.delete(); await banco.open(); await iniciarBanco(); await iniciarBiblioteca() })

test('catálogo inicial tem os mesmos IDs em instalações novas e preserva cadastro existente', async () => {
 const antes = (await tabela('exercicios').toArray()).map(e => [e.nome,e.id]).sort()
 await banco.delete(); await banco.open(); await iniciarBanco(); await iniciarBiblioteca()
 expect((await tabela('exercicios').toArray()).map(e => [e.nome,e.id]).sort()).toEqual(antes)
 const ex = (await tabela('exercicios').toArray())[0]
 await tabela('exercicios').update(ex.id,{nome:'Meu exercício',apagado_em:new Date().toISOString()})
 const config = (await tabela('configuracoes').toArray())[0]
 await tabela('configuracoes').update(config.id,{biblioteca_inicializada:false})
 await iniciarBiblioteca()
 expect((await tabela('exercicios').get(ex.id))?.nome).toBe('Meu exercício')
 expect(await tabela('exercicios').count()).toBe(antes.length)
})

test('amplie sem duplicar, sobrescrever edições ou ressuscitar exclusões', async () => {
  const criado = { ...(await tabela('exercicios').toArray())[0], ...criarRegistro(), nome: 'SUPINO INCLINADO COM BARRA', nota_fixa: 'Minha nota', apagado_em: new Date().toISOString() }
  await tabela('exercicios').add(criado)
  const quantidade = await ampliarBiblioteca()
  expect(quantidade).toBeGreaterThan(300)
  expect(await ampliarBiblioteca()).toBe(0)
  expect(await tabela('exercicios').get(criado.id)).toEqual(criado)
  const agachamento = await tabela('exercicios').where('nome').equals('Agachamento frontal').first()
  await tabela('exercicios').update(agachamento!.id, { nome: 'Minha variação frontal' })
  expect(await ampliarBiblioteca()).toBe(0)
})

test('gere os mesmos IDs em aparelhos diferentes e respeite aliases', async () => {
  const modelo = (await tabela('exercicios').toArray())[0]
  await tabela('exercicios').add({ ...modelo, ...criarRegistro(), nome: 'Bodyweight squat' })
  await ampliarBiblioteca()
  expect(await tabela('exercicios').where('nome').equals('Agachamento com peso corporal').count()).toBe(0)
  const id = (await tabela('exercicios').where('nome').equals('Agachamento frontal').first())!.id
  await banco.delete(); await banco.open(); await iniciarBanco(); await iniciarBiblioteca(); await ampliarBiblioteca()
  expect((await tabela('exercicios').where('nome').equals('Agachamento frontal').first())!.id).toBe(id)
  expect((await tabela('exercicios').where('nome').equals('Prancha lateral').first())?.modo_carga).toBe('peso_corporal')
  expect((await tabela('exercicios').where('nome').equals('Corrida').first())?.tipo).toBe('cardio')
})

test('busque termos fora de ordem, sem acentos, por equipamento e músculo', async () => {
  await ampliarBiblioteca()
  const lista = await tabela('exercicios').filter(e => !e.apagado_em).toArray()
  expect(buscarExercicios(lista, 'barra supino inclinado').some(e => e.nome === 'Supino inclinado com barra')).toBe(true)
  expect(buscarExercicios(lista, 'biceps').every(e => e.grupo_muscular === 'Bíceps' || /bíceps/i.test(e.nome))).toBe(true)
  expect(buscarExercicios(lista, '  inexistente  ')).toHaveLength(0)
})
