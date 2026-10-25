import { banco, identidadeAtual, tabela } from './banco'

export async function salvarDescansoExercicio(itemId: string, segundos: number) {
  if (!Number.isInteger(segundos) || segundos < 0 || segundos > 3600) throw new Error('Informe um descanso entre 0 e 3600 segundos.')
  const instancia = banco, dono = identidadeAtual()
  const itens = tabela('treino_exercicios'), treinos = tabela('treinos'), fichas = tabela('fichas'), planejamento = tabela('ficha_exercicios'), exercicios = tabela('exercicios')
  await instancia.transaction('rw', [itens, treinos, fichas, planejamento, exercicios], async () => {
    const item = await itens.get(itemId)
    if (!item || item.apagado_em || item.user_id !== dono) throw new Error('Este exercício não está disponível.')
    const treino = await treinos.get(item.treino_id)
    if (!treino || treino.apagado_em || treino.fim || treino.user_id !== dono) throw new Error('Este treino não está mais em andamento.')
    const agora = new Date().toISOString()
    await itens.update(item.id, { descanso_segundos: segundos, atualizado_em: agora })
    if (treino.ficha_id) {
      const ficha = await fichas.get(treino.ficha_id)
      if (ficha && !ficha.apagado_em && ficha.user_id === dono) {
        const vinculos = await planejamento.where('ficha_id').equals(ficha.id).filter(v => !v.apagado_em && v.user_id === dono && v.exercicio_id === item.exercicio_id).toArray()
        for (const vinculo of vinculos) await planejamento.update(vinculo.id, { descanso_segundos: segundos, atualizado_em: agora })
      }
    } else {
      // Treino livre reutiliza o descanso padrão do exercício na próxima inclusão.
      const exercicio = await exercicios.get(item.exercicio_id)
      if (exercicio && !exercicio.apagado_em && exercicio.user_id === dono) await exercicios.update(exercicio.id, { descanso_padrao_segundos: segundos, atualizado_em: agora })
    }
  })
}
