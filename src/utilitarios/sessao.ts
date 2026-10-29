import type { Treino } from '../dados/modelos'

export function horarioSessao(treino: Pick<Treino, 'inicio'>) {
  const data = new Date(treino.inicio)
  return Number.isFinite(data.getTime()) ? data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : ''
}

export function duracaoSessao(treino: Pick<Treino, 'inicio' | 'fim' | 'duracao_minutos'>) {
  const segundos = treino.fim ? (Date.parse(treino.fim) - Date.parse(treino.inicio)) / 1000 : NaN
  const total = Number.isFinite(segundos) && segundos >= 0 ? segundos : treino.duracao_minutos !== undefined && treino.duracao_minutos > 0 ? treino.duracao_minutos * 60 : NaN
  if (!Number.isFinite(total) || total < 0) return 'Duração não informada'
  const inteiro = Math.floor(total)
  const minutosSegundos = `${String(Math.floor(inteiro / 60) % 60).padStart(2, '0')}:${String(inteiro % 60).padStart(2, '0')}`
  return inteiro >= 3600 ? `${Math.floor(inteiro / 3600)}:${minutosSegundos}` : minutosSegundos
}
