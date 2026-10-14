import { supabase } from './cliente'
import type { Transporte } from './motor'
export const transporteSupabase:Transporte={
 async enviar(nome,registros){
  if(!supabase)throw new Error('Configure o Supabase para sincronizar.')
  const {error}=await supabase.rpc('vida_em_dia_enviar',{tabela_nome:nome,registros})
  if(error)throw new Error(error.code==='23505'?'Há registros diferentes para a mesma data na conta. Faça backup e revise os registros antes de tentar novamente.':error.code==='PGRST202'?'O banco ainda não foi configurado. Aplique a migração da etapa 8 no projeto correto.':'Não foi possível enviar os dados. Confira a conexão, a sessão e a configuração do Supabase.')
 },
 async baixar(nome,depois){
  if(!supabase)throw new Error('Configure o Supabase para sincronizar.')
  const {data,error}=await supabase.from(nome).select('*').gt('id',depois).order('id').limit(200)
  if(error)throw new Error('Não foi possível baixar os dados. A fila foi preservada; tente novamente.')
  return data??[]
 },
}
