import { expect, test } from 'vitest'
import { abaPorDeslize } from './gestoAbas'

test('esquerda avança e direita volta na sequência da navegação',()=>{
  expect(abaPorDeslize('Hoje',-140,5,390,300)).toBe('Treino')
  expect(abaPorDeslize('Medidas',140,5,390,300)).toBe('Comida')
})
test('não dá a volta ao atingir a primeira ou última aba',()=>{
  expect(abaPorDeslize('Hoje',140,0,390,300)).toBeUndefined()
  expect(abaPorDeslize('Evolução',-140,0,390,300)).toBeUndefined()
})
test('ignora toque curto, vertical, diagonal, longo e dados inválidos',()=>{
  for(const [x,y,w,t] of [[-20,0,390,300],[-80,180,390,300],[-100,80,390,300],[-140,0,390,900],[NaN,0,390,300],[-140,0,0,300]])expect(abaPorDeslize('Hoje',x,y,w,t)).toBeUndefined()
})
