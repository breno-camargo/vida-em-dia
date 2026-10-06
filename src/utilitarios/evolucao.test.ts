import { expect, test } from 'vitest'
import { desempenho, epley, sessoesExercicio, sugestao, estagnado } from './evolucao'
import { criarRegistro } from '../dados/repositorio'
import type { SerieTreino, Treino } from '../dados/modelos'
const treino = (id: string, inicio: string): Treino => ({ ...criarRegistro(), id, inicio, fim: inicio, data: inicio.slice(0,10), observacao: '' })
const serie = (treino_id: string, peso: number, reps = 10): SerieTreino => ({ ...criarRegistro(), treino_id, exercicio_id: 'ex', numero_serie: 1, tipo: 'normal', peso_digitado: peso, peso_total: peso, repeticoes: reps, concluida_em: '2026-10-06T12:00:00Z', recorde: false })
test('calcule Epley, volume total por lado e exclusão dos aquecimentos', () => {
  const s = { ...serie('a', 80), tipo: 'dropset' as const, modo_carga: 'por_lado' as const, peso_barra: 20, reducoes: [{ peso_digitado: 20, repeticoes: 5 }] }
  const resultado = desempenho([s, { ...serie('a', 500), tipo: 'aquecimento' }, { ...serie('a', 1000), apagado_em: 'agora' }, { ...serie('a', 200), concluida_em: undefined }])
  expect(resultado.volume).toBe(1100)
  expect(resultado.carga).toBe(80)
  expect(resultado.rm).toBeCloseTo(epley(80, 10))
})
test('recalcule recordes e histórico cronológico sem incluir sessões excluídas', () => {
  const treinos = [treino('b', '2026-10-06T12:00:00Z'), treino('a', '2026-10-01T12:00:00Z'), { ...treino('c', '2026-10-04T12:00:00Z'), apagado_em: 'agora' }]
  const series = [serie('a', 20), serie('b', 25), serie('c', 200)]
  const sessoes = sessoesExercicio(treinos, series, 'ex')
  expect(sessoes.map(s => s.treino.id)).toEqual(['a','b'])
  expect(sessoes[0].recordes).toEqual([])
  expect(sessoes[1].recordes).toEqual(['carga','volume','rm'])
  expect(sessoesExercicio([treinos[0]], series, 'ex')[0].recordes).toEqual([])
})
test('não sugira progressão por aquecimentos ou séries normais pendentes', () => {
  expect(sugestao([{ ...serie('a', 20, 30), tipo: 'aquecimento' }],12)).toBe(false)
  expect(sugestao([serie('a',20,12), { ...serie('a',20,12), concluida_em: undefined }],12)).toBe(false)
  expect(sugestao([serie('a',20,12), serie('a',20,13)],12)).toBe(true)
})
test('avise estagnação somente com quatro semanas de sessões sem aumento', () => {
  const sessoes = [{ treino: treino('a','2026-09-01T12:00:00Z'), carga: 20 }, { treino: treino('b','2026-10-01T12:00:00Z'), carga: 20 }]
  expect(estagnado(sessoes, Date.parse('2026-10-06T12:00:00Z'))).toBe(true)
  expect(estagnado([{ ...sessoes[0] }, { ...sessoes[1], carga: 25 }], Date.parse('2026-10-06T12:00:00Z'))).toBe(false)
  expect(estagnado(sessoes, Date.parse('2026-12-06T12:00:00Z'))).toBe(false)
})
