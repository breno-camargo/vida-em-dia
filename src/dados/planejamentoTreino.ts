import { criarRegistro } from './repositorio'
import type { Ficha, SerieTreino, TreinoExercicio } from './modelos'

// A ficha guarda planejamento (1–20), sem alterar as séries da sessão original.
export function planejamentoDoTreino(ficha: Ficha, itens: TreinoExercicio[], series: SerieTreino[]) {
  return itens.filter(i => !i.apagado_em).map((item, ordem) => ({
    ...criarRegistro(ficha.user_id), ficha_id: ficha.id, exercicio_id: item.exercicio_id, ordem,
    series_planejadas: item.tipo === 'cardio' ? 1 : Math.min(20, Math.max(1,
      series.filter(s => !s.apagado_em && s.treino_id === item.treino_id && s.exercicio_id === item.exercicio_id).length)),
    descanso_segundos: item.descanso_segundos,
  }))
}
