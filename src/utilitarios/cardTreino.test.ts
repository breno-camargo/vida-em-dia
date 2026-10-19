import { afterEach, expect, test, vi } from 'vitest'
import { criarCardTreino, textoTreino } from './cardTreino'
import type { Treino } from '../dados/modelos'
import { metricasAdesivo, metricasComDestaque } from './adesivoTreino'
import { escreverNumeroPrincipal } from './cardEditorial'
import { cenarioCard } from './imagensCardAprovado'

const treino: Treino = { id: 'treino', user_id: null, criado_em: '2026-10-16T10:00:00Z', atualizado_em: '2026-10-16T10:00:20Z', apagado_em: null, data: '2026-10-16', inicio: '2026-10-16T10:00:00Z', fim: '2026-10-16T10:00:20Z', duracao_minutos: 0, titulo: 'ficha a', observacao: '' }
const dados = { volume: 507, exercicios: 1, series: 3, recordes: 0, grupos: ['Bíceps'] }
afterEach(() => vi.unstubAllGlobals())

test('adapta dados reais ao desenho sem inventar volume ou perder segundos', () => {
  const s = cenarioCard(treino, { ...dados, volume: 0, repeticoesCorporais: 42 })
  expect(s.duracaoLabel).toBe('00:20')
  expect(s.repeticoes).toBe(42)
  expect(s.volume).toBe(0)
  expect(s.calorias).toBeUndefined()
  const cardio = { ...treino, tipo: 'esteira' as const, duracao_minutos: 44 + 47 / 60, distancia_km: 6.07, calorias_informadas: 609 }
  expect(cenarioCard(treino, { ...dados, cardio })).toMatchObject({ duracaoLabel: '44:47', distancia: 6.07, ritmo: '7\'23"/km', calorias: 609 })
})

test('número principal reserva espaço para descendentes da fonte antes da legenda', () => {
  const desenhar = vi.fn()
  const ctx = { font: '', fillStyle: '', fillText: desenhar, measureText: () => {
    const tamanho = Number(/(\d+)px/.exec(ctx.font)?.[1])
    return { width: tamanho, actualBoundingBoxAscent: tamanho * .6, actualBoundingBoxDescent: tamanho * .25 }
  } } as unknown as CanvasRenderingContext2D
  escreverNumeroPrincipal(ctx, '42', '#101b15', 'Georgia')
  const baseline = Number(desenhar.mock.calls[0][2])
  const tamanho = Number(/(\d+)px/.exec(ctx.font)?.[1])
  expect(baseline + tamanho * .25).toBeLessThanOrEqual(760)
  expect(baseline - tamanho * .6).toBeGreaterThanOrEqual(320)
})

function prepararCanvas() {
  const desenharFundo = vi.fn(), desenharFoto = vi.fn(), escrever = vi.fn()
  const ctx = new Proxy({ fillRect: desenharFundo, drawImage: desenharFoto, fillText: escrever,
    createLinearGradient: () => ({ addColorStop: vi.fn() }), measureText: (s: string) => ({ width: s.length * 15 }) }, {
    get: (target, key) => key in target ? target[key as keyof typeof target] : vi.fn(),
  })
  const canvas = { width: 0, height: 0, getContext: () => ctx, toBlob: (callback: (b: Blob) => void) => callback(new Blob(['png'], { type: 'image/png' })) }
  vi.stubGlobal('document', { createElement: () => canvas })
  return { canvas, desenharFundo, desenharFoto, escrever }
}

test('modelos opacos preservam formato vertical para story', async () => {
  for (const modelo of ['classico', 'foto', 'minimalista'] as const) {
    const { canvas, desenharFundo } = prepararCanvas()
    await criarCardTreino(treino, dados, undefined, { modelo })
    expect(canvas.height).toBe(1920)
    expect(desenharFundo).toHaveBeenCalled()
  }
})

test('texto copiável usa apenas resultados reais e não inventa calorias ou recordes', () => {
  const texto = textoTreino(treino, dados)
  expect(texto).toContain('Ficha a · 16/10/2026')
  expect(texto).toContain('1 exercício · 3 séries')
  expect(texto).toContain('507 kg')
  expect(texto).not.toMatch(/NaN|undefined|calorias|recorde/)
})

test('adesivo de peso corporal mostra repetições sem volume zero', () => {
  const metricas = metricasAdesivo(treino, { ...dados, volume: 0, repeticoesCorporais: 42 })
  expect(metricas.some(m => m.id === 'volume')).toBe(false)
  expect(metricas.find(m => m.id === 'repeticoes')?.valor).toBe('42 reps')
})

test('sessão curta mantém tempo como destaque e repetições como apoio', async () => {
  const corporal = { ...dados, volume: 0, repeticoesCorporais: 42 }
  expect(metricasComDestaque(treino, corporal)[0].id).toBe('duracao')
  expect(metricasComDestaque(treino, corporal, ['series', 'duracao'])[0].id).toBe('duracao')
  const { escrever } = prepararCanvas()
  await criarCardTreino(treino, corporal, undefined, { modelo: 'minimalista' })
  expect(escrever.mock.calls.some(c => c[0] === '00:20' && Number(c[2]) <= 960)).toBe(true)
  expect(escrever.mock.calls.some(c => c[0] === 'Tempo: Menos de 1 min')).toBe(false)
  expect(escrever.mock.calls.some(c => c[0] === '00:20')).toBe(true)
})

test('cardio usa somente métricas da sessão e identifica a origem das calorias', () => {
  const cardio = { ...treino, tipo: 'esteira' as const, duracao_minutos: 44 + 47 / 60, distancia_km: 6.07, passos: 6728, calorias_informadas: 609 }
  const metricas = metricasAdesivo(treino, { ...dados, cardio })
  expect(metricasComDestaque(treino, { ...dados, cardio })[0].id).toBe('distancia')
  expect(metricasComDestaque(treino, { ...dados, cardio: { ...cardio, distancia_km: undefined } })[0].id).toBe('duracao')
  expect(metricas.find(m => m.id === 'duracao')?.valor).toBe('44 min 47 s')
  expect(metricas.find(m => m.id === 'calorias')?.rotulo).toBe('Calorias informadas')
  expect(metricas.find(m => m.id === 'passos')?.valor).toBe('6.728')
  expect(metricas.some(m => ['volume', 'series', 'recordes', 'elevacao'].includes(m.id))).toBe(false)
  expect(metricasAdesivo(treino, { ...dados, cardio: { ...cardio, distancia_km: undefined, calorias_informadas: undefined } }).some(m => ['distancia', 'ritmo', 'calorias'].includes(m.id))).toBe(false)
})
