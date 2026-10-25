import type { Treino } from '../dados/modelos'
import type { DadosCard, OpcoesCard } from './cardTreino'
import { metricasComDestaque } from './adesivoTreino'
import { formatarNomeFicha } from '../dados/fichas'

export function escreverNumeroPrincipal(ctx: CanvasRenderingContext2D, valor: string, cor: string, familia: string) {
  const relogio = /^\d+:\d{2}$/.test(valor)
  const peso = relogio ? 750 : 400
  const fonte = relogio ? 'system-ui' : familia
  let tamanho = relogio ? 350 : 760
  const medir = () => {
    ctx.font = `${peso} ${tamanho}px ${fonte}`
    const m = ctx.measureText(valor)
    return { largura: Math.max(m.width, (m.actualBoundingBoxLeft ?? 0) + (m.actualBoundingBoxRight ?? 0)), acima: m.actualBoundingBoxAscent ?? tamanho * .8, abaixo: m.actualBoundingBoxDescent ?? tamanho * .2 }
  }
  let medida = medir()
  while ((medida.largura > 920 || medida.acima + medida.abaixo > 440) && tamanho > 24) { tamanho -= 2; medida = medir() }
  ctx.fillStyle = cor
  // Caixa fixa e centrada: o descendente do 4 da Georgia também precisa caber.
  const y = 320 + (440 - medida.acima - medida.abaixo) / 2 + medida.acima
  ctx.fillText(valor, 80 + (920 - medida.largura) / 2, y)
}

export function escreverCard(ctx: CanvasRenderingContext2D, valor: string, x: number, y: number, tamanho: number, largura: number, cor: string, peso = 600, familia = 'system-ui') {
  ctx.fillStyle = cor
  ctx.font = `${peso} ${tamanho}px ${familia}`
  while (ctx.measureText(valor).width > largura && tamanho > 18) { tamanho -= 2; ctx.font = `${peso} ${tamanho}px ${familia}` }
  ctx.fillText(valor, x, y, largura)
}

// Unidades menores, sem comprimir horizontalmente os números para caber.
export function escreverMetrica(ctx: CanvasRenderingContext2D, valor: string, x: number, y: number, tamanho: number, largura: number, cor: string, familia = 'system-ui') {
  const partes = /^(\d[\d.,:]*)\s+(.+)$/.exec(valor)
  if (!partes) { escreverCard(ctx, valor, x, y, tamanho, largura, cor, 750, familia); return }
  const [, numero, unidade] = partes
  const medir = (texto: string, escala: number) => { ctx.font = `600 ${escala}px ${familia}`; return ctx.measureText(texto).width }
  while (medir(numero, tamanho) + medir(unidade, tamanho * .28) + 16 > largura && tamanho > 24) tamanho -= 2
  escreverCard(ctx, numero, x, y, tamanho, largura, cor, 600, familia)
  const deslocamento = medir(numero, tamanho)
  escreverCard(ctx, unidade, x + deslocamento + 16, y, tamanho * .28, largura - deslocamento - 16, cor, 500)
}

