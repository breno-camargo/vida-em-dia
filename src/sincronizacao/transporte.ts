import { supabase, sessaoLocal } from './cliente'
import { banco, identidadeAtual } from '../dados/banco'
import type { Transporte } from './motor'
import { ColisaoData, EliminadoRemoto } from './motor'
import { eliminado } from '../dados/retencao'
import { processarRemocoesStorage } from '../dados/eliminacao'
export const transporteSupabase:Transporte={
 async enviar(nome,registros){
  const identidade = identidadeAtual(), sessao = sessaoLocal()
  if (!identidade || !banco.isOpen() || sessao?.user.id !== identidade || registros.some(r => r.user_id !== identidade)) throw new Error('A sessão mudou. Nenhum registro foi enviado.')
  if(!supabase)throw new Error('Configure o Supabase para sincronizar.')
  for(const r of registros.filter(r=>eliminado(r.dados)))await enviarEliminacao(nome,r.id,identidade)
  const ativos=registros.filter(r=>!eliminado(r.dados))
  if(!ativos.length)return
  if(!banco.isOpen()||identidadeAtual()!==identidade||sessaoLocal()?.user.id!==identidade)throw new Error('A sessão mudou. Nenhum registro foi enviado.')
  const {error}=await supabase.rpc('vida_em_dia_enviar',{tabela_nome:nome,registros:ativos})
  if(error?.code==='P0002')throw new EliminadoRemoto('Registro eliminado na conta.')
  if(error?.code==='23505')throw new ColisaoData('Há registros diferentes para a mesma data na conta. Sincronize para revisar os registros.')
  if(error)throw new Error(error.code==='PGRST202'?'O banco ainda não foi configurado. Aplique a migração da etapa 8 no projeto correto.':'Não foi possível enviar os dados. Confira a conexão, a sessão e a configuração do Supabase.')
 },
 async baixar(nome,depois){
  if (!banco.isOpen() || !identidadeAtual() || sessaoLocal()?.user.id !== identidadeAtual()) throw new Error('A sessão mudou. Download cancelado.')
  if(!supabase)throw new Error('Configure o Supabase para sincronizar.')
  const {data,error}=await supabase.from(nome).select('*').gt('id',depois).order('id').limit(200)
  if(error)throw new Error('Não foi possível baixar os dados. A fila foi preservada; tente novamente.')
  return data??[]
 },
}
export async function enviarEliminacao(nome:string,id:string,usuario=identidadeAtual()){
 if(!supabase||!usuario||identidadeAtual()!==usuario||!banco.isOpen()||sessaoLocal()?.user.id!==usuario)throw new Error('A sessão mudou. Eliminação cancelada.')
 const {error}=await supabase.rpc('vida_em_dia_eliminar',{tabela_nome:nome,registro_id:id})
 if(error)throw new Error('Eliminação local concluída; exclusão na conta aguarda sincronização.')
}
export async function sincronizarEliminacaoFotos(usuario:string){
 for(const foto of await banco.table('fotos').filter(r=>r.user_id===usuario&&!!r.eliminado_em).toArray())await enviarEliminacao('fotos',foto.id,usuario)
 await processarRemocoesStorage(usuario,async caminho=>{
  if(!supabase||sessaoLocal()?.user.id!==usuario||identidadeAtual()!==usuario)throw new Error('A sessão mudou.')
  const {error}=await supabase.storage.from('fotos-vida-em-dia').remove([caminho])
  if(error)throw new Error('Remoção remota pendente.')
 })
}
