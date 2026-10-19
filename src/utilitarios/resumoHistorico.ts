import type { SerieTreino } from '../dados/modelos'
import { volumeSeries } from './treino'

export function repeticoesCorporais(series: SerieTreino[]) {
  return series.filter(s => s.concluida_em && !s.apagado_em && s.tipo !== 'aquecimento' && s.modo_carga === 'peso_corporal').reduce((total, s) => total + s.repeticoes + (s.tipo === 'dropset' ? (s.reducoes ?? []).reduce((soma, r) => soma + r.repeticoes, 0) : 0), 0)
}

export function resumoHistorico(series: SerieTreino[]) {
  const validas = series.filter(s => s.concluida_em && !s.apagado_em)
  const corporais = validas.filter(s => s.modo_carga === 'peso_corporal' && s.tipo !== 'aquecimento')
  const repeticoes = corporais.reduce((total, s) => total + s.repeticoes + (s.tipo === 'dropset' ? (s.reducoes ?? []).reduce((soma, r) => soma + r.repeticoes, 0) : 0), 0)
  const volume = volumeSeries(validas.filter(s => s.modo_carga !== 'peso_corporal'))
  const linhas: string[] = []
  if (volume > 0) linhas.push(`Volume total: ${volume.toLocaleString('pt-BR')} kg`)
  if (repeticoes > 0) linhas.push(`Peso corporal: ${repeticoes.toLocaleString('pt-BR')} ${repeticoes === 1 ? 'repetição' : 'repetições'}`)
  return linhas
}
