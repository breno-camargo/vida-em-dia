import { useState } from 'react'
import type { SerieTreino, Treino } from '../dados/modelos'
import { tabela } from '../dados/banco'
import { volumeSeries, caloriasMusculacao } from '../utilitarios/treino'
export function ResumoTreino({ treino, series, anterior, pesoInicial, finalizar, voltar, fechar }: {
  treino: Treino; series: SerieTreino[]; anterior?: { volume: number }
  pesoInicial?: number; finalizar: (peso: number | undefined, kcal: number) => Promise<void>; voltar: () => void; fechar: () => void
}) {
  const minutos = Math.max(0, Math.round((Date.parse(treino.fim ?? new Date().toISOString()) - Date.parse(treino.inicio)) / 60000))
  const [peso, definirPeso] = useState(pesoInicial ?? treino.peso_corporal ?? 0)
  const [kcalEditada, definirKcal] = useState<number | null>(treino.calorias ?? null)
  const [erro, definirErro] = useState('')
  const [ocupado, definirOcupado] = useState(false)
  const volume = volumeSeries(series)
  const kcal = kcalEditada ?? caloriasMusculacao(peso, minutos)
  return <section className="formulario"><h2>{treino.fim ? 'Treino concluído' : 'Resumo do treino'}</h2>
    <div className="painel"><h3>{treino.titulo ?? 'Treino'}</h3><p>{minutos} minutos · {volume.toLocaleString('pt-BR')} kg de volume</p><small>Aquecimentos ficam fora do volume.</small>
      {anterior && <p>Comparação com o último treino: {volume - anterior.volume >= 0 ? '+' : ''}{(volume - anterior.volume).toLocaleString('pt-BR')} kg de volume.</p>}
    </div>
    {!treino.fim && <><label>Peso corporal para estimativa (kg)<input type="number" inputMode="decimal" min="0" max="500" step="0.1" value={peso || ''} onChange={e => definirPeso(Number(e.target.value))} /></label>
      <label>Calorias estimadas (editável)<input type="number" inputMode="numeric" min="0" max="10000" value={kcal} onChange={e => definirKcal(Number(e.target.value))} /></label><small>Estimativa: MET 5 × peso × horas. Sem peso informado, registre as calorias manualmente.</small></>}
    {treino.fim && <p>{treino.calorias ?? 0} kcal · estimativa editável ao finalizar.</p>}
    <CardioDoDia data={treino.data} />
    {erro && <p role="alert" className="erro">{erro}</p>}
    {!treino.fim ? <><button className="botao-principal largura-total" disabled={ocupado} onClick={async () => {
      definirOcupado(true); definirErro('')
      try { if (!Number.isFinite(peso) || peso < 0 || peso > 500 || !Number.isFinite(kcal) || kcal < 0 || kcal > 10000) throw new Error('Confira peso e calorias.'); await finalizar(peso || undefined, kcal) }
      catch (error) { definirErro(error instanceof Error ? error.message : 'Não foi possível finalizar o treino.') }
      finally { definirOcupado(false) }
    }}>Finalizar e salvar</button><button className="botao-secundario" disabled={ocupado} onClick={voltar}>Voltar ao treino</button></> : <button className="botao-principal largura-total" onClick={fechar}>Voltar às fichas</button>}
  </section>
}
import { useLiveQuery } from 'dexie-react-hooks'
function CardioDoDia({ data }: { data: string }) {
  const sessoes = useLiveQuery(() => tabela('cardio_sessoes').where('data').equals(data).filter(s => !s.apagado_em).toArray(), [data])
  if (!sessoes?.length) return null
  return <div className="painel"><h3>Cardio do dia</h3>{sessoes.map(s => <p key={s.id}>{s.tipo} · {s.duracao_minutos} min · {s.distancia_km ?? '—'} km</p>)}</div>
}
