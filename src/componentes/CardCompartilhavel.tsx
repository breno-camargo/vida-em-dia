import { useEffect, useState } from 'react'
import { Copy, Download, ImagePlus, Share2, Type } from 'lucide-react'
import { Painel } from './Painel'
import type { Treino } from '../dados/modelos'
import { textoTreino, type DadosCard, type ModeloCard } from '../utilitarios/cardTreino'
import { criarImagensCardAprovado } from '../utilitarios/imagensCardAprovado'
const modelos: { id: ModeloCard; nome: string; detalhe: string }[] = [
  { id: 'adesivo', nome: 'Tipográfico', detalhe: 'Adesivo transparente' },
  { id: 'foto', nome: 'Foto', detalhe: 'Sua foto em destaque' },
  { id: 'minimalista', nome: 'Editorial', detalhe: 'Números protagonistas' },
]
export function CardCompartilhavel({ treino, dados, fechar }: { treino: Treino; dados: DadosCard; fechar: () => void }) {
  const [foto, definirFoto] = useState<File>()
  const [modelo, definirModelo] = useState<ModeloCard>('adesivo')
  const [cor, definirCor] = useState<'clara' | 'escura'>('clara')
  const [resultado, definirResultado] = useState<{ treino: Treino; dados: DadosCard; foto?: File; modelo: ModeloCard; cor: string; previaUrl?: string; blob?: Blob; url?: string; erro?: string }>()
  const [erro, definirErro] = useState('')
  const [aviso, definirAviso] = useState('')
  const [mostrarTexto, definirMostrarTexto] = useState(false)
  const [ocupado, definirOcupado] = useState(false)
  const atual = resultado?.treino === treino && resultado.dados === dados && resultado.foto === foto && resultado.modelo === modelo && resultado.cor === cor ? resultado : undefined
  const blob = atual?.blob, url = atual?.url
  const adesivo = modelo === 'adesivo'
  const aceitaFoto = modelo !== 'minimalista'
  const nomeArquivo = `vida-em-dia-${treino.data}-${modelo}.png`
  const podeCopiarImagem = typeof ClipboardItem !== 'undefined' && typeof navigator.clipboard?.write === 'function'
  useEffect(() => {
    let ativo = true; let endereco = ''; let previaEndereco = ''
    void criarImagensCardAprovado(treino, dados, foto, { modelo, cor }).then(imagens => {
      if (!ativo) return
      endereco = URL.createObjectURL(imagens.blob)
      previaEndereco = imagens.previa === imagens.blob ? endereco : URL.createObjectURL(imagens.previa)
      definirResultado({ treino, dados, foto, modelo, cor, blob: imagens.blob, url: endereco, previaUrl: previaEndereco })
    }).catch(() => { if (ativo) definirResultado({ treino, dados, foto, modelo, cor, erro: 'Não foi possível gerar o card. Tente outra foto ou modelo.' }) })
    return () => { ativo = false; if (endereco) URL.revokeObjectURL(endereco); if (previaEndereco && previaEndereco !== endereco) URL.revokeObjectURL(previaEndereco) }
  }, [treino, dados, foto, modelo, cor])
  const limparAvisos = () => { definirErro(''); definirAviso('') }
  return <Painel titulo="Seu treino, do seu jeito" fechar={fechar}>
    <div className="criador-card">
      <p className="nota-resumo">Escolha um modelo para compartilhar sua conquista.</p>
      <div className="modelos-card" aria-label="Modelo do card">{modelos.map(m => <button type="button" key={m.id} aria-pressed={modelo === m.id} disabled={ocupado} onClick={() => { definirModelo(m.id); limparAvisos() }}><span className={`amostra-card amostra-${m.id}`} aria-hidden="true"><span /><span /><span /></span><strong>{m.nome}</strong><small>{m.detalhe}</small></button>)}</div>
      {adesivo && <div className="opcoes-adesivo"><span>Cor do texto</span><button type="button" disabled={ocupado} aria-pressed={cor === 'clara'} onClick={() => { definirCor('clara'); limparAvisos() }}>Claro</button><button type="button" disabled={ocupado} aria-pressed={cor === 'escura'} onClick={() => { definirCor('escura'); limparAvisos() }}>Escuro</button></div>}
      <div className={`area-preview-card${adesivo ? ` preview-aprovada preview-adesivo-${cor}${foto ? ' com-foto' : ''}` : ''}`} aria-busy={!atual}>
        {url ? <img className="preview-card" src={adesivo && !foto ? url : atual?.previaUrl ?? url} alt={adesivo ? 'Adesivo transparente sobre fundo de prévia' : 'Prévia do card com os resultados do treino'} /> : <p role="status">{atual?.erro ?? 'Preparando seu card…'}</p>}
      </div>
      {adesivo && <p className="nota-resumo">{foto ? 'Foto só para visualizar. O PNG sai com fundo transparente.' : 'O quadriculado indica transparência e não aparece no PNG.'}</p>}
      {aceitaFoto && <><div className={`acoes-foto-card${foto ? '' : ' sem-foto'}`}><label className="foto-card botao-secundario"><ImagePlus size={18} aria-hidden="true" />{foto ? 'Trocar foto' : 'Adicionar sua foto'}<input type="file" accept="image/*" disabled={ocupado} onChange={e => { definirFoto(e.target.files?.[0]); limparAvisos() }} /></label>{foto && <button type="button" className="botao-destrutivo remover-foto-card" disabled={ocupado} onClick={() => { definirFoto(undefined); limparAvisos() }}>Remover foto</button>}</div><p className="nota-resumo">Sua foto não fica salva no app.</p></>}
      {adesivo && <p className="dica-story">Abra sua foto no editor de stories. Copie o adesivo e tente colar sobre ela. Se o editor não aceitar, baixe o PNG e adicione como imagem.</p>}
      {(erro || atual?.erro) && <p className="erro" role="alert">{erro || atual?.erro}</p>}
      {aviso && <p className="aviso-card" role="status">{aviso}</p>}
      <div className="acoes-criador-card">
        {podeCopiarImagem && <button type="button" className={adesivo ? 'botao-principal' : 'botao-secundario'} disabled={!blob || ocupado} onClick={async () => {
          if (!blob) return
          definirOcupado(true); limparAvisos()
          try { await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]); definirAviso(adesivo ? 'Adesivo copiado. Abra seu story e tente colar.' : 'Imagem copiada.') }
          catch { definirErro('Não foi possível copiar a imagem neste navegador. Use Baixar PNG ou Compartilhar.') }
          finally { definirOcupado(false) }
        }}><Copy size={17} aria-hidden="true" />{adesivo ? 'Copiar adesivo' : 'Copiar imagem'}</button>}
        <button type="button" className={adesivo && podeCopiarImagem ? 'botao-secundario' : 'botao-principal'} disabled={!blob || ocupado} onClick={async () => {
          if (!blob || !url) return
          const arquivo = new File([blob], nomeArquivo, { type: 'image/png' })
          definirOcupado(true); limparAvisos()
          try {
            if (navigator.canShare?.({ files: [arquivo] })) await navigator.share({ files: [arquivo], title: 'Meu treino no Vida em Dia' })
            else { const link = document.createElement('a'); link.href = url; link.download = nomeArquivo; link.click(); definirAviso('Download solicitado. Confira o arquivo nos downloads.') }
          } catch (error) { if (!(error instanceof DOMException && error.name === 'AbortError')) definirErro('Não foi possível compartilhar. Use Baixar PNG.') }
          finally { definirOcupado(false) }
        }}><Share2 size={17} aria-hidden="true" />Compartilhar</button>
        {url && <a className="botao-secundario baixar-card" href={url} download={nomeArquivo}><Download size={17} aria-hidden="true" />Baixar PNG</a>}
        <button type="button" className="botao-secundario" disabled={ocupado} onClick={async () => {
          limparAvisos()
          try {
            if (!navigator.clipboard?.writeText) throw new Error('Indisponível')
            await navigator.clipboard.writeText(textoTreino(treino, dados)); definirAviso('Texto do treino copiado.')
          } catch { definirMostrarTexto(true); definirAviso('Selecione e copie o texto abaixo.') }
        }}><Type size={17} aria-hidden="true" />Copiar texto</button>
      </div>
      {mostrarTexto && <label className="texto-compartilhar">Texto do treino<textarea readOnly rows={7} value={textoTreino(treino, dados)} onFocus={e => e.currentTarget.select()} /></label>}
    </div>
  </Painel>
}
