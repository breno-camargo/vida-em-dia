import Dexie, { type Table } from 'dexie'
import type { Tabelas } from './modelos'

export const banco = new Dexie('vida-em-dia')
const base = 'id, user_id, atualizado_em, apagado_em'
// Preserve esta versão; alterações futuras entram em uma nova migração.
banco.version(1).stores({
  exercicios: `${base}, nome, tipo, grupo_muscular`, fichas: `${base}, ordem`,
  ficha_exercicios: `${base}, ficha_id, exercicio_id, [ficha_id+ordem]`,
  treinos: `${base}, data, ficha_id, inicio`,
  series_treino: `${base}, treino_id, exercicio_id, [treino_id+exercicio_id]`,
  cardio_sessoes: `${base}, data, tipo, treino_id`, medidas_corporais: `${base}, data`,
  atividade_diaria: `${base}, data`, feriados: `${base}, data`,
  refeicoes_dia: `${base}, data, [data+refeicao], alimento_id`,
  alimentos_favoritos: `${base}, nome, vezes_usado`, combos_refeicao: `${base}, nome`,
  agua_dia: `${base}, data`, consumo_diario_meta: `${base}, data`,
  fotos: `${base}, tipo, data, medida_id, exercicio_id`, configuracoes: `${base}, &chave`,
})
banco.version(2).stores({
  ficha_exercicios: `${base}, ficha_id, exercicio_id, [ficha_id+ordem]`,
}).upgrade(async transacao => {
  await transacao.table('ficha_exercicios').toCollection().modify(item => {
    if (item.descanso_segundos === undefined) item.descanso_segundos = 90
  })
})
export function tabela<K extends keyof Tabelas>(nome: K): Table<Tabelas[K], string> {
  return banco.table(nome)
}
banco.version(3).stores({
  treino_exercicios: `${base}, treino_id, exercicio_id, [treino_id+ordem]`,
}).upgrade(async transacao => {
  await transacao.table('series_treino').toCollection().modify(item => {
    if (item.modo_carga === undefined) item.modo_carga = 'total'
    if (item.peso_barra === undefined) item.peso_barra = 0
  })
})
