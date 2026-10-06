import { useState } from 'react'
import type { SerieTreino, Treino } from '../dados/modelos'
import { tabela } from '../dados/banco'
import { volumeSeries, caloriasMusculacao } from '../utilitarios/treino'

export function ResumoTreino({ treino, series, anterior, pesoInicial, finalizar, voltar, fechar }: {
  treino: Treino; series: SerieTreino[]; anterior?: { volume: number }
  pesoInicial?: number; finalizar: (peso: number | undefined, kcal: number) => Promise<void>; voltar: () => void; fechar: () => void
}) {
  const minutos = Math.max(0, Math.round((Date.parse(treino.fim ?? new Date().toISOString()) - Date.parse(treino.inicio)) / 60000))
  const peso = treino.fim ? treino.peso_corporal ?? 0 : pesoInicial ?? 0
  const [erro, definirErro] = useState('')
  const [ocupado, definirOcupado] = useState(false)

  const volume = volumeSeries(series)
  const kcal = caloriasMusculacao(peso, minutos)
  const concluidas = series.filter(s => s.concluida_em && !s.apagado_em)
  const exerciciosFeitos = new Set(concluidas.map(s => s.exercicio_id)).size
  return <section className="formulario resumo-treino"><div className="resumo-titulo"><span className="etiqueta">SEU TREINO</span><h2>{treino.fim ? 'Treino concluído' : 'Pronto para finalizar?'}</h2><p>{treino.titulo ?? 'Treino livre'}</p></div>
    <div className="metricas-resumo"><div><span>Duração</span><strong>{minutos}<small> min</small></strong></div><div><span>Volume total</span><strong>{volume.toLocaleString('pt-BR')}<small> kg</small></strong></div><div><span>Exercícios realizados</span><strong>{exerciciosFeitos}</strong></div><div><span>Séries concluídas</span><strong>{concluidas.length}</strong></div></div>
    <p className="nota-resumo">O volume considera as séries concluídas, sem aquecimentos.</p>
    {anterior && <p className="comparacao-resumo">Última sessão: {volume - anterior.volume >= 0 ? '+' : ''}{(volume - anterior.volume).toLocaleString('pt-BR')} kg de volume.</p>}
    <div className="calorias-resumo"><span>Calorias estimadas</span><strong>{peso > 0 ? `${(treino.fim ? treino.calorias ?? 0 : kcal).toLocaleString('pt-BR')} kcal` : '—'}</strong><small>{peso > 0 ? 'Estimativa automática pelo peso cadastrado e duração.' : 'Disponível quando você cadastrar seu peso na etapa 5.'}</small></div>
    <CardioDoDia data={treino.data} />
    {erro && <p role="alert" className="erro">{erro}</p>}
    {!treino.fim ? <div className="acoes-resumo-fixas"><button className="botao-principal largura-total" disabled={ocupado} onClick={async () => {
      definirOcupado(true); definirErro('')
      try { if (!Number.isFinite(peso) || peso < 0 || peso > 500 || !Number.isFinite(kcal) || kcal < 0 || kcal > 10000) throw new Error('Confira peso e calorias.'); await finalizar(peso || undefined, kcal) }
      catch (error) { definirErro(error instanceof Error ? error.message : 'Não foi possível finalizar o treino.') }
      finally { definirOcupado(false) }
    }}>Finalizar e salvar</button><button className="botao-secundario" disabled={ocupado} onClick={voltar}>Voltar ao treino</button></div> : <button className="botao-principal largura-total" onClick={fechar}>Voltar às fichas</button>}
  </section>
}
import { useLiveQuery } from 'dexie-react-hooks'
function CardioDoDia({ data }: { data: string }) {
  const sessoes = useLiveQuery(() => tabela('cardio_sessoes').where('data').equals(data).filter(s => !s.apagado_em).toArray(), [data])
  if (!sessoes?.length) return null
  return <div className="painel"><h3>Cardio do dia</h3>{sessoes.map(s => <p key={s.id}>{s.tipo} · {s.duracao_minutos} min · {s.distancia_km ?? '—'} km</p>)}</div>
}