export async function criarCardEditorial(treino: Treino, dados: DadosCard, foto: File | undefined, opcoes: OpcoesCard) {
  const editorial = opcoes.modelo === 'minimalista' || !foto
  const composicaoEditorial = editorial || !foto
  const canvas = document.createElement('canvas'); canvas.width = 1080; canvas.height = 1920
  const ctx = canvas.getContext('2d'); if (!ctx) throw new Error('Não foi possível criar o card.')
  const tinta = editorial ? '#101b15' : '#ffffff', acento = '#bcec86'
  ctx.fillStyle = editorial ? '#f1eee4' : '#15231c'; ctx.fillRect(0, 0, 1080, 1920)
  if (!editorial && foto) {
    const url = URL.createObjectURL(foto)
    try {
      const img = new Image(); img.src = url; await img.decode()
      const escala = Math.max(1080 / img.naturalWidth, 1920 / img.naturalHeight)
      ctx.drawImage(img, (1080 - img.naturalWidth * escala) / 2, (1920 - img.naturalHeight * escala) / 2, img.naturalWidth * escala, img.naturalHeight * escala)
    } finally { URL.revokeObjectURL(url) }
  }
  if (!editorial) {
    const g = ctx.createLinearGradient(0, 0, 0, 1920)
    g.addColorStop(0, '#06100b50'); g.addColorStop(.35, '#06100b00'); g.addColorStop(.63, '#06100b90'); g.addColorStop(1, '#06100bf5')
    ctx.fillStyle = g; ctx.fillRect(0, 0, 1080, 1920)
  }
  const texto = (s: string, x: number, y: number, tamanho: number, largura = 920, cor = tinta) => escreverCard(ctx, s, x, y, tamanho, largura, cor)
  texto('V I D A  E M  D I A', 80, 130, 26)
  ctx.fillStyle = acento; ctx.fillRect(80, 160, 36, 6)
  const metricas = metricasComDestaque(treino, dados, opcoes.campos)
  const [principal, ...apoio] = metricas
  const status = dados.cardio ? 'SESSÃO CONCLUÍDA' : 'TREINO CONCLUÍDO'
  if (composicaoEditorial) {
    texto(status, 650, 130, 22, 350)
    if (principal) {
      const numero = /^(\d[\d.,:]*)(?:\s+.*)?$/.exec(principal.valor)?.[1]
      escreverNumeroPrincipal(ctx, numero ?? principal.valor, tinta, editorial ? 'Georgia, serif' : 'system-ui')
      const unidade = principal.valor.slice(numero?.length ?? principal.valor.length).trim()
      texto(`${principal.rotulo}${unidade && !['reps', 'min'].includes(unidade) ? ` · ${unidade}` : ''}`.toLocaleUpperCase('pt-BR'), 80, 850, 30)
    }
    ctx.fillStyle = editorial ? '#101b1538' : '#ffffff60'; ctx.fillRect(80, 960, 820, 2)
    ctx.fillStyle = acento; ctx.fillRect(930, 950, 70, 20)
  } else {
    texto(status, 80, 1080, 27, 920, acento)
    if (principal) {
      escreverMetrica(ctx, principal.valor, 70, 1320, 260, 930, tinta)
      texto(principal.rotulo, 80, 1380, 28)
    }
  }
  const apoioNumerico = apoio.filter(m => /^\d/.test(m.valor))
  const apoioEditorial = composicaoEditorial && apoioNumerico.length <= 3
  const fotoDensa = !composicaoEditorial && apoioNumerico.length > 4
  apoioNumerico.forEach((m, i) => {
    const primeira = apoioEditorial && i === 0
    const x = primeira ? 80 : 80 + (apoioEditorial ? (i - 1) % 2 : i % 2) * 480
    const y = apoioEditorial ? primeira ? 1200 : 1500 : composicaoEditorial ? 1170 + Math.floor(i / 2) * 230 : fotoDensa ? 1400 + Math.floor(i / 2) * 150 : 1470 + Math.floor(i / 2) * 190
    escreverMetrica(ctx, m.valor, x, y, primeira ? 170 : fotoDensa ? 70 : 100, primeira ? 920 : 430, tinta)
    texto(m.rotulo, x, y + (fotoDensa ? 48 : 70), 23, primeira ? 920 : 430)
  })
  const notas = apoio.filter(m => !/^\d/.test(m.valor)).map(m => `${m.rotulo}: ${m.valor}`)
  if (dados.repeticoesCorporais && metricas.some(m => m.id === 'repeticoes')) notas.push('Peso corporal')
  if (notas.length) texto(notas.join(' · '), 80, 1795, 23)
  texto(formatarNomeFicha(treino.titulo ?? 'Treino livre'), 80, 1850, 24, 650)
  texto(new Date(`${treino.data}T12:00:00`).toLocaleDateString('pt-BR'), 800, 1850, 22, 200)
  return new Promise<Blob>((resolve, reject) => canvas.toBlob(b => b ? resolve(b) : reject(new Error('Não foi possível exportar o card.')), 'image/png'))
}
