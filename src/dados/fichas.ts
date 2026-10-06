import { banco, tabela } from './banco'
import { criarRegistro } from './repositorio'
import type { Ficha, FichaExercicio } from './modelos'

export async function salvarFicha(ficha: Ficha, itens: FichaExercicio[]) {
  if (!ficha.nome.trim()) throw new Error('Dê um nome à ficha.')
  if (!itens.length) throw new Error('Adicione pelo menos um exercício.')
  if (itens.some(item => !Number.isInteger(item.series_planejadas) || item.series_planejadas < 1 || item.series_planejadas > 20 || !Number.isFinite(item.descanso_segundos) || item.descanso_segundos! < 0 || item.descanso_segundos! > 1800)) throw new Error('Use 1 a 20 séries e descanso entre 0 e 1800 segundos.')
  await banco.transaction('rw', tabela('fichas'), tabela('ficha_exercicios'), tabela('exercicios'), async () => {
    for (const item of itens) {
      const exercicio = await tabela('exercicios').get(item.exercicio_id)
      if (!exercicio || exercicio.apagado_em) throw new Error('Um exercício foi removido. Abra novamente a ficha.')
    }
    const agora = new Date().toISOString()
    const antigos = await tabela('ficha_exercicios').where('ficha_id').equals(ficha.id).toArray()
    for (const item of antigos.filter(item => !itens.some(novo => novo.id === item.id))) {
      await tabela('ficha_exercicios').put({ ...item, apagado_em: agora, atualizado_em: agora })
    }
    await tabela('fichas').put({ ...ficha, nome: ficha.nome.trim(), atualizado_em: agora })
    await tabela('ficha_exercicios').bulkPut(itens.map((item, ordem) => ({ ...item, ordem, atualizado_em: agora, apagado_em: null })))
  })
}
export async function duplicarFicha(ficha: Ficha) {
  const itens = await tabela('ficha_exercicios').where('ficha_id').equals(ficha.id).filter(item => !item.apagado_em).sortBy('ordem')
  const nova = { ...ficha, ...criarRegistro(ficha.user_id), nome: `${ficha.nome} (cópia)`, ordem: Date.now() }
  await salvarFicha(nova, itens.map(item => ({ ...item, ...criarRegistro(ficha.user_id), ficha_id: nova.id })))
}
export async function apagarFicha(id: string) {
  await banco.transaction('rw', tabela('fichas'), tabela('ficha_exercicios'), async () => {
    const agora = new Date().toISOString()
    await tabela('fichas').update(id, { apagado_em: agora, atualizado_em: agora })
    await tabela('ficha_exercicios').where('ficha_id').equals(id).modify({ apagado_em: agora, atualizado_em: agora })
  })
}
