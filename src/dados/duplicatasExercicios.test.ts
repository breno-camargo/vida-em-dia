import { expect, test } from 'vitest'
import type { Exercicio } from './modelos'
import { exerciciosDisponiveis, exerciciosUnicos } from './duplicatasExercicios'

const ex: Exercicio = { id: 'a', user_id: null, criado_em: '2026-10-16T10:00:00Z', atualizado_em: '2026-10-16T10:00:00Z', apagado_em: null,
  nome: 'Agachamento livre', tipo: 'forca', grupo_muscular: 'Pernas', equipamento: '', descanso_padrao_segundos: 90,
  modo_carga: 'total', peso_barra: 20, nota_fixa: '', como_fazer: '', musculos: 'Pernas', origem: 'manual' }

test('catálogos equivalentes de dois aparelhos aparecem uma vez sem alterar registros', () => {
  const lista = [ex, { ...ex, id: 'b', user_id: 'conta', criado_em: '2026-10-15T10:00:00Z' }]
  const antes = structuredClone(lista)
  expect(exerciciosUnicos(lista).map(e => e.id)).toEqual(['a'])
  expect(exerciciosUnicos([...lista].reverse()).map(e => e.id)).toEqual(['a'])
  expect(lista).toEqual(antes)
})

test('não esconda notas, equipamento, carga ou instruções diferentes', () => {
  const lista = [ex, { ...ex, id: 'b', nota_fixa: 'Minha adaptação' }, { ...ex, id: 'c', equipamento: 'Smith' },
    { ...ex, id: 'd', modo_carga: 'peso_corporal' as const }, { ...ex, id: 'e', como_fazer: 'Instruções pessoais' }]
  expect(exerciciosUnicos(lista)).toHaveLength(5)
})

test('não ofereça outra cópia se o ID equivalente já estiver na ficha', () => {
  const lista = [ex, { ...ex, id: 'b' }, { ...ex, id: 'c', nome: 'Leg press' }]
  expect(exerciciosDisponiveis(lista, ['b']).map(e => e.id)).toEqual(['c'])
  expect(exerciciosUnicos([{ ...ex, apagado_em: '2026-10-16T12:00:00Z' }, { ...ex, id: 'b' }]).map(e => e.id)).toEqual(['b'])
})
