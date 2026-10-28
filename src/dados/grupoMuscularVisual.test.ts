import { expect, test } from 'vitest'
import { grupoMuscularVisual } from './grupoMuscularVisual'

test('diferencia adutores, abdutores e regioes das pernas no selo', () => {
  expect(grupoMuscularVisual('Pernas', 'Cadeira adutora')).toBe('Adutores')
  expect(grupoMuscularVisual('Pernas', 'Cadeira abdutora')).toBe('Abdutores')
  expect(grupoMuscularVisual('Pernas', 'Mesa flexora')).toBe('Posteriores')
  expect(grupoMuscularVisual('Pernas', 'Cadeira extensora')).toBe('Quadríceps')
  expect(grupoMuscularVisual('Pernas', 'Panturrilha sentado')).toBe('Panturrilhas')
})

test('usa o grupo principal e nao inventa um musculo para cardio ou grupo desconhecido', () => {
  expect(grupoMuscularVisual('Peito', 'Supino inclinado com halteres')).toBe('Peito')
  expect(grupoMuscularVisual('Bíceps', 'Rosca direta com barra W')).toBe('Bíceps')
  expect(grupoMuscularVisual('Abdômen', 'Abdominal no solo')).toBe('Abdômen')
  expect(grupoMuscularVisual('Costas', 'Remada unilateral')).toBe('Costas')
  expect(grupoMuscularVisual('Pernas', 'Agachamento')).toBe('Pernas')
  expect(grupoMuscularVisual('Cardio', 'Bicicleta', 'cardio')).toBeUndefined()
  expect(grupoMuscularVisual('Personalizado', 'Movimento pessoal')).toBeUndefined()
})
