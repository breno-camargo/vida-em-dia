import { useMemo } from 'react'
import type { CardioSessao, Treino } from '../dados/modelos'
import { tiposCardio } from '../dados/cardio'
import { CardCompartilhavel } from './CardCompartilhavel'

export function CompartilharCardio({ sessao, fechar }: { sessao: CardioSessao; fechar: () => void }) {
  // Adaptação somente para apresentação; não cria nem altera registros no banco.
  const treino = useMemo<Treino>(() => ({ ...sessao, inicio: sessao.criado_em, duracao_minutos: sessao.duracao_minutos, titulo: tiposCardio.find(([id]) => id === sessao.tipo)?.[1] ?? 'Cardio' }), [sessao])
  const dados = useMemo(() => ({ volume: 0, exercicios: 0, series: 0, recordes: 0, grupos: [], cardio: sessao }), [sessao])
  return <CardCompartilhavel treino={treino} dados={dados} fechar={fechar} />
}
