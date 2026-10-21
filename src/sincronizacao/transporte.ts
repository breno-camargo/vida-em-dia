import { supabase, sessaoLocal } from './cliente'
import { banco, identidadeAtual } from '../dados/banco'
import type { Transporte } from './motor'
import { ColisaoData } from './motor'
export const transporteSupabase:Transporte={
 async enviar(nome,registros){
  const identidade = identidadeAtual(), sessao = sessaoLocal()
  if (!identidade || !banco.isOpen() || sessao?.user.id !== identidade || registros.some(r => r.user_id !== identidade)) throw new Error('A sessão mudou. Nenhum registro foi enviado.')
  if(!supabase)throw new Error('Configure o Supabase para sincronizar.')
  const {error}=await supabase.rpc('vida_em_dia_enviar',{tabela_nome:nome,registros})
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
