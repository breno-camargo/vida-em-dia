import { ClipboardList, Share2, ChevronDown } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useHistorico, removerTreino, restaurarTreino } from '../dados/historico'
import { sessoesExercicio } from '../utilitarios/evolucao'
import { volumeSeries } from '../utilitarios/treino'
import { EvolucaoExercicio } from '../componentes/EvolucaoExercicio'
import { CardCompartilhavel } from '../componentes/CardCompartilhavel'
import { Painel } from '../componentes/Painel'
export default function Evolucao() {
  const historico = useHistorico()
  const [aba, definirAba] = useState<'historico' | 'exercicios'>('historico')
  const [busca, definirBusca] = useState('')
  const [detalhe, definirDetalhe] = useState<string>()
  const [exercicio, definirExercicio] = useState<string>()
  const [compartilhar, definirCompartilhar] = useState<string>()
  const [removido, definirRemovido] = useState<string>()
  const [erro, definirErro] = useState('')
  const [ocupado, definirOcupado] = useState(false)
  const resumos = useMemo(() => {
    if (!historico) return []
    return historico.treinos.map(t => {
      const series = historico.series.filter(s => s.treino_id === t.id && s.concluida_em)
      const ids = [...new Set(series.map(s => s.exercicio_id))]
      const recordes = ids.flatMap(id => sessoesExercicio(historico.treinos, historico.series, id).find(s => s.treino.id === t.id)?.recordes ?? [])
      const grupos = [...new Set(ids.map(id => historico.exercicios.find(e => e.id === id)?.grupo_muscular).filter((g): g is string => !!g))]
      return { treino: t, dados: { volume: volumeSeries(series), exercicios: ids.length, series: series.length, recordes: recordes.length, grupos }, series }
    }).sort((a,b) => b.treino.inicio.localeCompare(a.treino.inicio))
  }, [historico])
  if (!historico) return <p role="status">Carregando histórico…</p>
  const normalizar = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
  const selecionado = resumos.find(r => r.treino.id === detalhe)
  const card = resumos.find(r => r.treino.id === compartilhar)
  const disponiveis = historico.exercicios.filter(ex => historico.series.some(s => s.exercicio_id === ex.id && s.concluida_em && historico.treinos.some(t => t.id === s.treino_id))).sort((a,b) => a.nome.localeCompare(b.nome, 'pt-BR'))
  return <div className="tela-evolucao">
    <div className="abas-treino"><button aria-pressed={aba === 'historico'} onClick={() => definirAba('historico')}>Meus treinos</button><button aria-pressed={aba === 'exercicios'} onClick={() => definirAba('exercicios')}>Por exercício</button></div>
    <div className="formulario busca-historico"><label>{aba === 'historico' ? 'Encontrar um treino' : 'Encontrar um exercício'}<input type="search" value={busca} onChange={e => definirBusca(e.target.value)} placeholder={aba === 'historico' ? 'Ex.: treino A, supino ou 06/10/2026' : 'Ex.: supino ou agachamento'} aria-describedby="dica-busca-historico" /></label><small id="dica-busca-historico">{aba === 'historico' ? 'Digite o nome da ficha, um exercício realizado ou a data (dia/mês/ano). Pode usar só uma parte do nome.' : 'Digite o nome ou parte do nome do exercício para ver suas sessões e gráficos.'}</small></div>
    {erro && <p className="erro" role="alert">{erro}</p>}
    {removido && <div className="aviso-remocao"><span>Treino removido do histórico</span><button type="button" onClick={async () => { try { await restaurarTreino(removido); definirRemovido(undefined) } catch { definirErro('Não foi possível desfazer.') } }}>Desfazer</button></div>}
    {!resumos.length && <section className="painel historico-vazio"><h2>Seu caminho começa aqui</h2><p>Finalize um treino para ver seu histórico e evolução.</p></section>}
    {aba === 'historico' ? resumos.filter(r => normalizar(`${r.treino.titulo} ${r.treino.data} ${new Date(`${r.treino.data}T12:00:00`).toLocaleDateString('pt-BR')} ${r.series.map(s => historico.exercicios.find(e => e.id === s.exercicio_id)?.nome).join(' ')}`).includes(normalizar(busca))).map(r => <section className="painel historico-cartao" key={r.treino.id}><small>{new Date(`${r.treino.data}T12:00:00`).toLocaleDateString('pt-BR')}</small><h2>{r.treino.titulo ?? 'Treino livre'}</h2><p>{r.treino.duracao_minutos ?? 0} min · {r.dados.exercicios} exercícios · {r.dados.volume.toLocaleString('pt-BR')} kg</p>{r.dados.recordes > 0 && <p className="verde">{r.dados.recordes} novos recordes</p>}<div className="acoes"><button onClick={() => definirDetalhe(r.treino.id)}><ClipboardList size={16} aria-hidden="true" />Ver treino</button><button onClick={() => definirCompartilhar(r.treino.id)}><Share2 size={16} aria-hidden="true" />Compartilhar</button></div></section>) : disponiveis.filter(ex => normalizar(ex.nome).includes(normalizar(busca))).map(ex => <button className="exercicio-historico" key={ex.id} onClick={() => definirExercicio(ex.id)}><span>{ex.nome}<small>{ex.grupo_muscular}</small></span><span>→</span></button>)}
    {exercicio && <Painel titulo={historico.exercicios.find(e => e.id === exercicio)?.nome ?? 'Evolução'} fechar={() => definirExercicio(undefined)}><EvolucaoExercicio id={exercicio} /></Painel>}
    {selecionado && <Painel titulo={selecionado.treino.titulo ?? 'Treino'} fechar={() => definirDetalhe(undefined)}><div className="detalhe-historico"><p className="nota-resumo">{new Date(`${selecionado.treino.data}T12:00:00`).toLocaleDateString('pt-BR')} · {selecionado.dados.volume.toLocaleString('pt-BR')} kg de volume</p>{[...new Set(selecionado.series.map(s => s.exercicio_id))].map(id => <details className="painel exercicio-historico-recolhivel" key={id}><summary><span>{historico.itens.find(i => i.treino_id === selecionado.treino.id && i.exercicio_id === id)?.nome ?? historico.exercicios.find(e => e.id === id)?.nome ?? 'Exercício'}</span><ChevronDown size={18} aria-hidden="true" /></summary><div>{selecionado.series.filter(s => s.exercicio_id === id).sort((a,b) => a.numero_serie - b.numero_serie).map(s => <p className="linha-historico-serie" key={s.id}><span>{s.numero_serie}</span><span>{s.repeticoes} repetições{s.modo_carga === 'peso_corporal' ? ' · Peso corporal' : ` com ${s.peso_total.toLocaleString('pt-BR')} kg`}{s.tipo !== 'normal' && ` · ${s.tipo === 'aquecimento' ? 'Aquecimento' : s.tipo === 'falha' ? 'Até a falha' : 'Drop set'}`}{s.tipo === 'dropset' && s.reducoes?.map((r, i) => <small key={i}> · redução: {r.repeticoes} reps × {r.peso_digitado} kg {s.modo_carga === 'por_lado' ? 'por lado' : ''}</small>)}</span></p>)}</div></details>)}{selecionado.treino.observacao && <p className="ajuda-texto">{selecionado.treino.observacao}</p>}<button className="botao-principal largura-total" onClick={() => { definirDetalhe(undefined); definirCompartilhar(selecionado.treino.id) }}>Ver card do treino</button><button className="botao-secundario excluir-historico" disabled={ocupado} onClick={async () => { definirOcupado(true); try { await removerTreino(selecionado.treino.id); definirRemovido(selecionado.treino.id); definirDetalhe(undefined) } catch { definirErro('Não foi possível remover o treino.') } finally { definirOcupado(false) } }}>Remover do histórico</button></div></Painel>}
    {card && <CardCompartilhavel treino={card.treino} dados={card.dados} fechar={() => definirCompartilhar(undefined)} />}
  </div>
}






