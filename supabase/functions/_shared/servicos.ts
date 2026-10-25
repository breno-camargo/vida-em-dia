import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { ServicosExclusao } from './handlers.ts'
const bucket='fotos-vida-em-dia'
function conferir(erro:unknown){if(erro)throw new Error('Operação remota incompleta.')}
export function servicos(url:string,anonKey:string,serviceKey:string,origem:string){
 const opcoes={auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}}
 const anon=createClient(url,anonKey,opcoes),admin=createClient(url,serviceKey,opcoes)
 const api:ServicosExclusao={origem,
  async validarJWT(token){const {data,error}=await anon.auth.getUser(token);return error?null:data.user},
  async tentar(id){const{data,error}=await admin.rpc('vida_em_dia_tentar_exclusao',{dono:id});conferir(error);return data===true},
  async verificarSenha(email,senha){
   const reauth=createClient(url,anonKey,opcoes)
   const {data,error}=await reauth.auth.signInWithPassword({email,password:senha})
   const id=error?null:data.user?.id??null
   if(data.session)await reauth.auth.signOut({scope:'local'})
   return id
  },
  async marcar(id,etapa){const{error}=await admin.from('vida_em_dia_exclusao_conta').upsert({user_id:id,etapa});conferir(error)},
  async apagarStorage(id){await apagarPasta(admin,id,id)},
  async apagarLinhas(id){const{error}=await admin.rpc('vida_em_dia_apagar_linhas_conta',{dono:id});conferir(error)},
  async apagarAuth(id){const{error}=await admin.auth.admin.deleteUser(id,false);conferir(error)},
 }
 return {api,
  async purgar(){const{error}=await admin.rpc('vida_em_dia_purgar');conferir(error)},
  async removerObjetos(){
   // Lote limitado por execução; removidos só saem da fila após sucesso da API.
   const{data,error}=await admin.from('vida_em_dia_remocoes_storage').select('user_id,caminho').limit(100);conferir(error)
   for(const r of data??[]){if(!r.caminho.startsWith(r.user_id+'/'))throw new Error('Caminho inválido.');const{error}=await admin.storage.from(bucket).remove([r.caminho]);conferir(error);const resultado=await admin.from('vida_em_dia_remocoes_storage').delete().eq('user_id',r.user_id).eq('caminho',r.caminho);conferir(resultado.error)}
  },
 }
}
async function apagarPasta(admin:SupabaseClient,prefixo:string,dono:string,profundidade=0):Promise<void>{
 if(profundidade>20||(prefixo!==dono&&!prefixo.startsWith(dono+'/')))throw new Error('Pasta inválida.')
 for(let pagina=0;pagina<1000;pagina++){
  const{data,error}=await admin.storage.from(bucket).list(prefixo,{limit:100,offset:0,sortBy:{column:'name',order:'asc'}});conferir(error)
  if(!data?.length)return
  const arquivos:string[]=[]
  for(const item of data){if(item.name.includes('/')||item.name==='..'||item.name==='.')throw new Error('Nome inválido.');const caminho=prefixo+'/'+item.name;if(item.id)arquivos.push(caminho);else await apagarPasta(admin,caminho,dono,profundidade+1)}
  if(arquivos.length){const{error}=await admin.storage.from(bucket).remove(arquivos);conferir(error)}
 }
 throw new Error('Limite da execução atingido. Repita para continuar.')
}
