import type { Treino } from '../dados/modelos'
export async function criarCardTreino(treino: Treino, dados: { volume: number; exercicios: number; series: number; recordes: number; grupos: string[] }, foto?: File) {
  const canvas = document.createElement('canvas'); canvas.width = 1080; canvas.height = 1920
  const ctx = canvas.getContext('2d'); if (!ctx) throw new Error('Não foi possível criar a imagem.')
  const fundo = ctx.createLinearGradient(0, 0, 1080, 1920); fundo.addColorStop(0, '#263d2d'); fundo.addColorStop(.5, '#101f18'); fundo.addColorStop(1, '#0c1511'); ctx.fillStyle = fundo; ctx.fillRect(0, 0, 1080, 1920)
  ctx.strokeStyle = '#bcec8626'; ctx.lineWidth = 2; ctx.beginPath(); ctx.roundRect(40, 40, 1000, 1840, 48); ctx.stroke()
  const texto = (conteudo: string, x: number, y: number, tamanho: number, cor = '#edf4ee') => { ctx.fillStyle = cor; ctx.font = `600 ${tamanho}px system-ui`; ctx.fillText(conteudo, x, y, 910) }
  texto('vida em dia', 80, 130, 44, '#bcec86'); texto('UM TREINO DE CADA VEZ', 80, 185, 22, '#9eafa3')
  texto(treino.titulo ?? 'Treino livre', 80, 280, 64)
  texto(new Date(`${treino.data}T12:00:00`).toLocaleDateString('pt-BR'), 80, 340, 28, '#9eafa3')
  ctx.fillStyle = '#24392a'; ctx.beginPath(); ctx.roundRect(80, 410, 920, 600, 36); ctx.fill()
  if (foto) {
    const url = URL.createObjectURL(foto)
    try {
      const imagem = new Image(); imagem.src = url; await imagem.decode()
      const escala = Math.max(920 / imagem.naturalWidth, 600 / imagem.naturalHeight)
      ctx.save(); ctx.beginPath(); ctx.roundRect(80, 410, 920, 600, 32); ctx.clip()
      ctx.drawImage(imagem, 80 + (920 - imagem.naturalWidth * escala) / 2, 410 + (600 - imagem.naturalHeight * escala) / 2, imagem.naturalWidth * escala, imagem.naturalHeight * escala); ctx.restore()
    } finally { URL.revokeObjectURL(url) }
  } else {
    ctx.strokeStyle = '#bcec8640'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(820, 535, 165, 0, Math.PI * 2); ctx.stroke(); ctx.beginPath(); ctx.arc(820, 535, 125, 0, Math.PI * 2); ctx.stroke()
    texto('MAIS UM PASSO', 140, 560, 24, '#bcec86'); texto('Por você.', 140, 695, 100); texto('Pela sua evolução.', 140, 790, 64); texto('Treino concluído. Cada sessão conta.', 140, 920, 29, '#b8cdbb')
  }
  const minutos = treino.duracao_minutos ?? Math.max(0, Math.round((Date.parse(treino.fim!) - Date.parse(treino.inicio)) / 60000))
  const metricas = [['DURAÇÃO', `${minutos} min`], ['VOLUME TOTAL', `${dados.volume.toLocaleString('pt-BR')} kg`], ['EXERCÍCIOS', String(dados.exercicios)], ['SÉRIES CONCLUÍDAS', String(dados.series)], ['NOVOS RECORDES', String(dados.recordes)], ['CALORIAS ESTIMADAS', treino.peso_corporal ? `${treino.calorias ?? 0} kcal` : '—']]
  metricas.forEach(([rotulo, valor], i) => { const x = i % 2 ? 560 : 80; const y = 1060 + Math.floor(i / 2) * 185; ctx.fillStyle = '#ffffff06'; ctx.beginPath(); ctx.roundRect(x, y, 440, 165, 24); ctx.fill(); texto(rotulo, x + 28, y + 44, 21, '#9eafa3'); ctx.fillStyle = i < 2 ? '#bcec86' : '#edf4ee'; ctx.font = `600 ${i < 2 ? 66 : 52}px system-ui`; ctx.fillText(valor, x + 28, y + 122, 384) })
  const grupos = dados.grupos.join(' · ')
  const palavras = grupos.split(' '); let linha = ''; let y = 1700
  ctx.font = '500 26px system-ui'; ctx.fillStyle = '#bcec86'
  for (const palavra of palavras) { if (ctx.measureText(`${linha} ${palavra}`).width > 910) { ctx.fillText(linha, 80, y); y += 40; linha = palavra } else linha += `${linha ? ' ' : ''}${palavra}` }
  if (y < 1810) ctx.fillText(linha, 80, y)
  ctx.fillStyle = '#bcec86'; ctx.fillRect(80, 1780, 64, 4)
  texto('Seu ritmo. Sua constância. Sua conquista.', 80, 1840, 26, '#9eafa3')
  return new Promise<Blob>((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Não foi possível exportar a imagem.')), 'image/png'))
}
