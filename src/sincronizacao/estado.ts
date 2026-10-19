import { useSyncExternalStore } from 'react'
import { liveQuery } from 'dexie'
import type { User } from '@supabase/supabase-js'
import { supabase } from './cliente'
import { contarPendencias, executarSync, prepararFila, prepararPrimeiroLogin, resolverConflito, retomarRestauracao, vincular, vinculoLocal, RevisaoPendente } from './motor'
import { mensagemPausa, pausaRestauracao, type ConflitoData } from './armazenamento'
import { transporteSupabase } from './transporte'
import { banco, tabela } from '../dados/banco'
import { nomesSync } from './motor'
interface Estado { usuario:User|null; carregando:boolean; vinculado:boolean; ocupado:boolean; mensagem:string; erro:string; pendentes:number; visitante:boolean; recuperando:boolean }
let estado:Estado={usuario:null,carregando:!!supabase,vinculado:false,ocupado:false,mensagem:'',erro:'',pendentes:0,visitante:false,recuperando:false}
const ouvintes=new Set<()=>void>()
const alterar=(valor:Partial<Estado>)=>{estado={...estado,...valor};ouvintes.forEach(f=>f())}
export function useConta(){return useSyncExternalStore(f=>{ouvintes.add(f);return()=>ouvintes.delete(f)},()=>estado)}
export function usuarioAtual(){return estado.usuario}
export function continuarSemConta(){alterar({visitante:true})}
export function definirRecuperacao(recuperando:boolean){alterar({recuperando})}
let ativo=false
export function iniciarConta(){
 if(ativo||!supabase)return
 ativo=true
 const atualizar=async(usuario:User|null)=>{
  alterar({usuario,carregando:false,vinculado:!!usuario&&await vinculoLocal()===usuario.id,mensagem:'',erro:''})
  if(usuario&&!estado.recuperando&&await vinculoLocal()===usuario.id)void sincronizarAutomatico()
 }
 void supabase.auth.getSession().then(({data,error})=>{if(error)alterar({carregando:false,erro:'Entre novamente para sincronizar.'});else void atualizar(data.session?.user??null)})
 supabase.auth.onAuthStateChange((evento,sessao)=>{if(evento==='SIGNED_IN'||evento==='SIGNED_OUT'||evento==='INITIAL_SESSION'||evento==='PASSWORD_RECOVERY')setTimeout(()=>{if(evento==='SIGNED_OUT')alterar({visitante:false,recuperando:false});void atualizar(sessao?.user??null)},0)})
 window.addEventListener('online',()=>void sincronizarAutomatico())
 document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')void sincronizarAutomatico()})
 window.addEventListener('vida-em-dia:treino-finalizado',()=>void sincronizarAutomatico())
 let atraso:ReturnType<typeof setTimeout>
 liveQuery(async()=>{for(const nome of nomesSync)await banco.table(nome).toArray()}).subscribe({next:()=>{
  clearTimeout(atraso);atraso=setTimeout(()=>void atualizarFila(),500)
 },error:()=>alterar({erro:'Não foi possível conferir as pendências. Seus registros locais foram preservados.'})})
}
export async function confirmarVinculo(){
 if(!estado.usuario||estado.ocupado)return
 if(!navigator.onLine)throw new Error('Conecte à internet para vincular este aparelho.')
 const usuario=estado.usuario.id
 alterar({ocupado:true})
 try{
  await prepararPrimeiroLogin(usuario,transporteSupabase)
  if(estado.usuario?.id!==usuario)throw new Error('A sessão mudou. Entre novamente antes de conectar os dados.')
  await vincular(usuario)
  if(estado.usuario?.id!==usuario)throw new Error('A sessão mudou. Entre novamente antes de sincronizar.')
  alterar({vinculado:true})
 }finally{alterar({ocupado:false})}
 await sincronizar()
}
export async function sincronizar(){
 if(estado.ocupado)return
 if(!estado.usuario||!estado.vinculado){alterar({erro:'Entre na conta e confirme a mesclagem para sincronizar.'});return}
 if(!navigator.onLine){alterar({erro:'Você está offline. Seus registros continuam salvos no aparelho.'});return}
 const usuario=estado.usuario.id
 alterar({ocupado:true,erro:'',mensagem:'Sincronizando…'})
 try{
  await executarSync(usuario,transporteSupabase)
  const pendentes=await contarPendencias(usuario)
  alterar({mensagem:pendentes?'Sincronização concluída. Novas alterações aguardam envio.':'Dados sincronizados.',pendentes})
 }
 catch(e){alterar({erro:e instanceof RevisaoPendente?'':e instanceof Error?e.message:'Não foi possível sincronizar. Tente novamente.',mensagem:'',pendentes:await contarPendencias(usuario)});if(e instanceof RevisaoPendente)return 'revisar' as const}
 finally{alterar({ocupado:false})}
}
async function sincronizarAutomatico(){
 try{
  if(await pausaRestauracao()){alterar({mensagem:mensagemPausa,pendentes:0});return}
  const config=await tabela('configuracoes').where('chave').equals('principal').first()
  if(config?.sync_automatico&&estado.vinculado&&navigator.onLine)await sincronizar()
  else await atualizarFila()
 }catch{alterar({erro:'Não foi possível conferir a sincronização. Seus registros continuam neste aparelho.'})}
}
async function atualizarFila(){
 try{if(await pausaRestauracao()){alterar({mensagem:mensagemPausa,pendentes:0});return}if(estado.usuario&&estado.vinculado&&!estado.ocupado){await prepararFila(estado.usuario.id);alterar({pendentes:await contarPendencias(estado.usuario.id)})}}
 catch(e){alterar({erro:e instanceof Error?e.message:'Não foi possível atualizar as pendências.'})}
}
export async function confirmarRetomada(){
 if(!estado.usuario||!estado.vinculado||estado.ocupado)throw new Error('Entre na conta vinculada e aguarde a operação atual terminar.')
 const usuario=estado.usuario.id
 alterar({ocupado:true})
 try{await retomarRestauracao(usuario)}finally{alterar({ocupado:false})}
 alterar({mensagem:'Restauração liberada para mesclar com a conta.',erro:''})
 await sincronizar()
}
export async function aplicarResolucao(chave:string,escolha:'local'|'remoto',visao:ConflitoData){
 if(!estado.usuario||!estado.vinculado||estado.ocupado)throw new Error('Entre na conta vinculada e aguarde a operação atual terminar.')
 if(!navigator.onLine)throw new Error('Conecte à internet para conferir o registro da conta antes de escolher.')
 const usuario=estado.usuario.id
 alterar({ocupado:true,erro:''})
 try{await resolverConflito(usuario,chave,escolha,transporteSupabase,visao)}
 finally{alterar({ocupado:false})}
 await sincronizar()
}
export async function sairConta(){
 if(estado.ocupado)throw new Error('Aguarde a sincronização terminar.')
 const {error}=await supabase!.auth.signOut({scope:'local'})
 if(error)throw new Error('Não foi possível sair. Tente novamente.')
 alterar({usuario:null,vinculado:false,visitante:false,recuperando:false,mensagem:'Sessão encerrada. Os registros continuam neste aparelho.'})
}
