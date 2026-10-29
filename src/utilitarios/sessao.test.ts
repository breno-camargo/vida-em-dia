import { expect, test } from 'vitest'
import { duracaoSessao, horarioSessao } from './sessao'

test('não mostre zero minutos para uma sessão curta válida', () => {
  expect(duracaoSessao({ inicio: '2026-10-16T10:00:00Z', fim: '2026-10-16T10:00:20Z', duracao_minutos: 0 })).toBe('00:20')
  expect(duracaoSessao({ inicio: '2026-10-16T10:00:00Z', fim: '2026-10-16T10:01:00Z' })).toBe('01:00')
})

test('não invente duração quando faltam informações válidas', () => {
  expect(duracaoSessao({ inicio: 'inválido', duracao_minutos: 0 })).toBe('Duração não informada')
  expect(duracaoSessao({ inicio: 'inválido', duracao_minutos: 45 })).toBe('45:00')
  expect(horarioSessao({ inicio: 'inválido' })).toBe('')
})

test('preserva segundos sem arredondar para o minuto seguinte', () => {
  expect(duracaoSessao({ inicio: '2026-10-18T10:00:00Z', fim: '2026-10-18T10:00:59Z' })).toBe('00:59')
  expect(duracaoSessao({ inicio: '2026-10-18T10:00:00Z', fim: '2026-10-18T10:48:37Z' })).toBe('48:37')
  expect(duracaoSessao({ inicio: '2026-10-18T10:00:00Z', fim: '2026-10-18T11:05:09Z' })).toBe('1:05:09')
})

test('mostra horas sem acumular minutos, inclusive nos treinos antigos', () => {
  expect(duracaoSessao({ inicio: '2026-10-18T10:00:00Z', fim: '2026-10-18T10:59:59Z' })).toBe('59:59')
  expect(duracaoSessao({ inicio: '2026-10-18T10:00:00Z', fim: '2026-10-18T11:00:00Z' })).toBe('1:00:00')
  expect(duracaoSessao({ inicio: '2026-10-18T10:00:00Z', fim: '2026-10-18T12:00:00Z' })).toBe('2:00:00')
  expect(duracaoSessao({ inicio: '2026-10-18T10:00:00Z', fim: '2026-10-18T12:07:09Z' })).toBe('2:07:09')
  expect(duracaoSessao({ inicio: 'inválido', duracao_minutos: 187 })).toBe('3:07:00')
})
