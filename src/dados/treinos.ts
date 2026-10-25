import { formatarNomeFicha } from './fichas'
import { banco, tabela } from './banco'
import { criarRegistro } from './repositorio'
import type { Exercicio, SerieTreino, Treino, TreinoExercicio } from './modelos'
import { dataLocal } from '../utilitarios/data'
import { cargaTotal, validarSerie, caloriasMusculacao } from '../utilitarios/treino'
import { desempenho, efetivas } from '../utilitarios/evolucao'

export async function treinoAtivo() { return tabela('treinos').filter(t => !t.fim && !t.apagado_em).first() }
export async function treinoSemAtividade(treino: Treino) {
  if (treino.fim || treino.apagado_em || treino.observacao.trim()) return false
  const concluidas = await tabela('series_treino').where('treino_id').equals(treino.id).filter(s => !s.apagado_em && !!s.concluida_em).count()
  const cardio = await tabela('cardio_sessoes').where('treino_id').equals(treino.id).filter(c => !c.apagado_em).count()
  return concluidas === 0 && cardio === 0
}
export async function cancelarTreino(id: string) {
  return banco.transaction('rw', tabela('treinos'), tabela('treino_exercicios'), tabela('series_treino'), tabela('cardio_sessoes'), async () => {
    const treino = await tabela('treinos').get(id)
    if (!treino || treino.apagado_em) return
    if (treino.fim) throw new Error('Este treino já foi finalizado. Remova-o pelo histórico.')
    const agora = new Date().toISOString()
    const exclusao = { apagado_em: agora, atualizado_em: agora }
    await tabela('treinos').update(id, { ...exclusao, descanso_fim: null })
    await tabela('treino_exercicios').where('treino_id').equals(id).filter(i => !i.apagado_em).modify(exclusao)
    await tabela('series_treino').where('treino_id').equals(id).filter(s => !s.apagado_em).modify(exclusao)
    await tabela('cardio_sessoes').where('treino_id').equals(id).filter(c => !c.apagado_em).modify(exclusao)
  })
}
export async function descartarTreinoLivreVazio(id: string) {
  return banco.transaction('rw', tabela('treinos'), tabela('treino_exercicios'), tabela('series_treino'), async () => {
    const treino = await tabela('treinos').get(id)
    if (!treino || treino.ficha_id || treino.fim || treino.apagado_em) return
    const itens = await tabela('treino_exercicios').where('treino_id').equals(id).filter(i => !i.apagado_em).count()
    const series = await tabela('series_treino').where('treino_id').equals(id).filter(s => !s.apagado_em).count()
    if (itens || series) return
    const agora = new Date().toISOString()
    await tabela('treinos').update(id, { apagado_em: agora, atualizado_em: agora })
  })
}
export async function ultimasSeries(exercicio_id: string) {
  const treinos = await tabela('treinos').filter(t => Boolean(t.fim) && !t.apagado_em).toArray()
  const series = await tabela('series_treino').where('exercicio_id').equals(exercicio_id).filter(s => Boolean(s.concluida_em) && !s.apagado_em && treinos.some(t => t.id === s.treino_id)).toArray()
  series.sort((a, b) => (b.concluida_em ?? '').localeCompare(a.concluida_em ?? ''))
  return series.filter(s => s.treino_id === series[0]?.treino_id).sort((a, b) => a.numero_serie - b.numero_serie)
}
export async function maiorCarga(exercicio_id: string) {
  const treinos = await tabela('treinos').filter(t => !t.apagado_em).toArray()
  const treinosAtivos = new Set(treinos.map(t => t.id))
  const todas = await tabela('series_treino').where('exercicio_id').equals(exercicio_id).filter(s => Boolean(s.concluida_em) && !s.apagado_em && s.tipo !== 'aquecimento' && treinosAtivos.has(s.treino_id)).toArray()
  return Math.max(0, ...todas.map(s => s.peso_total))
}
export async function montarExercicio(treino: Treino, ex: Exercicio, quantidade: number, ordem: number, descanso = ex.descanso_padrao_segundos, origem_ficha = false) {
  const ultimas = await ultimasSeries(ex.id)
  const item: TreinoExercicio = { ...criarRegistro(treino.user_id), treino_id: treino.id, exercicio_id: ex.id, nome: ex.nome, ordem, descanso_segundos: descanso, tipo: ex.tipo, origem_ficha }
  await tabela('treino_exercicios').add(item)
  if (ex.tipo === 'cardio') return
  const series: SerieTreino[] = Array.from({ length: quantidade }, (_, indice) => {
    const anterior = ultimas[indice] ?? ultimas.at(-1)
    const modo = ex.modo_carga === 'peso_corporal' ? 'peso_corporal' : anterior?.modo_carga ?? ex.modo_carga
    const barra = anterior?.peso_barra ?? ex.peso_barra
    const peso = modo === 'peso_corporal' ? 0 : anterior?.peso_digitado ?? 0
    return { ...criarRegistro(treino.user_id), treino_id: treino.id, exercicio_id: ex.id, numero_serie: indice + 1, tipo: 'normal', peso_digitado: peso, peso_total: cargaTotal(peso, modo, barra), repeticoes: anterior?.repeticoes ?? 10, recorde: false, modo_carga: modo, peso_barra: barra }
  })
  await tabela('series_treino').bulkAdd(series)
}
export async function completarCardioDaFicha(id: string) {
  await banco.transaction('rw', banco.tables, async () => {
    const treino = await tabela('treinos').get(id)
    if (!treino?.ficha_id || treino.fim || treino.apagado_em) return
    const ficha = await tabela('fichas').get(treino.ficha_id)
    if (!ficha || ficha.apagado_em) return
    const planoCompleto = await tabela('ficha_exercicios').where('ficha_id').equals(treino.ficha_id).sortBy('ordem')
    const planejamento = planoCompleto.filter(i => !i.apagado_em)
    // Inclua removidos na verificação para respeitar retiradas feitas só neste treino.
    const existentes = await tabela('treino_exercicios').where('treino_id').equals(id).toArray()
    const cardioRegistrado = await tabela('cardio_sessoes').where('treino_id').equals(id).filter(c => !c.apagado_em).toArray()
    const agora = new Date().toISOString()
    for (const item of existentes) {
      const veioDaFicha = item.origem_ficha === true || (item.origem_ficha === undefined && planoCompleto.some(p => p.exercicio_id === item.exercicio_id))
      if (item.tipo === 'cardio' && !item.apagado_em && veioDaFicha && !planejamento.some(p => p.exercicio_id === item.exercicio_id) && !cardioRegistrado.some(c => c.exercicio_id === item.exercicio_id)) {
        await tabela('treino_exercicios').update(item.id, { apagado_em: agora, atualizado_em: agora, retirado_da_ficha: true })
      }
    }
    let ordem = Math.max(-1, ...existentes.map(i => i.ordem)) + 1
    for (const item of planejamento) {
      const existente = existentes.find(i => i.exercicio_id === item.exercicio_id)
      if (existente) {
        if (existente.apagado_em && existente.retirado_da_ficha) await tabela('treino_exercicios').update(existente.id, { apagado_em: null, retirado_da_ficha: false, atualizado_em: agora })
        continue
      }
      const ex = await tabela('exercicios').get(item.exercicio_id)
      if (ex?.tipo === 'cardio' && !ex.apagado_em) await montarExercicio(treino, ex, 0, ordem++, item.descanso_segundos, true)
    }
  })
}
export async function iniciarTreino(ficha_id?: string, encerrarAtual: boolean | 'cancelar' = false) {
  return banco.transaction('rw', banco.tables, async () => {
    const ativo = await treinoAtivo()
    if (ativo) {
      if (ativo.ficha_id === ficha_id) { await completarCardioDaFicha(ativo.id); return ativo.id }
      if (!encerrarAtual && await treinoSemAtividade(ativo)) {
        await cancelarTreino(ativo.id)
      } else if (encerrarAtual === 'cancelar') {
        await cancelarTreino(ativo.id)
      } else if (encerrarAtual) {
        const fim = new Date().toISOString()
        const minutosReais = Math.max(0, (Date.parse(fim) - Date.parse(ativo.inicio)) / 60000)
        const minutos = Math.round(minutosReais)
        const medidas = await tabela('medidas_corporais').filter(m => !m.apagado_em && Boolean(m.peso)).sortBy('data')
        const peso = medidas.at(-1)?.peso
        const forca = await tabela('treino_exercicios').where('treino_id').equals(ativo.id).filter(i => !i.apagado_em && i.tipo !== 'cardio').count()
        await tabela('treinos').update(ativo.id, { fim, duracao_minutos: minutos, peso_corporal: peso, calorias: peso && forca ? caloriasMusculacao(peso, minutosReais) : 0, descanso_fim: null, atualizado_em: fim })
      } else {
        throw new Error(`Há um treino em andamento: ${ativo.titulo ?? 'Treino anterior'}. Use “Continuar treino” e finalize-o antes de iniciar outro.`)
      }
    }
    const ficha = ficha_id ? await tabela('fichas').get(ficha_id) : undefined
    if (ficha_id && (!ficha || ficha.apagado_em)) throw new Error('Esta ficha não está disponível.')
    const novo: Treino = { ...criarRegistro(ficha?.user_id), titulo: formatarNomeFicha(ficha?.nome ?? 'Treino livre'), ficha_id, data: dataLocal(), inicio: new Date().toISOString(), observacao: '' }
    await tabela('treinos').add(novo)
    if (ficha_id) {
      const itens = await tabela('ficha_exercicios').where('ficha_id').equals(ficha_id).filter(i => !i.apagado_em).sortBy('ordem')
      let ordem = 0
      for (const item of itens) {
        const ex = await tabela('exercicios').get(item.exercicio_id)
        if (ex && !ex.apagado_em) await montarExercicio(novo, ex, item.series_planejadas, ordem++, item.descanso_segundos, true)
      }
      if (ordem === 0) throw new Error('Adicione um exercício à ficha.')
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
    const concluidas = await tabela('series_treino').where('exercicio_id').equals(dados.exercicio_id).filter(s => !s.apagado_em && !!s.concluida_em).toArray()
    const idsAnteriores = [...new Set(concluidas.filter(s => s.treino_id !== treino.id).map(s => s.treino_id))]
    const anteriores = await tabela('treinos').bulkGet(idsAnteriores)
    const finalizados = new Set(anteriores.filter(t => t && !!t.fim && !t.apagado_em).map(t => t!.id))
    const anterioresSeries = concluidas.filter(s => finalizados.has(s.treino_id) || s.treino_id === treino.id)
    const serie = { ...dados, peso_total: cargaTotal(dados.peso_digitado, dados.modo_carga, dados.peso_barra), concluida_em: agora, atualizado_em: agora }
    const melhor = desempenho(anterioresSeries)
    const atual = desempenho([serie])
    const temHistorico = efetivas(anterioresSeries.filter(s => s.treino_id !== treino.id)).length > 0
    serie.recorde = dados.tipo !== 'aquecimento' && temHistorico && (atual.pesoCorporal ? atual.reps > melhor.reps : atual.carga > melhor.carga || atual.rm > melhor.rm)
    await tabela('series_treino').put(serie)
    const pendentes = await tabela('series_treino').where('[treino_id+exercicio_id]').equals([dados.treino_id, dados.exercicio_id]).filter(s => !s.concluida_em && !s.apagado_em).count()
    const pendentesTreino = pendentes || await tabela('series_treino').where('treino_id').equals(dados.treino_id).filter(s => !s.concluida_em && !s.apagado_em).count()
    const exercicio = await tabela('treino_exercicios').where('treino_id').equals(dados.treino_id).filter(e => e.exercicio_id === dados.exercicio_id && !e.apagado_em).first()
    const segundos = dados.tipo === 'aquecimento' ? Math.min(30, exercicio?.descanso_segundos ?? 30) : exercicio?.descanso_segundos ?? 90
    await tabela('treinos').update(dados.treino_id, { descanso_fim: pendentesTreino && segundos > 0 ? new Date(Date.now() + segundos * 1000).toISOString() : null, atualizado_em: agora })
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
export async function aplicarValoresProximas(dados: SerieTreino) {
  validarSerie(dados)
  await banco.transaction('rw', tabela('series_treino'), tabela('treinos'), async () => {
    const sessao = await tabela('treinos').get(dados.treino_id)
    const atual = await tabela('series_treino').get(dados.id)
    if (!sessao || sessao.fim || !atual || atual.apagado_em || atual.concluida_em) throw new Error('Esta série não está mais pendente.')
    const seguintes = await tabela('series_treino').where('[treino_id+exercicio_id]').equals([dados.treino_id, dados.exercicio_id]).filter(s => !s.apagado_em && !s.concluida_em && s.numero_serie > dados.numero_serie).toArray()
    const agora = new Date().toISOString()
    const valores = { peso_digitado: dados.peso_digitado, repeticoes: dados.repeticoes, modo_carga: dados.modo_carga, peso_barra: dados.peso_barra, peso_total: cargaTotal(dados.peso_digitado, dados.modo_carga, dados.peso_barra), atualizado_em: agora }
    await tabela('series_treino').bulkPut([{ ...dados, ...valores }, ...seguintes.map(s => ({ ...s, ...valores }))])
  })
}
