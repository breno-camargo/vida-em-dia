import type { Treino } from '../dados/modelos'
import type { DadosCard, OpcoesCard } from './cardTreino'
import { desenharCardAprovado, type CenarioCard } from './renderCardAprovado'
import { duracaoSessao } from './sessao'

export function cenarioCard(treino: Treino, dados: DadosCard): CenarioCard {
  const data = new Date(`${treino.data}T12:00:00`).toLocaleDateString('pt-BR')
  if (dados.cardio) {
    const s = dados.cardio, segundos = Math.round(s.duracao_minutos * 60)
    const ritmoSeg = s.distancia_km && s.distancia_km > 0 ? Math.round(segundos / s.distancia_km) : undefined
    return { tipo: 'cardio', data, duracaoLabel: `${String(Math.floor(segundos / 60)).padStart(2, '0')}:${String(segundos % 60).padStart(2, '0')}`,
      distancia: s.distancia_km, calorias: s.calorias_informadas ?? s.calorias_estimadas, passos: s.passos,
      ritmo: ritmoSeg === undefined ? undefined : `${Math.floor(ritmoSeg / 60)}'${String(ritmoSeg % 60).padStart(2, '0')}"/km` }
  }
  return { tipo: 'musculacao', data, duracaoLabel: duracaoSessao(treino), volume: dados.volume,
    exercicios: dados.exercicios, series: dados.series, repeticoes: dados.repeticoesCorporais, calorias: treino.calorias }
}

function exportar(canvas: HTMLCanvasElement) {
  return new Promise<Blob>((resolve, reject) => canvas.toBlob(b => b ? resolve(b) : reject(new Error('Não foi possível exportar o card.')), 'image/png'))
}

export async function criarImagensCardAprovado(treino: Treino, dados: DadosCard, foto?: File, opcoes: OpcoesCard = {}) {
  const modelo = opcoes.modelo === 'foto' ? 'foto' : opcoes.modelo === 'adesivo' ? 'adesivo' : 'minimalista'
  let imagem: HTMLImageElement | null = null
  if (foto && modelo !== 'minimalista') {
    const url = URL.createObjectURL(foto)
    try { imagem = new Image(); imagem.src = url; await imagem.decode() } finally { URL.revokeObjectURL(url) }
  }
  const s = cenarioCard(treino, dados)
  const canvas = document.createElement('canvas'); canvas.width = 1080; canvas.height = 1920
  const ctx = canvas.getContext('2d'); if (!ctx) throw new Error('Não foi possível criar o card.')
  const bounds = desenharCardAprovado(ctx, s, modelo, opcoes.cor ?? 'clara', imagem)
  let arquivo = canvas
  if (bounds) {
    const pad = 36, x = Math.max(0, Math.floor(bounds.minX - pad)), y = Math.max(0, Math.floor(bounds.minY - pad))
    arquivo = document.createElement('canvas')
    arquivo.width = Math.min(1080 - x, Math.ceil(bounds.maxX - bounds.minX + pad * 2))
    arquivo.height = Math.min(1920 - y, Math.ceil(bounds.maxY - bounds.minY + pad * 2))
    const corte = arquivo.getContext('2d'); if (!corte) throw new Error('Não foi possível criar o adesivo.')
    corte.drawImage(canvas, x, y, arquivo.width, arquivo.height, 0, 0, arquivo.width, arquivo.height)
  }
  const blob = await exportar(arquivo)
  if (modelo !== 'adesivo') return { blob, previa: blob }
  desenharCardAprovado(ctx, s, modelo, opcoes.cor ?? 'clara', imagem, true)
  return { blob, previa: await exportar(canvas) }
}
