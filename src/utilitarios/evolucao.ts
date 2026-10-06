import type { SerieTreino, Treino } from '../dados/modelos'
import { volumeSeries, cargaTotal } from './treino'
export type Recordes = { carga: number; volume: number; rm: number }
export function epley(peso: number, reps: number) { return peso > 0 && reps > 0 ? peso * (1 + reps / 30) : 0 }
export function efetivas(series: SerieTreino[]) { return series.filter(s => !s.apagado_em && s.concluida_em && s.tipo !== 'aquecimento') }
export function desempenho(series: SerieTreino[]): Recordes {
  const validas = efetivas(series)
  const cargas = validas.flatMap(s => [{ peso: s.peso_total, reps: s.repeticoes }, ...(s.tipo === 'dropset' ? (s.reducoes ?? []).map(r => ({ peso: cargaTotal(r.peso_digitado, s.modo_carga, s.peso_barra), reps: r.repeticoes })) : [])])
  return { carga: Math.max(0, ...cargas.map(s => s.peso)), volume: volumeSeries(validas), rm: Math.max(0, ...cargas.map(s => epley(s.peso, s.reps))) }
}
export function superados(atual: Recordes, anteriores: Recordes[]) {
  if (!anteriores.length) return []
  return (['carga', 'volume', 'rm'] as const).filter(chave => atual[chave] > Math.max(...anteriores.map(a => a[chave])))
}
export function sessoesExercicio(treinos: Treino[], series: SerieTreino[], exercicioId: string) {
  const anteriores: Recordes[] = []
  return treinos.filter(t => t.fim && !t.apagado_em).sort((a, b) => a.inicio.localeCompare(b.inicio) || a.id.localeCompare(b.id)).flatMap(treino => {
    const grupo = series.filter(s => s.treino_id === treino.id && s.exercicio_id === exercicioId && !s.apagado_em && s.concluida_em)
    if (!grupo.length) return []
    const metricas = desempenho(grupo)
    const recordes = efetivas(grupo).length ? superados(metricas, anteriores) : []
    if (efetivas(grupo).length) anteriores.push(metricas)
    return [{ treino, series: grupo.sort((a,b) => a.numero_serie - b.numero_serie), ...metricas, recordes }]
  })
}
export function sugestao(series: SerieTreino[], alvo: number) {
  const normais = series.filter(s => !s.apagado_em && s.tipo === 'normal')
  return normais.length > 0 && normais.every(s => s.concluida_em && s.repeticoes >= alvo)
}
export function estagnado(sessoes: { treino: Treino; carga: number }[], agora = Date.now()) {
  const validas = sessoes.filter(s => s.carga > 0)
  if (validas.length < 2) return false
  let melhor = 0; let ultimaMelhora = 0
  for (const s of validas) { if (s.carga > melhor) { melhor = s.carga; ultimaMelhora = Date.parse(s.treino.inicio) } }
  const ultima = validas.at(-1)!
  return Date.parse(ultima.treino.inicio) - ultimaMelhora >= 28 * 86400000 && agora - Date.parse(ultima.treino.inicio) < 14 * 86400000
}
