import { expect, test } from 'vitest'
import { formatarDuracaoCardio, lerDuracaoCardio, partesDuracao } from './duracaoCardio'

test('minutos e segundos não são interpretados como decimal e sobrevivem à conversão', () => {
  const valor = lerDuracaoCardio('1', '33')
  expect(valor).toBe(1.55)
  expect(formatarDuracaoCardio(valor)).toBe('1 min 33 s')
  expect(partesDuracao(valor)).toEqual({ minutos: 1, segundos: 33 })
  expect(formatarDuracaoCardio(1.5)).toBe('1 min 30 s')
})

test('valide segundos, inteiros e duração positiva até 24 horas', () => {
  for (const [m, s] of [['1.33','0'],['1','60'],['','10'],['-1','30'],['0','0'],['1440','1'],['1e2','0']]) {
    expect(() => lerDuracaoCardio(m, s)).toThrow()
  }
  expect(lerDuracaoCardio('0', '1')).toBe(1 / 60)
  expect(lerDuracaoCardio('1440', '0')).toBe(1440)
})

test('somar sessões mantém precisão de segundos sem artefatos decimais', () => {
  const soma = lerDuracaoCardio('1', '33') + lerDuracaoCardio('0', '27')
  expect(formatarDuracaoCardio(soma)).toBe('2 min')
})
