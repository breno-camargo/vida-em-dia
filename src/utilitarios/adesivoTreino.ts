import { escreverCard, escreverMetrica } from './cardEditorial'
import type { Treino } from '../dados/modelos'
import type { DadosCard } from './cardTreino'
import { duracaoSessao } from './sessao'
import { formatarDuracaoCardio } from './duracaoCardio'
import { formatarDistanciaCardio } from './distanciaCardio'
import { ritmoCardio } from '../dados/cardio'

export type LayoutAdesivo = 'coluna' | 'compacto' | 'destaque' | 'faixa'
export function metricasAdesivo(treino: Treino, dados: DadosCard) {
  if (dados.cardio) {
    const s = dados.cardio, calorias = s.calorias_informadas ?? s.calorias_estimadas, ritmo = ritmoCardio(s)
    return [
      ...(s.distancia_km !== undefined && s.distancia_km > 0 ? [{ id: 'distancia', rotulo: 'Distância', valor: formatarDistanciaCardio(s.distancia_km) }] : []),
      ...(ritmo ? [{ id: 'ritmo', rotulo: 'Ritmo', valor: ritmo }] : []),
      { id: 'duracao', rotulo: 'Tempo', valor: formatarDuracaoCardio(s.duracao_minutos) },
      ...(calorias !== undefined && calorias > 0 ? [{ id: 'calorias', rotulo: s.calorias_informadas !== undefined ? 'Calorias informadas' : 'Calorias estimadas', valor: `${calorias.toLocaleString('pt-BR')} kcal` }] : []),
      ...(s.passos !== undefined ? [{ id: 'passos', rotulo: 'Passos', valor: s.passos.toLocaleString('pt-BR') }] : []),
      ...(s.fc_media !== undefined ? [{ id: 'frequencia', rotulo: 'Frequência média', valor: `${s.fc_media} bpm` }] : []),
    ]
  }
  return [
    { id: 'duracao', rotulo: 'Tempo', valor: duracaoSessao(treino) },
    ...(dados.volume > 0 ? [{ id: 'volume', rotulo: 'Volume total', valor: `${dados.volume.toLocaleString('pt-BR')} kg` }] : []),
    ...(dados.repeticoesCorporais ? [{ id: 'repeticoes', rotulo: 'Repetições', valor: `${dados.repeticoesCorporais.toLocaleString('pt-BR')} reps` }] : []),
    { id: 'series', rotulo: 'Séries', valor: String(dados.series) },
    { id: 'exercicios', rotulo: 'Exercícios', valor: String(dados.exercicios) },
    ...(dados.recordes > 0 ? [{ id: 'recordes', rotulo: 'Recordes', valor: String(dados.recordes) }] : []),
    ...(treino.calorias !== undefined && treino.calorias > 0 ? [{ id: 'calorias', rotulo: 'Calorias estimadas', valor: `${treino.calorias.toLocaleString('pt-BR')} kcal` }] : []),
  ]
}

export function metricasComDestaque(treino: Treino, dados: DadosCard, campos?: string[]) {
  const metricas = metricasAdesivo(treino, dados).filter(m => !campos || campos.includes(m.id))
  // Tempo é o destaque da musculação, mesmo abaixo de um minuto.
  const prioridade = dados.cardio ? ['distancia', 'duracao', 'passos'] : ['duracao', 'volume', 'series', 'exercicios']
  const principal = prioridade.map(id => metricas.find(m => m.id === id && /^\d/.test(m.valor))).find(Boolean) ?? metricas[0]
  return principal ? [principal, ...metricas.filter(m => m !== principal)] : []
}

export async function criarAdesivoTreino(treino: Treino, dados: DadosCard, layout: LayoutAdesivo, cor: 'clara' | 'escura', campos?: string[]) {
  const metricas = metricasComDestaque(treino, dados, campos)
  const canvas = document.createElement('canvas')
  canvas.width = layout === 'coluna' ? 720 : layout === 'faixa' ? 1600 : 1080
  const linhas = Math.ceil(metricas.length / 2)
  canvas.height = layout === 'coluna' ? 210 + metricas.length * 190 : layout === 'faixa' ? 390 : layout === 'destaque' ? 550 + Math.ceil(Math.max(0, metricas.length - 1) / 2) * 190 : 230 + linhas * 190
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Não foi possível criar o adesivo.')
  ctx.fillStyle = cor === 'clara' ? '#ffffff' : '#14241b'
  const corTexto = cor === 'clara' ? '#ffffff' : '#14241b'
  const texto = (valor: string, x: number, y: number, tamanho: number, largura: number, peso = 600) => escreverCard(ctx, valor, x, y, tamanho, largura, corTexto, peso)
  const x = 52
  texto('V I D A  E M  D I A', x, 70, 24, canvas.width - 104)
  ctx.fillStyle = corTexto; ctx.fillRect(x, 96, 32, 4)
  metricas.forEach((m, i) => {
    let mx = x, y = 186 + i * 190, largura = canvas.width - 104, tamanho = /^\d/.test(m.valor) ? 102 : 46
    if (layout === 'faixa') { largura = (canvas.width - 104) / Math.max(1, metricas.length); mx = 52 + i * largura; y = 176; tamanho = 80; largura -= 20 }
    else if (layout === 'compacto') { mx = 52 + i % 2 * 500; y = 200 + Math.floor(i / 2) * 190; largura = 440; tamanho = 100 }
    else if (layout === 'destaque') {
      if (i === 0) { y = 200; tamanho = 190 }
      else { mx = 52 + (i - 1) % 2 * 500; y = 530 + Math.floor((i - 1) / 2) * 190; largura = 440; tamanho = 100 }
    }
    texto(m.rotulo, mx, y, 27, largura, 500)
    escreverMetrica(ctx, m.valor, mx, y + (layout === 'destaque' && i === 0 ? 190 : 110), /^\d/.test(m.valor) ? tamanho : 40, largura, corTexto)
  })
  return new Promise<Blob>((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Não foi possível exportar o adesivo.')), 'image/png'))
}
