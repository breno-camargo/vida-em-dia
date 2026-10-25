import { exerciciosPesoCorporal } from './pesoCorporal'
import Dexie, { type Table } from 'dexie'
import type { Tabelas } from './modelos'

export function criarBancoIdentidade(nome: string) {
const banco = new Dexie(nome, { autoOpen: false })
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

banco.version(3).stores({
  treino_exercicios: `${base}, treino_id, exercicio_id, [treino_id+ordem]`,
}).upgrade(async transacao => {
  await transacao.table('series_treino').toCollection().modify(item => {
    if (item.modo_carga === undefined) item.modo_carga = 'total'
    if (item.peso_barra === undefined) item.peso_barra = 0
  })
})
banco.version(4).stores({}).upgrade(async transacao => {
  const atualizado = new Date().toISOString()
  await transacao.table('exercicios').where('grupo_muscular').equals('Glúteos e panturrilhas').modify(item => {
    const grupo = item.nome.toLocaleLowerCase('pt-BR').includes('panturrilha') ? 'Panturrilhas' : 'Glúteos'
    item.grupo_muscular = grupo
    if (item.musculos === 'Glúteos e panturrilhas') item.musculos = grupo
    item.atualizado_em = atualizado
  })
})

banco.version(5).stores({}).upgrade(async transacao => {
  const atualizado = new Date().toISOString()
  const ids = new Set<string>()
  await transacao.table('exercicios').toCollection().modify(item => {
    if (exerciciosPesoCorporal.has(item.nome) && item.modo_carga === 'total') {
      item.modo_carga = 'peso_corporal'; item.peso_barra = 0; item.atualizado_em = atualizado; ids.add(item.id)
    }
  })
  const ativos = new Set((await transacao.table('treinos').toArray()).filter(t => !t.fim && !t.apagado_em).map(t => t.id))
  await transacao.table('series_treino').toCollection().modify(item => {
    if (ativos.has(item.treino_id) && ids.has(item.exercicio_id) && !item.concluida_em) {
      item.modo_carga = 'peso_corporal'; item.peso_digitado = 0; item.peso_total = 0; item.peso_barra = 0; item.reducoes = []; item.atualizado_em = atualizado
    }
  })
})

banco.version(6).stores({
 pendencias: 'chave, usuario, tabela', recibos: 'chave', controle: 'chave', conflitos: 'chave, usuario, tabela, data'
})
banco.version(7).stores({remocoes_storage:'caminho, usuario'})
for(const t of banco.tables.filter(t=>!['pendencias','recibos','controle','conflitos','remocoes_storage'].includes(t.name)))t.hook('updating',(_mudancas,_id,anterior)=>{if(anterior.eliminado_em)throw new Error('Registro eliminado definitivamente. Não pode ser alterado.')})
return banco
}

export const tabelasInternas = new Set(['pendencias','recibos','controle','conflitos','remocoes_storage'])
export type Identidade = string | null
let identidade: Identidade = null
let geracao = 0
export let banco = criarBancoIdentidade('vida-em-dia:visitante')
const ouvintes = new Set<() => void>()
let troca: Promise<unknown> = Promise.resolve()
export function identidadeAtual() { return identidade }
export function geracaoAtual() { return geracao }
export function observarBanco(ouvinte: () => void) { ouvintes.add(ouvinte); return () => { ouvintes.delete(ouvinte) } }
export function tabelasDados() { return banco.tables.filter(t => !tabelasInternas.has(t.name)) }
export function tabela<K extends keyof Tabelas>(nome: K): Table<Tabelas[K], string> { return banco.table(nome) }
export function fecharIdentidade() { banco.close(); geracao++; ouvintes.forEach(f => f()) }
export function abrirIdentidade(usuario: Identidade) {
 if (usuario !== null && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(usuario)) return Promise.reject(new Error('Identidade local inválida.'))
 const abrir = async () => {
  if (identidade === usuario && banco.isOpen()) return
  const anterior = banco
  anterior.close(); geracao++
  if (anterior.isOpen()) throw new Error('O espaço anterior não foi fechado.')
  identidade = usuario
  banco = criarBancoIdentidade('vida-em-dia:' + (usuario ?? 'visitante'))
  const geracaoAbrindo = geracao, abrindo = banco
  ouvintes.forEach(f => f())
  await banco.open()
  if(geracaoAbrindo!==geracao || abrindo!==banco){abrindo.close();throw new Error('Abertura cancelada por troca de identidade.')}
  // Prévia HTTP em visitante: adiar a manutenção destrutiva até haver Web Locks.
  // Importação, limpeza e sincronização continuam falhando de forma fechada.
  if (usuario === null && typeof window !== 'undefined' && window.isSecureContext === false && !navigator.locks) return
  await (await import('./eliminacao')).purgarRemovidos()
 }
 const resultado = troca.then(abrir)
 troca = resultado.catch(() => undefined)
 return resultado
}
