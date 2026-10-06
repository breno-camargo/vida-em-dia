import type { Treino } from '../dados/modelos'
export async function criarCardTreino(treino: Treino, dados: { volume: number; exercicios: number; series: number; recordes: number; grupos: string[] }, foto?: File) {
  const canvas = document.createElement('canvas'); canvas.width = 1080; canvas.height = 1920
  const ctx = canvas.getContext('2d'); if (!ctx) throw new Error('Não foi possível criar a imagem.')
  ctx.fillStyle = '#101714'; ctx.fillRect(0, 0, 1080, 1920)
  const texto = (conteudo: string, x: number, y: number, tamanho: number, cor = '#edf4ee') => { ctx.fillStyle = cor; ctx.font = `600 ${tamanho}px system-ui`; ctx.fillText(conteudo, x, y, 910) }
  texto('vida em dia', 80, 120, 42, '#bcec86'); texto('UM TREINO DE CADA VEZ', 80, 175, 22, '#9eafa3')
  texto(treino.titulo ?? 'Treino livre', 80, 280, 64)
  texto(new Date(`${treino.data}T12:00:00`).toLocaleDateString('pt-BR'), 80, 340, 28, '#9eafa3')
  ctx.fillStyle = '#1b2b20'; ctx.beginPath(); ctx.roundRect(80, 410, 920, 600, 32); ctx.fill()
  if (foto) {
    const url = URL.createObjectURL(foto)
    try {
      const imagem = new Image(); imagem.src = url; await imagem.decode()
      const escala = Math.max(920 / imagem.naturalWidth, 600 / imagem.naturalHeight)
      ctx.save(); ctx.beginPath(); ctx.roundRect(80, 410, 920, 600, 32); ctx.clip()
      ctx.drawImage(imagem, 80 + (920 - imagem.naturalWidth * escala) / 2, 410 + (600 - imagem.naturalHeight * escala) / 2, imagem.naturalWidth * escala, imagem.naturalHeight * escala); ctx.restore()
    } finally { URL.revokeObjectURL(url) }
  } else { texto('TREINO CONCLUÍDO', 150, 665, 56, '#bcec86'); texto('Seu ritmo. Sua evolução.', 150, 735, 34) }
  const minutos = treino.duracao_minutos ?? Math.max(0, Math.round((Date.parse(treino.fim!) - Date.parse(treino.inicio)) / 60000))
  const metricas = [['DURAÇÃO', `${minutos} min`], ['VOLUME TOTAL', `${dados.volume.toLocaleString('pt-BR')} kg`], ['EXERCÍCIOS', String(dados.exercicios)], ['SÉRIES CONCLUÍDAS', String(dados.series)], ['NOVOS RECORDES', String(dados.recordes)], ['CALORIAS ESTIMADAS', treino.peso_corporal ? `${treino.calorias ?? 0} kcal` : '—']]
  metricas.forEach(([rotulo, valor], i) => { const x = i % 2 ? 580 : 80; const y = 1110 + Math.floor(i / 2) * 180; texto(rotulo, x, y, 22, '#9eafa3'); ctx.fillStyle = '#edf4ee'; ctx.font = '600 56px system-ui'; ctx.fillText(valor, x, y + 76, 420) })
  const grupos = dados.grupos.join(' · ')
  const palavras = grupos.split(' '); let linha = ''; let y = 1680
  ctx.font = '500 26px system-ui'; ctx.fillStyle = '#bcec86'
  for (const palavra of palavras) { if (ctx.measureText(`${linha} ${palavra}`).width > 910) { ctx.fillText(linha, 80, y); y += 40; linha = palavra } else linha += `${linha ? ' ' : ''}${palavra}` }
  if (y < 1810) ctx.fillText(linha, 80, y)
  texto('Feito por você. Salvo no Vida em Dia.', 80, 1840, 24, '#9eafa3')
  return new Promise<Blob>((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Não foi possível exportar a imagem.')), 'image/png'))
}
