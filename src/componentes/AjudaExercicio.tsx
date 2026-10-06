import { useEffect, useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Painel } from './Painel'
import { tabela } from '../dados/banco'
import { criarRegistro, repositorio } from '../dados/repositorio'
import type { Exercicio, Foto } from '../dados/modelos'
import { processarImagem } from '../utilitarios/imagem'
import { dataLocal } from '../utilitarios/data'
import { Dumbbell } from 'lucide-react'
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
  const [apagada, definirApagada] = useState<Foto | null>(null)
  const [aba, definirAba] = useState('Músculos')
  const video = exercicio.video_url || `https://www.youtube.com/results?search_query=${encodeURIComponent(`${exercicio.nome} execução correta`)}`
  return <Painel titulo={exercicio.nome} fechar={fechar}>
    <div className="capa-exercicio">{fotos?.[0] ? <ImagemLocal foto={fotos[0]} /> : <Dumbbell size={60} aria-hidden="true" />}</div>
    <div className="titulo-detalhe"><span className="selo">{exercicio.grupo_muscular || 'Seu exercício'}</span><h2>{exercicio.nome}</h2></div>
    <div className="abas-detalhe" role="group" aria-label="Detalhes do exercício">{['Músculos', 'Instruções', 'Equipamento', 'Evolução'].map(nome => <button key={nome} type="button" aria-pressed={aba === nome} onClick={() => definirAba(nome)}>{nome}</button>)}</div>
    {aba === 'Músculos' && <section className="ajuda-texto"><h3>Músculos trabalhados</h3><p>{exercicio.musculos || 'Ainda não informado. Você pode adicionar ao editar.'}</p></section>}
    {aba === 'Instruções' && <><section className="ajuda-texto"><h3>Nota fixa</h3><p>{exercicio.nota_fixa || 'Adicione a regulagem da máquina ou uma dica pessoal.'}</p><h3>Como fazer</h3>{exercicio.como_fazer.trim() ? <ol className="passos-exercicio">{exercicio.como_fazer.split(/\n+/).filter(linha => linha.trim()).map((linha, indice) => <li key={indice}>{linha.replace(/^\s*\d+[.)]\s*/, '')}</li>)}</ol> : <p>Você pode escrever um passo por linha ao editar.</p>}</section>
      {online ? <a className="botao-principal" href={video} target="_blank" rel="noopener noreferrer">Ver execução</a> : <p className="nota">Conecte-se à internet para abrir o vídeo. Suas fotos e instruções continuam disponíveis offline.</p>}
    </>}
    {aba === 'Evolução' && <section className="painel"><h2>Seu desempenho</h2><p>Histórico, recordes e gráficos deste exercício estarão aqui na ETAPA 4.</p></section>}
    {aba === 'Equipamento' && <><section className="ajuda-texto"><h3>Equipamento</h3><p>{exercicio.equipamento || 'Ainda não informado. Cadastre o nome da máquina ao editar.'}</p></section>
    <div className="fotos-maquina">{fotos?.map(foto => <figure key={foto.id}><ImagemLocal foto={foto} />
      <button className="botao-secundario" disabled={ocupado} onClick={async () => { try { await repositorio('fotos').apagar(foto.id); definirApagada(foto) } catch { definirErro('Não foi possível remover a foto.') } }}>Remover foto</button></figure>)}</div>
    <label className="anexar">{ocupado ? 'Comprimindo e salvando…' : 'Adicionar foto da máquina'}<input type="file" accept="image/*" disabled={ocupado} onChange={async e => {
      const arquivo = e.target.files?.[0]; e.target.value = ''; if (!arquivo) return
      definirOcupado(true); definirErro('')
      try { const foto = await processarImagem(arquivo); await tabela('fotos').add({ ...criarRegistro(exercicio.user_id), tipo: 'maquina', data: dataLocal(), angulo: null, exercicio_id: exercicio.id, imagem_local: foto.imagem, miniatura_local: foto.miniatura, tamanho_bytes: foto.imagem.size + foto.miniatura.size }) }
      catch (error) { definirErro(error instanceof Error ? error.message : 'Não foi possível salvar a foto. Confira o espaço disponível.') }
      finally { definirOcupado(false) }
    }} /></label>
    {apagada && <button className="botao-secundario" onClick={async () => { try { await repositorio('fotos').salvar({ ...apagada, apagado_em: null }); definirApagada(null) } catch { definirErro('Não foi possível desfazer.') } }}>Desfazer remoção da foto</button>}
    {erro && <p role="alert" className="erro">{erro}</p>}
    </>}
    <button className="botao-secundario editar-detalhe" onClick={editar}>Editar detalhes do exercício</button>
  </Painel>
}
