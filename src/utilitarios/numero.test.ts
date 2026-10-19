import { saltoNumero } from './numero'
import { describe, expect, test } from 'vitest'
import { formatarNumeroEntrada, validarEntradaNumero } from './numero'

describe('formatarNumeroEntrada', () => {
  test('retorna vazio para undefined ou valor não finito', () => {
    expect(formatarNumeroEntrada(undefined)).toBe('')
    expect(formatarNumeroEntrada(NaN)).toBe('')
    expect(formatarNumeroEntrada(Infinity)).toBe('')
  })

  test('formata inteiros sem vírgula', () => {
    expect(formatarNumeroEntrada(120, false)).toBe('120')
    expect(formatarNumeroEntrada(0, false)).toBe('0')
    expect(formatarNumeroEntrada(1500, false)).toBe('1500')
  })

  test('formata decimais com vírgula padrão pt-BR', () => {
    expect(formatarNumeroEntrada(12.5, true)).toBe('12,5')
    expect(formatarNumeroEntrada(12, true)).toBe('12')
    expect(formatarNumeroEntrada(0.5, true)).toBe('0,5')
  })
})

describe('validarEntradaNumero', () => {
  test('aceita inteiros válidos como 120 bpm', () => {
    const res = validarEntradaNumero('120', { decimal: false, minimo: 1, maximo: 250 })
    expect(res).toEqual({ valido: true, valor: 120 })
  })

  test('aceita vírgula e ponto decimal em campos com decimal (12,5 e 12.5)', () => {
    const comVirgula = validarEntradaNumero('12,5', { decimal: true, minimo: 0, maximo: 1000 })
    expect(comVirgula).toEqual({ valido: true, valor: 12.5 })

    const comPonto = validarEntradaNumero('12.5', { decimal: true, minimo: 0, maximo: 1000 })
    expect(comPonto).toEqual({ valido: true, valor: 12.5 })
  })

  test('rejeita valores fracionários em campos inteiros como bpm (120,5 e 120.5)', () => {
    const virgula = validarEntradaNumero('120,5', { decimal: false, minimo: 1, maximo: 250 })
    expect(virgula).toEqual({ valido: false, erro: 'Este campo aceita apenas números inteiros.' })

    const ponto = validarEntradaNumero('120.5', { decimal: false, minimo: 1, maximo: 250 })
    expect(ponto).toEqual({ valido: false, erro: 'Este campo aceita apenas números inteiros.' })
  })

  test('rejeita texto vazio ou apenas espaços', () => {
    expect(validarEntradaNumero('', { decimal: false })).toEqual({ valido: false, erro: 'Digite um valor.' })
    expect(validarEntradaNumero('   ', { decimal: false })).toEqual({ valido: false, erro: 'Digite um valor.' })
  })

  test('rejeita números negativos e sinais explícitos', () => {
    expect(validarEntradaNumero('-10', { decimal: false })).toEqual({ valido: false, erro: 'Informe um valor positivo.' })
    expect(validarEntradaNumero('-0.5', { decimal: true })).toEqual({ valido: false, erro: 'Informe um valor positivo.' })
    expect(validarEntradaNumero('+10', { decimal: false })).toEqual({ valido: false, erro: 'Digite um número válido.' })
  })

  test('rejeita notação científica e letras', () => {
    expect(validarEntradaNumero('1e5', { decimal: false })).toEqual({ valido: false, erro: 'Digite um número válido.' })
    expect(validarEntradaNumero('2E3', { decimal: true })).toEqual({ valido: false, erro: 'Digite um número válido.' })
    expect(validarEntradaNumero('abc', { decimal: false })).toEqual({ valido: false, erro: 'Digite um número válido.' })
    expect(validarEntradaNumero('12a', { decimal: false })).toEqual({ valido: false, erro: 'Digite um número válido.' })
  })

  test('rejeita excesso de casas decimais (mais de 1 dígito fracionário)', () => {
    const res = validarEntradaNumero('12,55', { decimal: true, minimo: 0, maximo: 1000 })
    expect(res).toEqual({ valido: false, erro: 'Informe no máximo uma casa decimal.' })
  })

  test('valida limites mínimos (positivo obrigatório para duração e bpm)', () => {
    // Duração (minimo 0.1)
    expect(validarEntradaNumero('0', { decimal: true, minimo: 0.1, maximo: 1440 })).toEqual({
      valido: false,
      erro: 'Informe um valor maior que zero.'
    })
    // Frequência cardíaca (minimo 1)
    expect(validarEntradaNumero('0', { decimal: false, minimo: 1, maximo: 250 })).toEqual({
      valido: false,
      erro: 'O valor deve ser pelo menos 1.'
    })
    // Distância/inclinação (minimo 0 permite 0)
    expect(validarEntradaNumero('0', { decimal: true, minimo: 0, maximo: 50 })).toEqual({
      valido: true,
      valor: 0
    })
  })

  test('valida limites máximos', () => {
    expect(validarEntradaNumero('251', { decimal: false, minimo: 1, maximo: 250 })).toEqual({
      valido: false,
      erro: 'O valor não pode ser maior que 250.'
    })
    expect(validarEntradaNumero('1441', { decimal: true, minimo: 0.1, maximo: 1440 })).toEqual({
      valido: false,
      erro: 'O valor não pode ser maior que 1.440.'
    })
  })
})


test('atalhos preservam erro de digitação em vez de substituir pelo valor anterior', () => {
 for (const texto of ['abc', '-10', '120,5', '251', '1e2']) {
  expect(saltoNumero(90, texto, 10, { minimo: 1, maximo: 250 }).valido).toBe(false)
 }
 expect(saltoNumero(90, '120', 10, { minimo: 1, maximo: 250 })).toEqual({ valido: true, valor: 130 })
})

test('saltos preservam frações e respeitam limites sem gerar deriva decimal', () => {
 expect(saltoNumero(12.5, undefined, 1, { decimal: true, minimo: 0, maximo: 1000 })).toEqual({ valido: true, valor: 13.5 })
 expect(saltoNumero(245, undefined, 10, { minimo: 1, maximo: 250 })).toEqual({ valido: true, valor: 250 })
 expect(saltoNumero(0, undefined, -5, { decimal: true, minimo: 0.1, maximo: 1440 })).toEqual({ valido: true, valor: 0.1 })
})