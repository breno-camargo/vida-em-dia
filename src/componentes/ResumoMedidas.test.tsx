import { renderToStaticMarkup } from 'react-dom/server'
import { expect, test } from 'vitest'
import { ResumoMedidas } from './ResumoMedidas'
import type { MedidaCorporal } from '../dados/modelos'

const registro: MedidaCorporal = { id: '1', user_id: null, criado_em: '2026-10-10T10:00:00Z', atualizado_em: '2026-10-10T10:00:00Z', apagado_em: null, data: '2026-10-10', peso: 70, biceps_e: 31 }

test('preserve valores parciais e datas independentes nos pares de medidas', () => {
  const html = renderToStaticMarkup(<ResumoMedidas registros={[registro, { ...registro, id: '2', data: '2026-10-16', peso: undefined, biceps_e: undefined, biceps_d: 35 }]} visao="resumo" navegar={() => {}} />)
  const par = html.match(/<section class="par-resumo-medida">.*?<\/section>/)?.[0]
  expect(par).toContain('Bíceps')
  expect(par).toContain('35')
  expect(par).toContain('31')
  expect(par).toContain('10/10/2026')
  expect(par).toContain('16/10/2026')
  expect(html).toContain('Último peso')
  expect(html).toContain('Não informada')
})

test('mostre uma data compartilhada somente quando os dois lados foram medidos no mesmo dia', () => {
  const html = renderToStaticMarkup(<ResumoMedidas registros={[{ ...registro, biceps_d: 32 }]} visao="resumo" navegar={() => {}} />)
  const par = html.match(/<section class="par-resumo-medida">.*?<\/section>/)?.[0]
  expect(par?.match(/10\/10\/2026/g)).toHaveLength(1)
})
