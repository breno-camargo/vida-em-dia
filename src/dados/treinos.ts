import { banco, tabela } from './banco'
import { criarRegistro } from './repositorio'
import type { Exercicio, SerieTreino, Treino, TreinoExercicio } from './modelos'
import { dataLocal } from '../utilitarios/data'
import { cargaTotal, validarSerie } from '../utilitarios/treino'

export async function treinoAtivo() { return tabela('treinos').filter(t => !t.fim && !t.apagado_em).first() }
export async function ultimasSeries(exercicio_id: string) {
  const treinos = await tabela('treinos').filter(t => Boolean(t.fim) && !t.apagado_em).toArray()
  const series = await tabela('series_treino').where('exercicio_id').equals(exercicio_id).filter(s => Boolean(s.concluida_em) && !s.apagado_em && treinos.some(t => t.id === s.treino_id)).toArray()
  series.sort((a, b) => (b.concluida_em ?? '').localeCompare(a.concluida_em ?? ''))
  return series.filter(s => s.treino_id === series[0]?.treino_id).sort((a, b) => a.numero_serie - b.numero_serie)
}
export async function montarExercicio(treino: Treino, ex: Exercicio, quantidade: number, ordem: number, descanso = ex.descanso_padrao_segundos) {
  const ultimas = await ultimasSeries(ex.id)
  const item: TreinoExercicio = { ...criarRegistro(treino.user_id), treino_id: treino.id, exercicio_id: ex.id, nome: ex.nome, ordem, descanso_segundos: descanso }
  await tabela('treino_exercicios').add(item)
  const series: SerieTreino[] = Array.from({ length: quantidade }, (_, indice) => {
    const anterior = ultimas[indice] ?? ultimas.at(-1)
    const modo = anterior?.modo_carga ?? ex.modo_carga
    const barra = anterior?.peso_barra ?? ex.peso_barra
    const peso = anterior?.peso_digitado ?? 0
    return { ...criarRegistro(treino.user_id), treino_id: treino.id, exercicio_id: ex.id, numero_serie: indice + 1, tipo: 'normal', peso_digitado: peso, peso_total: cargaTotal(peso, modo, barra), repeticoes: anterior?.repeticoes ?? 10, recorde: false, modo_carga: modo, peso_barra: barra }
  })
  await tabela('series_treino').bulkAdd(series)
}
export async function iniciarTreino(ficha_id?: string) {
  return banco.transaction('rw', banco.tables, async () => {
    const ativo = await treinoAtivo(); if (ativo) return ativo.id
    const ficha = ficha_id ? await tabela('fichas').get(ficha_id) : undefined
    if (ficha_id && (!ficha || ficha.apagado_em)) throw new Error('Esta ficha não está disponível.')
    const novo: Treino = { ...criarRegistro(ficha?.user_id), titulo: ficha?.nome ?? 'Treino livre', ficha_id, data: dataLocal(), inicio: new Date().toISOString(), observacao: '' }
    await tabela('treinos').add(novo)
    if (ficha_id) {
      const itens = await tabela('ficha_exercicios').where('ficha_id').equals(ficha_id).filter(i => !i.apagado_em).sortBy('ordem')
      let ordem = 0
      for (const item of itens) {
        const ex = await tabela('exercicios').get(item.exercicio_id)
        if (ex && !ex.apagado_em && ex.tipo === 'forca') await montarExercicio(novo, ex, item.series_planejadas, ordem++, item.descanso_segundos)
      }
      if (ordem === 0) throw new Error('Adicione um exercício de força à ficha. O registro de cardio chega na etapa 6.')
    }
    return novo.id
  })
}
export async function concluirSerie(dados: SerieTreino) {
  validarSerie(dados)
  await banco.transaction('rw', tabela('series_treino'), tabela('treinos'), tabela('treino_exercicios'), async () => {
    const treino = await tabela('treinos').get(dados.treino_id)
    const salva = await tabela('series_treino').get(dados.id)
    if (!treino || treino.fim || !salva || salva.apagado_em) throw new Error('Esta série não está disponível.')
    if (salva.concluida_em) return
    const agora = new Date().toISOString()
    await tabela('series_treino').put({ ...dados, peso_total: cargaTotal(dados.peso_digitado, dados.modo_carga, dados.peso_barra), concluida_em: agora, atualizado_em: agora })
    const pendentes = await tabela('series_treino').where('[treino_id+exercicio_id]').equals([dados.treino_id, dados.exercicio_id]).filter(s => !s.concluida_em && !s.apagado_em).count()
    const exercicio = await tabela('treino_exercicios').where('treino_id').equals(dados.treino_id).filter(e => e.exercicio_id === dados.exercicio_id && !e.apagado_em).first()
    const segundos = dados.tipo === 'aquecimento' ? Math.min(30, exercicio?.descanso_segundos ?? 30) : exercicio?.descanso_segundos ?? 90
    await tabela('treinos').update(dados.treino_id, { descanso_fim: pendentes && segundos > 0 ? new Date(Date.now() + segundos * 1000).toISOString() : null, atualizado_em: agora })
  })
}
export async function adicionarExercicio(treino: Treino, ex: Exercicio) {
  await banco.transaction('rw', banco.tables, async () => {
    const salvo = await tabela('treinos').get(treino.id)
    if (!salvo || salvo.fim) throw new Error('O treino já foi finalizado.')
    const itens = await tabela('treino_exercicios').where('treino_id').equals(treino.id).filter(i => !i.apagado_em).toArray()
    if (itens.some(i => i.exercicio_id === ex.id)) throw new Error('Este exercício já está no treino.')
    await montarExercicio(treino, ex, 3, Math.max(-1, ...itens.map(i => i.ordem)) + 1)
  })
}
