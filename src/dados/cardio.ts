import { banco, tabela } from './banco'
import { criarRegistro } from './repositorio'
import type { CardioSessao, Configuracao, Treino, AtividadeDiaria } from './modelos'
import { dataMedida } from './medidas'
import { tiposCardio, type TipoCardio } from './tiposCardio'
export { tiposCardio } from './tiposCardio'
// Referências gerais do Compendium 2024; intensidade não medida pelo app.
const mets: Partial<Record<TipoCardio, number>> = { esteira: 3.8, caminhada: 3.8, corrida: 7.5, bicicleta: 5, eliptico: 5, escada: 9.3, remo: 5, outro: 5, caminhada_esteira: 3.8, corrida_esteira: 7.5 }
export function possuiEstimativaCardio(tipo: TipoCardio) { return mets[tipo] !== undefined }
export function velocidadeCardio(s: CardioSessao) { return s.velocidade_media_kmh ?? (s.distancia_km && s.duracao_minutos > 0 ? s.distancia_km / s.duracao_minutos * 60 : undefined) }
export function ritmoCardio(s: CardioSessao) { if (!s.distancia_km || s.duracao_minutos <= 0) return undefined; const segundos = Math.round(s.duracao_minutos / s.distancia_km * 60); return `${Math.floor(segundos / 60)}:${String(segundos % 60).padStart(2,'0')} min/km` }
export function caloriasCardio(s: CardioSessao, fator = 100) { const kcal = s.calorias_informadas ?? s.calorias_estimadas; return kcal === undefined ? undefined : Math.round(kcal * fator / 100) }
export function validarDataAtividade(data: string) { const d = new Date(`${data}T12:00:00`); if (!/^\d{4}-\d{2}-\d{2}$/.test(data) || dataMedida(d) !== data || data > dataMedida()) throw new Error('Escolha uma data válida, até hoje.') }
export async function salvarCardio(s: CardioSessao) {
  validarDataAtividade(s.data)
  if (!tiposCardio.some(([tipo]) => tipo === s.tipo) || !Number.isFinite(s.duracao_minutos) || s.duracao_minutos <= 0 || s.duracao_minutos > 1440) throw new Error('Informe o tipo e uma duração válida.')
  const limites = { distancia_km: 1000, velocidade_media_kmh: 150, inclinacao_pct: 50, passos: 200000, calorias_informadas: 20000, fc_media: 250, fc_max: 250 }
  for (const [campo, limite] of Object.entries(limites)) { const v = s[campo as keyof typeof limites]; if (v !== undefined && (!Number.isFinite(v) || v < 0 || v > limite)) throw new Error('Confira os valores do cardio.') }
  if (s.velocidade_media_kmh === 0 || s.fc_media === 0 || s.fc_max === 0 || (s.fc_media && s.fc_max && s.fc_media > s.fc_max)) throw new Error('Confira a velocidade e a frequência cardíaca.')
  await banco.transaction('rw', tabela('cardio_sessoes'), tabela('medidas_corporais'), tabela('treinos'), async () => {
    if (s.treino_id) { const t = await tabela('treinos').get(s.treino_id); if (!t || t.apagado_em || t.data !== s.data) throw new Error('Escolha um treino disponível na mesma data.') }
    const pesos = await tabela('medidas_corporais').filter(m => !m.apagado_em && !!m.peso && m.data <= s.data).sortBy('data')
    const peso = pesos.at(-1)?.peso
    const met = mets[s.tipo]
    const calorias_estimadas = s.calorias_informadas !== undefined ? undefined : peso && met !== undefined ? Math.round(met * peso * s.duracao_minutos / 60) : undefined
    await tabela('cardio_sessoes').put({ ...s, calorias_estimadas, atualizado_em: new Date().toISOString() })
  })
}
export function novoCardio(tipo: CardioSessao['tipo'] = 'esteira', treino_id?: string, data = dataMedida()): CardioSessao { return { ...criarRegistro(), tipo, data, treino_id, duracao_minutos: 0, observacao: '' } }
export function gastoDoDia(data: string, treinos: Treino[], cardio: CardioSessao[], atividade: AtividadeDiaria | undefined, config: Configuracao) {
  if (config.modo_calorias_gastas === 'total_manual') return atividade?.calorias_gastas
  const sessoes = cardio.filter(s => !s.apagado_em && s.data === data)
  const treinosDia = treinos.filter(t => !t.apagado_em && !!t.fim && t.data === data)
  if (!atividade && !sessoes.length && !treinosDia.length) return undefined
  return (atividade?.calorias_gastas ?? 0) + treinosDia.reduce((s,t) => s + (t.calorias ?? 0),0) + sessoes.reduce((s,c) => s + (caloriasCardio(c,config.fator_calorias_cardio) ?? 0),0)
}
export function recordesCardio(s: CardioSessao, anteriores: CardioSessao[]) {
  const validas = anteriores.filter(a => !a.apagado_em && a.tipo === s.tipo && a.id !== s.id && (a.data < s.data || (a.data === s.data && a.criado_em < s.criado_em)))
  if (!validas.length) return []
  const recordes: string[] = []
  if (s.duracao_minutos > Math.max(...validas.map(a => a.duracao_minutos))) recordes.push('Maior duração')
  const distancias = validas.filter(a => a.distancia_km && a.distancia_km > 0)
  if (s.distancia_km && distancias.length) {
    if (s.distancia_km > Math.max(...distancias.map(a => a.distancia_km!))) recordes.push('Maior distância')
    if (s.duracao_minutos / s.distancia_km < Math.min(...distancias.map(a => a.duracao_minutos / a.distancia_km!))) recordes.push('Melhor ritmo')
  }
  return recordes
}
