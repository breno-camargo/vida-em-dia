import { expect, test } from 'vitest'
import { guiaExercicio, guiasExercicios } from './guiasExercicios'
import { guiasComplementares } from './guiasComplementares'
import { nomesBibliotecaInicial } from './biblioteca'
import { aliasesCatalogo, catalogoAmpliado } from './catalogoAmpliado'

test('guia respeita variacoes e nao aproxima nomes desconhecidos', () => {
  expect(guiaExercicio('  SUPINO RETO COM HALTERES ')).toBe(guiasExercicios['supino reto com halteres'])
  expect(guiaExercicio('Supino reto com barra')).not.toBe(guiaExercicio('Supino reto com halteres'))
  expect(guiaExercicio('Supino na máquina')).not.toBe(guiaExercicio('Supino reto com barra'))
  expect(guiaExercicio('Supino reto com halteres com pegada neutra')).toBeDefined()
  expect(guiaExercicio('Supino reto com halteres com pegada neutra')).not.toBe(guiaExercicio('Supino reto com halteres'))
  expect(guiaExercicio('Supino reto com barra inventado')).toBeUndefined()
})

test('guias possuem preparacao, passos e dois erros sem campos pessoais', () => {
  for (const guia of Object.values({ ...guiasComplementares, ...guiasExercicios })) {
    expect(guia.preparacao.length).toBeGreaterThan(30)
    expect(guia.passos.length).toBeGreaterThanOrEqual(3)
    expect(guia.passos.length).toBeLessThanOrEqual(5)
    expect(guia.evite).toHaveLength(2)
    expect(guia).not.toHaveProperty('nota_fixa')
    expect(guia).not.toHaveProperty('como_fazer')
  }
})

test('catalogo so deixa sem guia as variacoes explicitamente pendentes', () => {
  const nomes = [...new Set([...nomesBibliotecaInicial, ...Object.values(catalogoAmpliado).flatMap(texto => texto.split('|'))].map(nome => aliasesCatalogo[nome] ?? nome))]
  expect(nomes.filter(nome => !guiaExercicio(nome)).sort()).toEqual([
    'Abdominal remador circular sentado', 'Desenvolvimento angulado com kettlebell', 'Muscle-up',
    'Outro cardio', 'Panturrilha rotatória na máquina', 'Puxada por trás', 'Remada king com kettlebell',
  ].sort())
})
