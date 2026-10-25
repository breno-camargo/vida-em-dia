import { banco, tabela } from './banco'
import type { Exercicio } from './modelos'
import { identidadeExercicio } from './duplicatasExercicios'
import { comExclusaoSync } from '../sincronizacao/armazenamento'

export function gruposDuplicados(exercicios: Exercicio[]) {
 const grupos = new Map<string, Exercicio[]>()
 for (const ex of exercicios.filter(e => !e.apagado_em)) {
  const chave = JSON.stringify([ex.user_id, identidadeExercicio(ex)])
  grupos.set(chave, [...(grupos.get(chave) ?? []), ex])
 }
 return [...grupos.values()].filter(g => g.length > 1)
}

export async function unirExercicios(ids: string[], manter: string) {
 const selecionados = [...new Set(ids)]
 if (selecionados.length < 2 || !selecionados.includes(manter)) throw new Error('Escolha as cópias e qual cadastro manter.')
 return comExclusaoSync(() => banco.transaction('rw', banco.tables, async () => {
  const exercicios = await tabela('exercicios').bulkGet(selecionados)
  const principal = exercicios.find(e => e?.id === manter)
  if (!principal || exercicios.some(e => !e || e.apagado_em || e.user_id !== principal.user_id || identidadeExercicio(e) !== identidadeExercicio(principal))) throw new Error('Os cadastros mudaram ou têm diferenças. Reabra a revisão. Somente cópias com conteúdo e proprietário iguais podem ser unidas.')
  if (await tabela('treinos').filter(t => !t.apagado_em && !t.fim).count()) throw new Error('Finalize ou cancele o treino em andamento antes de unir cadastros.')
  const nomes = ['ficha_exercicios', 'treino_exercicios', 'series_treino', 'cardio_sessoes', 'fotos'] as const
  for (const nome of nomes) {
   const linhas = await tabela(nome).filter(r => !!r.exercicio_id && selecionados.includes(r.exercicio_id)).toArray()
   if (linhas.some(r => r.user_id !== principal.user_id)) throw new Error('Há vínculos de outra conta. Nenhum registro foi alterado.')
   if (nome === 'ficha_exercicios' || nome === 'treino_exercicios') {
    const pais = new Set<string>()
    for (const linha of linhas.filter(r => !r.apagado_em)) {
     const pai = 'ficha_id' in linha ? linha.ficha_id : 'treino_id' in linha ? linha.treino_id : undefined
     if (!pai) continue
     if (pais.has(pai)) throw new Error('As cópias aparecem juntas na mesma ficha ou sessão. Revise esse caso separadamente para preservar os planejamentos.')
     pais.add(pai)
    }
   }
  }
  const agora = new Date().toISOString(), removidos = selecionados.filter(id => id !== manter)
  for (const nome of nomes) await tabela(nome).filter(r => !!r.exercicio_id && removidos.includes(r.exercicio_id)).modify({ exercicio_id: manter, atualizado_em: agora })
  await tabela('exercicios').where('id').anyOf(removidos).modify({ apagado_em: agora, atualizado_em: agora })
  await tabela('exercicios').update(manter, { atualizado_em: agora })
 }))
}
