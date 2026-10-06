import { useState } from 'react'
import { useHistorico } from '../dados/historico'
import { desempenho, sessoesExercicio, sugestao, estagnado, efetivas } from '../utilitarios/evolucao'
import { GraficoCarga } from './GraficoCarga'
export function EvolucaoExercicio({ id }: { id: string }) {
  const historico = useHistorico()
  const [metrica, definirMetrica] = useState<'carga' | 'volume'>('carga')
  if (!historico) return <p role="status">Carregando evolução…</p>
  const sessoes = sessoesExercicio(historico.treinos, historico.series, id)
  const validas = sessoes.filter(s => efetivas(s.series).length)
  const ultima = validas.at(-1)
  const anterior = validas.at(-2)
  const ex = historico.exercicios.find(e => e.id === id)
  const semPeso = ex?.modo_carga === 'peso_corporal'
  const repsSessao = (series: typeof historico.series) => efetivas(series).reduce((total, s) => total + s.repeticoes, 0)
  const alvo = ex?.alvo_reps ?? 12
  const recordes = desempenho(validas.flatMap(s => s.series))
  const diferenca = ultima && anterior ? ultima.carga - anterior.carga : null
  return <section className="evolucao-exercicio">
    {semPeso ? <><div className="metricas-resumo"><div><span>Mais repetições / série</span><strong>{Math.max(0, ...validas.flatMap(s => efetivas(s.series).map(serie => serie.repeticoes)))}</strong></div><div><span>Mais repetições / sessão</span><strong>{Math.max(0, ...validas.map(s => repsSessao(s.series)))}</strong></div><div><span>Séries concluídas</span><strong>{sessoes.reduce((total, s) => total + s.series.length, 0)}</strong></div><div><span>Sessões</span><strong>{sessoes.length}</strong></div></div><p className="nota-resumo">Peso corporal: acompanhe suas séries e repetições.</p><GraficoCarga dados={validas.map(s => ({ data: new Date(`${s.treino.data}T12:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }), carga: repsSessao(s.series), volume: 0 }))} campo="carga" unidade="reps" rotulo="Repetições por sessão" /></> : <><div className="metricas-resumo"><div><span>Maior carga</span><strong>{recordes.carga.toLocaleString('pt-BR')}<small> kg</small></strong></div><div><span>Maior volume / sessão</span><strong>{Math.max(0, ...validas.map(s => s.volume)).toLocaleString('pt-BR')}<small> kg</small></strong></div><div><span>1RM estimado · Epley</span><strong>{recordes.rm.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}<small> kg</small></strong></div><div><span>Sessões</span><strong>{sessoes.length}</strong></div></div>
    {diferenca !== null && <p className={`progressao ${diferenca > 0 ? 'subiu' : diferenca < 0 ? 'caiu' : 'igual'}`}>{diferenca > 0 ? '↑' : diferenca < 0 ? '↓' : '→'} {Math.abs(diferenca).toLocaleString('pt-BR')} kg em relação à sessão anterior</p>}
    {ultima && ex?.modo_carga !== 'peso_corporal' && sugestao(historico.series.filter(s => s.treino_id === ultima.treino.id && s.exercicio_id === id), alvo) && <p className="sugestao-carga">Você atingiu {alvo} reps em todas as séries normais. Considere aumentar a carga aos poucos, mantendo a execução.</p>}
    {estagnado(validas) && <p className="sugestao-carga">A carga máxima não evolui há pelo menos 4 semanas. Considere uma semana com cargas menores para recuperação.</p>}
    <div className="abas-treino"><button aria-pressed={metrica === 'carga'} onClick={() => definirMetrica('carga')}>Carga máxima</button><button aria-pressed={metrica === 'volume'} onClick={() => definirMetrica('volume')}>Volume</button></div>
    <GraficoCarga dados={validas.map(s => ({ data: new Date(`${s.treino.data}T12:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }), carga: s.carga, volume: s.volume }))} campo={metrica} unidade="kg" />
    <small className="nota-resumo">Aquecimentos não contam nos recordes. O 1RM é uma estimativa, não uma carga para testar.</small></>}
    <h3>Histórico do exercício</h3>
    {!sessoes.length && <p className="nota">Seu primeiro treino concluído aparecerá aqui.</p>}
    {[...sessoes].reverse().map(s => <details className="grupo-exercicios sessao-exercicio" key={s.treino.id}><summary><span>{new Date(`${s.treino.data}T12:00:00`).toLocaleDateString('pt-BR')}<small>{s.treino.titulo ?? 'Treino'}</small></span><small>{semPeso ? `${repsSessao(s.series)} reps` : `${s.volume.toLocaleString('pt-BR')} kg`}</small></summary><div className="historico-series">{s.recordes.length > 0 && <p className="verde">Novo recorde: {s.recordes.map(r => r === 'rm' ? '1RM estimado' : r).join(', ')}</p>}{s.series.map(serie => <p key={serie.id}>{serie.numero_serie}. {serie.repeticoes} reps{serie.modo_carga === 'peso_corporal' ? ' · Peso corporal' : ` × ${serie.peso_total.toLocaleString('pt-BR')} kg`} · {serie.tipo}{serie.tipo === 'dropset' && serie.reducoes?.map((r, i) => <small key={i}> · redução: {r.repeticoes} reps × {r.peso_digitado} kg {serie.modo_carga === 'por_lado' ? 'por lado' : ''}</small>)}</p>)}</div></details>)}
  </section>
}




