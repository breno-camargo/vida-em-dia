import { useEstadoTemporario } from '../hooks/useEstadoTemporario'
import { useTransicaoSuave } from '../hooks/useTransicaoSuave'
import { useEffect, useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Painel } from './Painel'
import { IndicadorMusculo } from './IndicadorMusculo'
import { GuiaExecucao } from './GuiaExecucao'
import { grupoMuscularVisual } from '../dados/grupoMuscularVisual'
import { tabela } from '../dados/banco'
import { criarRegistro, repositorio } from '../dados/repositorio'
import type { Exercicio, Foto } from '../dados/modelos'
import { processarImagem } from '../utilitarios/imagem'
import { dataLocal } from '../utilitarios/data'
import { ImagePlus } from 'lucide-react'
import { lazy, Suspense } from 'react'
const EvolucaoExercicio = lazy(() => import('./EvolucaoExercicio').then(modulo => ({ default: modulo.EvolucaoExercicio })))
function ImagemLocal({ foto }: { foto: Foto }) {
  const ref = useRef<HTMLImageElement>(null)
  useEffect(() => {
    const blob = foto.imagem_local ?? foto.miniatura_local
    if (!blob) return
    const nova = URL.createObjectURL(blob)
    if (ref.current) ref.current.src = nova
    return () => URL.revokeObjectURL(nova)
  }, [foto])
  return <img ref={ref} alt="Equipamento deste exercício" />
}
export function AjudaExercicio({ exercicio, online, fechar, editar }: { exercicio: Exercicio; online: boolean; fechar: () => void; editar: () => void }) {
  const fotos = useLiveQuery(() => tabela('fotos').where('exercicio_id').equals(exercicio.id).filter(f => !f.apagado_em).toArray(), [exercicio.id])
  const [erro, definirErro] = useState('')
  const [ocupado, definirOcupado] = useState(false)
  const [apagada, definirApagada] = useEstadoTemporario<Foto | null>(null)
  const [aba, definirAba] = useState('Como fazer')
  const conteudoAba = useRef<HTMLDivElement>(null)
  useTransicaoSuave(conteudoAba, aba)
  const video = exercicio.video_url
  const musculoPrincipal = grupoMuscularVisual(exercicio.grupo_muscular, exercicio.nome, exercicio.tipo)
  return <Painel titulo={exercicio.nome} fechar={fechar}>
    {musculoPrincipal && <div className="capa-exercicio capa-musculo"><div className="legenda-mapa-muscular"><span>Músculo principal</span><span>Área em destaque</span></div><IndicadorMusculo grupo={exercicio.grupo_muscular} nome={exercicio.nome} tipo={exercicio.tipo} completo /><span className="nome-mapa-muscular">{musculoPrincipal}</span></div>}
    <div className="titulo-detalhe"><span className="selo">{exercicio.grupo_muscular || 'Seu exercício'}</span><h2>{exercicio.nome}</h2></div>
    <div className="abas-detalhe" role="group" aria-label="Detalhes do exercício">{['Como fazer', 'Minhas notas', 'Equipamento', 'Evolução'].map(nome => <button key={nome} type="button" aria-pressed={aba === nome} onClick={() => definirAba(nome)}>{nome}</button>)}</div>
    <div ref={conteudoAba} className="conteudo-aba-exercicio">
    {aba === 'Como fazer' && <><GuiaExecucao nome={exercicio.nome} /><section className="ajuda-texto"><h3>Músculos informados</h3><p>{exercicio.musculos || exercicio.grupo_muscular || 'Ainda não informado.'}</p></section></>}
    {aba === 'Minhas notas' && <><section className="ajuda-texto"><h3>Sua anotação</h3><p>{exercicio.nota_fixa || 'Adicione a regulagem da máquina ou um lembrete pessoal ao editar.'}</p><h3>Suas instruções</h3>{exercicio.como_fazer.trim() ? <ol className="passos-exercicio">{exercicio.como_fazer.split(/\n+/).filter(linha => linha.trim()).map((linha, indice) => <li key={indice}>{linha.replace(/^\s*\d+[.)]\s*/, '')}</li>)}</ol> : <p>Você pode salvar suas próprias instruções ao editar.</p>}</section>
      {video && (online ? <a className="botao-secundario" href={video} target="_blank" rel="noopener noreferrer">Abrir seu vídeo de referência</a> : <p className="nota">Conecte-se para abrir seu vídeo de referência.</p>)}
    </>}
    {aba === 'Evolução' && <Suspense fallback={<p role="status">Carregando evolução…</p>}><EvolucaoExercicio id={exercicio.id} /></Suspense>}
    {aba === 'Equipamento' && <><section className="ajuda-texto"><h3>Equipamento</h3><p>{exercicio.equipamento || 'Ainda não informado. Cadastre o nome da máquina ao editar.'}</p></section>
    <div className="fotos-maquina">{fotos?.map(foto => <figure key={foto.id}><ImagemLocal foto={foto} />
      <button className="botao-secundario" disabled={ocupado} onClick={async () => { try { await repositorio('fotos').apagar(foto.id); definirApagada(foto) } catch { definirErro('Não foi possível remover a foto.') } }}>Remover foto</button></figure>)}</div>
    <label className="anexar anexar-maquina" aria-disabled={ocupado}><ImagePlus size={22} aria-hidden="true" /><span><strong>{ocupado ? 'Salvando foto…' : 'Adicionar foto do equipamento'}</strong><small>Use a câmera ou escolha uma foto da galeria</small></span><input type="file" accept="image/*" aria-label="Adicionar foto do equipamento" disabled={ocupado} onChange={async e => {
      const arquivo = e.target.files?.[0]; e.target.value = ''; if (!arquivo) return
      definirOcupado(true); definirErro('')
      try { const foto = await processarImagem(arquivo); await tabela('fotos').add({ ...criarRegistro(exercicio.user_id), tipo: 'maquina', data: dataLocal(), angulo: null, exercicio_id: exercicio.id, imagem_local: foto.imagem, miniatura_local: foto.miniatura, tamanho_bytes: foto.imagem.size + foto.miniatura.size }) }
      catch (error) { definirErro(error instanceof Error ? error.message : 'Não foi possível salvar a foto. Confira o espaço disponível.') }
      finally { definirOcupado(false) }
    }} /></label>
    {apagada && <button className="botao-secundario" onClick={async () => { try { await repositorio('fotos').salvar({ ...apagada, apagado_em: null }); definirApagada(null) } catch { definirErro('Não foi possível desfazer.') } }}>Desfazer remoção da foto</button>}
    {erro && <p role="alert" className="erro">{erro}</p>}
    </>}
    </div>
    <button className="botao-secundario editar-detalhe" onClick={editar}>Editar detalhes do exercício</button>
  </Painel>
}
