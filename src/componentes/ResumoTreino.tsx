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
  return <section className="formulario"><h2>{treino.fim ? 'Treino concluído' : 'Resumo do treino'}</h2>
    <div className="painel"><h3>{treino.titulo ?? 'Treino'}</h3><p>{minutos} minutos · {volume.toLocaleString('pt-BR')} kg de volume</p><small>Aquecimentos ficam fora do volume.</small>
      {anterior && <p>Comparação com o último treino: {volume - anterior.volume >= 0 ? '+' : ''}{(volume - anterior.volume).toLocaleString('pt-BR')} kg de volume.</p>}
    </div>
    {!treino.fim && <div className="painel"><h3>Calorias estimadas</h3><p>{peso > 0 ? `${kcal.toLocaleString('pt-BR')} kcal` : 'Estimativa indisponível: peso ainda não cadastrado.'}</p><small>Cálculo automático pela duração do treino e pelo último peso registrado no app.</small></div>}
    {treino.fim && <p>{treino.peso_corporal ? `${treino.calorias ?? 0} kcal · estimativa automática.` : 'Calorias não estimadas: peso corporal não informado.'}</p>}
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

