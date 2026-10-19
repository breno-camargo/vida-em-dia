import { expect, test } from 'vitest'
import type { SerieTreino } from '../dados/modelos'
import { resumoHistorico } from './resumoHistorico'

const serie = (alteracoes: Partial<SerieTreino> = {}): SerieTreino => ({
  id: 's', user_id: 'u', apagado_em: null, criado_em: '', atualizado_em: '', treino_id: 't', exercicio_id: 'e',
  numero_serie: 1, tipo: 'normal', peso_digitado: 13, peso_total: 13, repeticoes: 13,
  concluida_em: '2026-10-18T10:00:00Z', recorde: false, ...alteracoes,
})

test('identifica 507 kg como volume acumulado e omite resultados zerados', () => {
  expect(resumoHistorico([serie(), serie(), serie()])).toEqual(['Volume total: 507 kg'])
  expect(resumoHistorico([serie({ peso_total: 0, peso_digitado: 0 })])).toEqual([])
})

test('destaca repetições corporais e preserva volume nas sessões mistas', () => {
  const corporal = serie({ modo_carga: 'peso_corporal', peso_total: 0, repeticoes: 12 })
  expect(resumoHistorico([corporal])).toEqual(['Peso corporal: 12 repetições'])
  expect(resumoHistorico([serie(), corporal])).toEqual(['Volume total: 169 kg', 'Peso corporal: 12 repetições'])
})

test('exclui aquecimento, pendências e exclusões e inclui reduções do drop set', () => {
  expect(resumoHistorico([
    serie({ tipo: 'aquecimento' }), serie({ concluida_em: undefined }), serie({ apagado_em: '2026-10-18' }),
    serie({ tipo: 'dropset', reducoes: [{ peso_digitado: 10, repeticoes: 5 }] }),
  ])).toEqual(['Volume total: 219 kg'])
})
