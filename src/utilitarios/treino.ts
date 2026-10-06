import type { SerieTreino } from '../dados/modelos'
export function cargaTotal(peso: number, modo: 'total' | 'por_lado' = 'total', barra = 0) {
  return modo === 'por_lado' ? peso * 2 + barra : peso
}
export function volumeSeries(series: SerieTreino[]) {
  return series.filter(s => s.concluida_em && !s.apagado_em && s.tipo !== 'aquecimento').reduce((total, serie) => total + serie.peso_total * serie.repeticoes + (serie.tipo === 'dropset' ? (serie.reducoes ?? []).reduce((soma, r) => soma + cargaTotal(r.peso_digitado, serie.modo_carga, serie.peso_barra) * r.repeticoes, 0) : 0), 0)
}
export function segundosRestantes(fim: string, agora = Date.now()) { return Math.ceil((Date.parse(fim) - agora) / 1000) }
export function caloriasMusculacao(peso: number, minutos: number) { return Math.round(5 * peso * minutos / 60) }
export function validarSerie(serie: SerieTreino) {
  const valida = (peso: number, reps: number) => Number.isFinite(peso) && peso >= 0 && peso <= 2000 && Number.isInteger(reps) && reps >= 1 && reps <= 1000
  if (!valida(serie.peso_digitado, serie.repeticoes) || !Number.isFinite(serie.peso_barra ?? 0) || (serie.peso_barra ?? 0) < 0 || (serie.peso_barra ?? 0) > 100) throw new Error('Confira a carga, a barra e as repetições da série.')
  if (serie.rpe !== undefined && (!Number.isFinite(serie.rpe) || serie.rpe < 1 || serie.rpe > 10)) throw new Error('Use um RPE entre 1 e 10, ou deixe vazio.')
  if (serie.tipo === 'dropset' && (serie.reducoes ?? []).some(r => !valida(r.peso_digitado, r.repeticoes))) throw new Error('Confira as cargas e repetições do drop set.')
}
