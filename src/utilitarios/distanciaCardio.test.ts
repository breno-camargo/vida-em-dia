import { expect, test } from 'vitest'
import { formatarDistanciaCardio, lerDistanciaCardio, partesDistancia } from './distanciaCardio'

test('distâncias solicitadas preservam precisão de um metro', () => {
  expect(lerDistanciaCardio('1', '753')).toBe(1.753)
  expect(lerDistanciaCardio('0', '754')).toBe(0.754)
  expect(partesDistancia(1.753)).toEqual({ km: 1, metros: 753 })
  expect(formatarDistanciaCardio(0.754)).toBe('754 m')
  expect(formatarDistanciaCardio(1.753)).toBe('1 km 753 m')
})
test('limites e entrada inválida não são arredondados ou aceitos como ausência', () => {
  for (const [km, m] of [['1,753','0'],['0','1000'],['-1','0'],['','0'],['1000','1'],['NaN','0']]) expect(() => lerDistanciaCardio(km,m)).toThrow()
  expect(lerDistanciaCardio('0','0')).toBe(0)
  expect(lerDistanciaCardio('1000','0')).toBe(1000)
})
test('total de distâncias converte metros excedentes sem perder precisão', () => {
  expect(formatarDistanciaCardio(0.754 + 0.754)).toBe('1 km 508 m')
})
