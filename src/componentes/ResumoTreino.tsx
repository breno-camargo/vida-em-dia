import { useState } from 'react'
import type { SerieTreino, Treino } from '../dados/modelos'
import { tabela } from '../dados/banco'
import { volumeSeries, caloriasMusculacao } from '../utilitarios/treino'
import { SelecionarResumo } from './SelecionarResumo'
export function ResumoTreino({ treino, series, anterior, pesoInicial, finalizar, voltar, fechar }: {
  treino: Treino; series: SerieTreino[]; anterior?: { volume: number }
  pesoInicial?: number; finalizar: (peso: number | undefined, kcal: number) => Promise<void>; voltar: () => void; fechar: () => void
}) {
  const minutos = Math.max(0, Math.round((Date.parse(treino.fim ?? new Date().toISOString()) - Date.parse(treino.inicio)) / 60000))
  const [peso, definirPeso] = useState(pesoInicial ?? treino.peso_corporal ?? 0)
  const [kcalEditada, definirKcal] = useState<number | null>(treino.calorias ?? null)
  const [erro, definirErro] = useState('')
  const [ocupado, definirOcupado] = useState(false)
  const [seletor, definirSeletor] = useState<'peso' | 'calorias' | null>(null)
  const volume = volumeSeries(series)
  const kcal = kcalEditada ?? caloriasMusculacao(peso, minutos)
  return <section className="formulario"><h2>{treino.fim ? 'Treino concluído' : 'Resumo do treino'}</h2>
    <div className="painel"><h3>{treino.titulo ?? 'Treino'}</h3><p>{minutos} minutos · {volume.toLocaleString('pt-BR')} kg de volume</p><small>Aquecimentos ficam fora do volume.</small>
      {anterior && <p>Comparação com o último treino: {volume - anterior.volume >= 0 ? '+' : ''}{(volume - anterior.volume).toLocaleString('pt-BR')} kg de volume.</p>}
    </div>
    {!treino.fim && <><div className="campo-resumo"><span>Peso corporal para estimativa</span><button type="button" onClick={() => definirSeletor('peso')}><strong>{peso ? `${peso.toLocaleString('pt-BR')} kg` : 'Escolher peso'}</strong><small>Deslize para escolher</small></button></div>
      <div className="campo-resumo"><span>{kcalEditada === null ? 'Calorias estimadas' : 'Calorias ajustadas'}</span><button type="button" onClick={() => definirSeletor('calorias')}><strong>{kcal.toLocaleString('pt-BR')} kcal</strong><small>Alterar por rolagem</small></button></div><small>Estimativa baseada no peso corporal e na duração do treino. Você pode ajustar as calorias por rolagem.</small>
      {kcalEditada !== null && <button type="button" className="botao-secundario" onClick={() => definirKcal(null)}>Usar estimativa pelo peso</button>}
      {seletor && <SelecionarResumo tipo={seletor} valor={seletor === 'peso' ? peso : kcal} confirmar={seletor === 'peso' ? definirPeso : definirKcal} fechar={() => definirSeletor(null)} />}</>}
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
