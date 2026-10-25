export const sequenciaAbas = ['Hoje', 'Treino', 'Comida', 'Medidas', 'Evolução'] as const
export type Aba = typeof sequenciaAbas[number]

export function abaPorDeslize(aba: Aba, dx: number, dy: number, largura: number, duracao: number): Aba | undefined {
  if (![dx, dy, largura, duracao].every(Number.isFinite) || largura <= 0 || duracao < 0 || duracao > 800) return
  const distancia = Math.max(64, Math.min(96, largura * 0.22))
  if (Math.abs(dx) < distancia || Math.abs(dx) < Math.abs(dy) * 1.65) return
  return sequenciaAbas[sequenciaAbas.indexOf(aba) + (dx < 0 ? 1 : -1)]
}
