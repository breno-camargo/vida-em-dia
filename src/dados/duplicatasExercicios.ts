import type { Exercicio } from './modelos'

const texto = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR').trim().replace(/\s+/g, ' ')

// Equivalência de conteúdo, sem apagar/remapear os IDs usados no histórico.
// Campos personalizados diferentes nunca são consolidados só pelo nome.
export function identidadeExercicio(ex: Exercicio) {
  return JSON.stringify([texto(ex.nome), ex.tipo, texto(ex.grupo_muscular), texto(ex.equipamento), ex.descanso_padrao_segundos,
    ex.modo_carga, ex.peso_barra, ex.nota_fixa, ex.como_fazer, ex.musculos, ex.video_url || '', ex.alvo_reps ?? 12,
    ex.origem, ex.referencia_externa || ''])
}

export function exerciciosUnicos(exercicios: Exercicio[]) {
  const grupos = new Map<string, Exercicio>()
  for (const ex of exercicios) {
    if (ex.apagado_em) continue
    const chave = identidadeExercicio(ex), atual = grupos.get(chave)
    if (!atual || ex.id.localeCompare(atual.id) < 0) grupos.set(chave, ex)
  }
  return [...grupos.values()]
}

export function exerciciosDisponiveis(exercicios: Exercicio[], usados: string[]) {
  const ids = new Set(usados)
  const identidadesUsadas = new Set(exercicios.filter(e => ids.has(e.id)).map(identidadeExercicio))
  return exerciciosUnicos(exercicios).filter(e => !ids.has(e.id) && !identidadesUsadas.has(identidadeExercicio(e)))
}
