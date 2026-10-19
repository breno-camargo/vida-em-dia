import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { tabela } from '../dados/banco'
import { gruposDuplicados, unirExercicios } from '../dados/unirExercicios'
import { Painel } from './Painel'

export function RevisarDuplicatas() {
 const dados = useLiveQuery(async () => ({ grupos: gruposDuplicados(await tabela('exercicios').toArray()), fotos: await tabela('fotos').filter(f => !f.apagado_em).toArray() }))
 const [aberto, abrir] = useState(false), [manter, selecionar] = useState('')
 const [erro, definirErro] = useState(''), [ocupado, ocupar] = useState(false), [mensagem, avisar] = useState('')
 const [indice, escolherGrupo] = useState(0)
 const grupo = dados?.grupos[indice] ?? dados?.grupos[0]
 if (dados && !dados.grupos.length && !aberto) return null
 return <><button type="button" className="botao-secundario" onClick={() => { abrir(true); selecionar(''); definirErro('') }}>Revisar duplicatas ({dados?.grupos.length ?? 0})</button>{aberto && <Painel titulo="Revisar duplicatas" fechar={() => { if (!ocupado) abrir(false) }}><div className="formulario">
 <p>Somente cópias com conteúdo e proprietário iguais aparecem aqui. Faça um backup com fotos antes de unir. A mudança poderá ser sincronizada com sua conta.</p>
 {!!dados?.grupos.length && <button type="button" className="botao-secundario" disabled={ocupado} onClick={async () => {
  if (!window.confirm(`Deixar um cadastro por exercício em ${dados.grupos.length} grupos? Histórico e fotos serão preservados. Grupos com conflito serão mantidos para revisão.`)) return
  ocupar(true); definirErro(''); avisar('Unindo cópias…')
  let unidos = 0, bloqueados = 0
  for (const grupoAtual of dados.grupos) {
   const copias = [...grupoAtual].sort((a,b) => a.id.localeCompare(b.id))
   try { await unirExercicios(copias.map(e => e.id), copias[0].id); unidos++ } catch { bloqueados++ }
  }
  selecionar(''); escolherGrupo(0); ocupar(false)
  avisar(`${unidos} grupos unidos. ${bloqueados ? `${bloqueados} grupos precisam de revisão e foram preservados.` : 'Agora há um cadastro por exercício nestes grupos.'}`)
 }}>Deixar um de cada</button>}
 {!!dados?.grupos.length && <label>Grupo para revisar<select value={dados.grupos[indice] ? indice : 0} disabled={ocupado} onChange={e => { escolherGrupo(Number(e.target.value)); selecionar(''); definirErro(''); avisar('') }}>{dados.grupos.map((g, i) => <option key={g[0].id} value={i}>{g[0].nome} ({g.length} cópias)</option>)}</select></label>}
 {grupo ? <><h3>{grupo[0].nome}</h3><p>Escolha o cadastro que ficará na biblioteca. Histórico, fotos e vínculos serão reunidos nele. As outras cópias ficarão marcadas como removidas. Não há desfazer automático.</p>
 {grupo.map(ex => <label className="opcao-copia-exercicio" key={ex.id}><input type="radio" name="manter-exercicio" checked={manter === ex.id} disabled={ocupado} onChange={() => selecionar(ex.id)} />Criado em {new Date(ex.criado_em).toLocaleString('pt-BR')} · {(dados?.fotos ?? []).filter(f => f.exercicio_id === ex.id).length} fotos · Cópia {grupo.indexOf(ex) + 1}</label>)}
 <button type="button" className="botao-principal" disabled={ocupado || !manter} onClick={async () => { if (!window.confirm('Confirmar a união destas cópias? Histórico e fotos serão vinculados ao cadastro escolhido.')) return; ocupar(true); definirErro(''); try { await unirExercicios(grupo.map(e => e.id), manter); selecionar(''); avisar('Cópias unidas. Histórico e fotos preservados.') } catch(e) { definirErro(e instanceof Error ? e.message : 'Não foi possível unir.') } finally { ocupar(false) } }}>{ocupado ? 'Unindo…' : 'Confirmar união'}</button></> : <p>Nenhuma cópia com conteúdo idêntico para unir.</p>}
 {mensagem && <p role="status">{mensagem}</p>}{erro && <p role="alert" className="erro">{erro}</p>}
 </div></Painel>}</>
}
