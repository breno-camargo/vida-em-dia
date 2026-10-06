import { useEffect, useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Painel } from './Painel'
import { tabela } from '../dados/banco'
import { criarRegistro, repositorio } from '../dados/repositorio'
import type { Exercicio, Foto } from '../dados/modelos'
import { processarImagem } from '../utilitarios/imagem'
import { dataLocal } from '../utilitarios/data'
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
  const video = exercicio.video_url || `https://www.youtube.com/results?search_query=${encodeURIComponent(`${exercicio.nome} execução correta`)}`
  return <Painel titulo={exercicio.nome} fechar={fechar}>
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
    <section className="ajuda-texto"><h3>Nota fixa</h3><p>{exercicio.nota_fixa || 'Adicione a regulagem da máquina ou uma dica pessoal.'}</p><h3>Como fazer</h3><p>{exercicio.como_fazer || 'Você pode escrever seus passos de execução ao editar.'}</p><h3>Músculos trabalhados</h3><p>{exercicio.musculos || 'Ainda não informado.'}</p></section>
    {online ? <a className="botao-principal" href={video} target="_blank" rel="noopener noreferrer">Ver execução</a> : <p className="nota">Conecte-se à internet para abrir o vídeo. Suas fotos e instruções continuam disponíveis offline.</p>}
    <button className="botao-secundario" onClick={editar}>Editar instruções e vídeo</button>
  </Painel>
}
