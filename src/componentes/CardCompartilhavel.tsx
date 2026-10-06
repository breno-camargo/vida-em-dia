import { useEffect, useState } from 'react'
import { Painel } from './Painel'
import type { Treino } from '../dados/modelos'
import { criarCardTreino } from '../utilitarios/cardTreino'
export function CardCompartilhavel({ treino, dados, fechar }: { treino: Treino; dados: Parameters<typeof criarCardTreino>[1]; fechar: () => void }) {
  const [foto, definirFoto] = useState<File>()
  const [blob, definirBlob] = useState<Blob>()
  const [url, definirUrl] = useState('')
  const [erro, definirErro] = useState('')
  const [ocupado, definirOcupado] = useState(false)
  useEffect(() => {
    let ativo = true; let endereco = ''
    void criarCardTreino(treino, dados, foto).then(imagem => { if (!ativo) return; endereco = URL.createObjectURL(imagem); definirBlob(imagem); definirUrl(endereco) }).catch(() => { if (ativo) definirErro('Não foi possível gerar o card. Tente outra foto.') })
    return () => { ativo = false; if (endereco) URL.revokeObjectURL(endereco) }
  }, [treino, dados, foto])
  return <Painel titulo="Compartilhar conquista" fechar={fechar}><p className="subtitulo-seletor">Imagem para Stories · foto opcional</p>{url ? <img className="preview-card" src={url} alt="Card com resultados reais do treino" /> : <p role="status">Gerando imagem…</p>}<label className="foto-card">{foto ? 'Trocar foto' : 'Adicionar foto ao card'}<input type="file" accept="image/*" onChange={e => { definirFoto(e.target.files?.[0]); definirErro('') }} /></label>{foto && <button className="botao-secundario remover-foto-card" onClick={() => definirFoto(undefined)}>Remover foto</button>}<p className="nota-resumo">A foto é usada apenas neste card e não é armazenada no app.</p>{erro && <p className="erro" role="alert">{erro}</p>}<button className="botao-principal largura-total" disabled={!blob || ocupado} onClick={async () => {
    if (!blob) return
    const arquivo = new File([blob], `vida-em-dia-${treino.data}.png`, { type: 'image/png' })
    definirOcupado(true)
    try { if (navigator.canShare?.({ files: [arquivo] })) await navigator.share({ files: [arquivo], title: 'Meu treino no Vida em Dia' }); else { const link = document.createElement('a'); link.href = url; link.download = arquivo.name; link.click() } } catch (error) { if (!(error instanceof DOMException && error.name === 'AbortError')) definirErro('Não foi possível compartilhar. Use Baixar imagem.') } finally { definirOcupado(false) }
  }}>Compartilhar imagem</button>{url && <a className="botao-secundario baixar-card" href={url} download={`vida-em-dia-${treino.data}.png`}>Baixar imagem</a>}</Painel>
}



