import { ResumoCardioDia } from './ResumoCardioDia'
import { useEffect, useState } from 'react'
import type { SerieTreino, Treino } from '../dados/modelos'
import { volumeSeries, caloriasMusculacao } from '../utilitarios/treino'

export function ResumoTreino({ treino, series, anterior, pesoInicial, finalizar, voltar, fechar }: {
  treino: Treino; series: SerieTreino[]; anterior?: { volume: number }
  pesoInicial?: number; finalizar: (peso: number | undefined, kcal: number) => Promise<void>; voltar: () => void; fechar: () => void
}) {
  const [agora, definirAgora] = useState(Date.now)
  useEffect(() => { if (treino.fim) return; const timer = setInterval(() => definirAgora(Date.now()), 1000); return () => clearInterval(timer) }, [treino.fim])
  const minutosReais = Math.max(0, ((treino.fim ? Date.parse(treino.fim) : agora) - Date.parse(treino.inicio)) / 60000)
  const minutos = Math.round(minutosReais)
  const peso = treino.fim ? treino.peso_corporal ?? 0 : pesoInicial ?? 0
  const [erro, definirErro] = useState('')
  const [ocupado, definirOcupado] = useState(false)

  const volume = volumeSeries(series)
  const kcal = series.length ? caloriasMusculacao(peso, minutosReais) : 0
  const concluidas = series.filter(s => s.concluida_em && !s.apagado_em)
  const exerciciosFeitos = new Set(concluidas.map(s => s.exercicio_id)).size
  return <section className="formulario resumo-treino"><div className="resumo-titulo"><span className="etiqueta">SEU TREINO</span><h2>{treino.fim ? 'Treino concluído' : 'Pronto para finalizar?'}</h2><p>{treino.titulo ?? 'Treino livre'}</p></div>
    <div className="metricas-resumo"><div><span>Duração</span><strong>{minutosReais > 0 && minutosReais < 1 ? <small>Menos de 1 min</small> : <>{minutos}<small> min</small></>}</strong></div><div><span>Volume total</span><strong>{volume.toLocaleString('pt-BR')}<small> kg</small></strong></div><div><span>Exercícios de força</span><strong>{exerciciosFeitos}</strong></div><div><span>Séries concluídas</span><strong>{concluidas.length}</strong></div></div>
    <p className="nota-resumo">O volume considera as séries concluídas, sem aquecimentos.</p>
    {anterior && <p className="comparacao-resumo">Última sessão: {volume - anterior.volume >= 0 ? '+' : ''}{(volume - anterior.volume).toLocaleString('pt-BR')} kg de volume.</p>}
    <div className="calorias-resumo"><span>Calorias da musculação</span><strong>{peso > 0 ? `${(treino.fim ? treino.calorias ?? 0 : kcal).toLocaleString('pt-BR')} kcal` : '—'}</strong><small>{peso > 0 ? 'Estimativa automática pelo peso cadastrado e duração.' : 'Cadastre seu peso na aba Medidas para estimar as calorias.'}</small></div>
    <ResumoCardioDia data={treino.data} />
    {erro && <p role="alert" className="erro">{erro}</p>}
    {!treino.fim ? <div className="acoes-resumo-fixas"><button className="botao-principal largura-total" disabled={ocupado} onClick={async () => {
      definirOcupado(true); definirErro('')
      try { if (!Number.isFinite(peso) || peso < 0 || peso > 500 || !Number.isFinite(kcal) || kcal < 0 || kcal > 10000) throw new Error('Confira peso e calorias.'); await finalizar(peso || undefined, series.length ? caloriasMusculacao(peso, Math.max(0, (Date.now() - Date.parse(treino.inicio)) / 60000)) : 0); window.dispatchEvent(new Event('vida-em-dia:treino-finalizado')) }
      catch (error) { definirErro(error instanceof Error ? error.message : 'Não foi possível finalizar o treino.') }
      finally { definirOcupado(false) }
    }}>Finalizar e salvar</button><button className="botao-secundario" disabled={ocupado} onClick={voltar}>Voltar ao treino</button></div> : <button className="botao-principal largura-total" onClick={fechar}>Voltar às fichas</button>}
  </section>
}


