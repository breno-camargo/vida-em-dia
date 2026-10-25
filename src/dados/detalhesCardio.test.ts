import { expect, test } from 'vitest'
import { camposDaModalidade, validarDetalhesCardio } from './detalhesCardio'
import { validarDominioBackup } from './validacaoBackup'

test('bike oferece cadência e potência sem passos ou inclinação',()=>{
 for(const tipo of ['bicicleta','ciclismo','spinning','airbike'] as const){
  expect(camposDaModalidade(tipo)).toEqual(['distancia_km','velocidade_media_kmh','cadencia_rpm','potencia_watts'])
 }
})
test('natação, esteira e esportes recebem campos adequados',()=>{
 expect(camposDaModalidade('natacao')).toContain('comprimentos_piscina')
 expect(camposDaModalidade('natacao')).not.toContain('passos')
 expect(camposDaModalidade('esteira')).toContain('inclinacao_pct')
 expect(camposDaModalidade('corrida')).not.toContain('inclinacao_pct')
 expect(camposDaModalidade('boxe')).toEqual([])
})
test('detalhes opcionais validam limites e precisão também no backup',()=>{
 expect(()=>validarDetalhesCardio({})).not.toThrow()
 expect(()=>validarDetalhesCardio({cadencia_rpm:85.5,potencia_watts:210.5,piscina_metros:25,comprimentos_piscina:40})).not.toThrow()
 for(const valor of [-1,0,NaN,Infinity,3001])expect(()=>validarDetalhesCardio({potencia_watts:valor})).toThrow()
 expect(()=>validarDetalhesCardio({comprimentos_piscina:1.5})).toThrow()
 expect(()=>validarDominioBackup('cardio_sessoes',{id:'teste',atualizado_em:'2026-10-19T00:00:00Z',potencia_watts:-10})).toThrow()
})
