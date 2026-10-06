function jpeg(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Não foi possível comprimir a foto.')), 'image/jpeg', 0.7))
}
export async function processarImagem(arquivo: File) {
  if (!arquivo.type.startsWith('image/')) throw new Error('Escolha uma imagem da câmera ou da galeria.')
  if (arquivo.size > 30 * 1024 * 1024) throw new Error('Escolha uma foto com até 30 MB.')
  const url = URL.createObjectURL(arquivo)
  try {
    const imagem = new Image()
    imagem.src = url
    await imagem.decode().catch(() => { throw new Error('Não foi possível abrir a imagem. Tente uma foto em JPEG ou PNG.') })
    const gerar = async (limite: number) => {
      const escala = Math.min(1, limite / Math.max(imagem.naturalWidth, imagem.naturalHeight))
      const canvas = document.createElement('canvas')
      canvas.width = Math.max(1, Math.round(imagem.naturalWidth * escala))
      canvas.height = Math.max(1, Math.round(imagem.naturalHeight * escala))
      const contexto = canvas.getContext('2d')
      if (!contexto) throw new Error('Este navegador não conseguiu processar a foto.')
      contexto.fillStyle = '#ffffff'; contexto.fillRect(0, 0, canvas.width, canvas.height)
      contexto.drawImage(imagem, 0, 0, canvas.width, canvas.height)
      return jpeg(canvas)
    }
    return { imagem: await gerar(1280), miniatura: await gerar(320) }
  } finally { URL.revokeObjectURL(url) }
}
