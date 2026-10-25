import { afterEach, beforeEach, expect, test, vi } from 'vitest'

function novoGanho() { return { gain: { setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() }, connect: vi.fn(), disconnect: vi.fn() } }
const contextos: Contexto[] = []
let falhar = false


class Contexto {
  state = 'suspended'
  sampleRate = 48000
  currentTime = 0
  destination = {}
  tons: ReturnType<Contexto['novoTom']>[] = []
  ganhos: ReturnType<typeof novoGanho>[] = []
  constructor() { contextos.push(this) }
  resume = vi.fn(async () => {
    if (falhar) throw new Error('blocked')

    this.state = 'running'
  })
  close = vi.fn(async () => { this.state = 'closed' })
  createBuffer = vi.fn(() => ({}))
  createBufferSource = vi.fn(() => ({ buffer: {}, connect: vi.fn(), start: vi.fn(), disconnect: vi.fn(), onended: () => {} }))
  novoTom() { return { type: '', frequency: { value: 0 }, connect: vi.fn(), disconnect: vi.fn(), start: vi.fn(), stop: vi.fn(), onended: () => {} } }
  createOscillator() { const tom = this.novoTom(); this.tons.push(tom); return tom }
  createGain() {
    const ganho = novoGanho()
    this.ganhos.push(ganho); return ganho
  }
}
beforeEach(() => {
  vi.resetModules(); contextos.length = 0; falhar = false
  vi.stubGlobal('AudioContext', Contexto)
  vi.stubGlobal('navigator', {})
  vi.stubGlobal('document', { hidden: false })
})
afterEach(() => vi.unstubAllGlobals())
test('concluir serie desbloqueia sem emitir tom', async () => {
  const alerta = await import('./alerta')
  alerta.liberarAudio()
  await Promise.resolve()
  expect(contextos[0].resume).toHaveBeenCalledOnce()
  expect(contextos[0].tons).toHaveLength(0)
})
test('dez bipes curtos e sequencia final iguais ao original', async () => {
  const alerta = await import('./alerta')
  alerta.liberarAudio(); await Promise.resolve()
  for (let i = 0; i < 10; i++) alerta.tocarContagem()
  expect(contextos[0].tons).toHaveLength(10)
  expect(contextos[0].tons.every(t => t.frequency.value === 660)).toBe(true)
  alerta.tocarAlerta()
  expect(contextos[0].tons.slice(-3).map(t => t.frequency.value)).toEqual([880, 880, 1046])
  expect(contextos[0].tons.slice(-3).map(t => t.start.mock.calls[0][0])).toEqual([0, .8, 1.6])
})
test('pular ou silenciar interrompe os tons', async () => {
  const alerta = await import('./alerta')
  alerta.liberarAudio(); await Promise.resolve(); alerta.tocarAlerta(); alerta.silenciarAlerta()
  expect(contextos[0].tons.every(t => t.stop.mock.calls.length === 2)).toBe(true)
})

test('bipes usam ganho reforcado sem ultrapassar amplitude maxima', async () => {
 const alerta = await import('./alerta')
 alerta.liberarAudio(); await Promise.resolve(); alerta.tocarContagem(); alerta.tocarAlerta()
 expect(contextos[0].ganhos).toHaveLength(4)
 expect(contextos[0].ganhos.every(g => g.gain.linearRampToValueAtTime.mock.calls.some(([pico]) => pico === 0.6))).toBe(true)
})
