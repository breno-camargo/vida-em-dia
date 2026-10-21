import { type Table } from 'dexie'
import { banco, observarBanco } from '../dados/banco'
export { banco as filaBanco } from '../dados/banco'
import type { NomeSync, Remoto } from './motor'

export interface Pendente { chave:string; usuario:string; tabela:NomeSync; registro:Remoto; assinatura:string }
interface Controle { chave:string; valor:string }
export interface ConflitoData {
  chave:string; usuario:string; tabela:NomeSync; data:string; local:Remoto; remoto:Remoto
}
export let pendencias: Table<Pendente,string>
export let recibos: Table<{chave:string;assinatura:string},string>
export let controle: Table<Controle,string>
export let conflitos: Table<ConflitoData,string>
function atualizarTabelas() {
 pendencias = banco.table('pendencias'); recibos = banco.table('recibos'); controle = banco.table('controle'); conflitos = banco.table('conflitos')
}
atualizarTabelas()
observarBanco(atualizarTabelas)
export async function pausaRestauracao(){ return (await controle.get('restauracao'))?.valor }
export const mensagemPausa = 'Sincronização pausada após restaurar o backup. Revise a retomada para mesclar com a conta.'

// O mesmo lock cobre importação, fila, envio, vínculo e resolução entre abas.
let sequencia:Promise<unknown> = Promise.resolve()
export function comExclusaoSync<T>(acao:()=>Promise<T>):Promise<T> {
  if(typeof navigator !== 'undefined' && navigator.locks) return navigator.locks.request('vida-em-dia-sincronizar',acao)
  // Na interface, falhe sem alterar dados quando não houver proteção entre abas.
  if(typeof window !== 'undefined') return Promise.reject(new Error('Este navegador não oferece proteção para sincronizar ou importar entre abas. Atualize-o e tente novamente.'))
  const resultado = sequencia.then(acao)
  sequencia = resultado.catch(()=>undefined)
  return resultado
}
