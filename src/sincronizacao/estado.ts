import { useSyncExternalStore } from 'react'
import { liveQuery } from 'dexie'
import type { User } from '@supabase/supabase-js'
import { supabase } from './cliente'
import { contarPendencias, executarSync, prepararFila, prepararPrimeiroLogin, vincular, vinculoLocal } from './motor'
import { transporteSupabase } from './transporte'
import { banco, tabela } from '../dados/banco'
import { nomesSync } from './motor'
interface Estado { usuario:User|null; carregando:boolean; vinculado:boolean; ocupado:boolean; mensagem:string; erro:string; pendentes:number }
let estado:Estado={usuario:null,carregando:!!supabase,vinculado:false,ocupado:false,mensagem:'',erro:'',pendentes:0}
const ouvintes=new Set<()=>void>()
const alterar=(valor:Partial<Estado>)=>{estado={...estado,...valor};ouvintes.forEach(f=>f())}
export function useConta(){return useSyncExternalStore(f=>{ouvintes.add(f);return()=>ouvintes.delete(f)},()=>estado)}
let ativo=false
export function iniciarConta(){
 if(ativo||!supabase)return
 ativo=true
 const atualizar=async(usuario:User|null)=>{
  alterar({usuario,carregando:false,vinculado:!!usuario&&await vinculoLocal()===usuario.id,mensagem:'',erro:''})
  if(usuario&&await vinculoLocal()===usuario.id)void sincronizarAutomatico()
 }
 void supabase.auth.getSession().then(({data,error})=>{if(error)alterar({carregando:false,erro:'Entre novamente para sincronizar.'});else void atualizar(data.session?.user??null)})
 supabase.auth.onAuthStateChange((evento,sessao)=>{if(evento==='SIGNED_IN'||evento==='SIGNED_OUT'||evento==='INITIAL_SESSION')setTimeout(()=>void atualizar(sessao?.user??null),0)})
 window.addEventListener('online',()=>void sincronizarAutomatico())
 document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')void sincronizarAutomatico()})
 window.addEventListener('vida-em-dia:treino-finalizado',()=>void sincronizarAutomatico())
 let atraso:ReturnType<typeof setTimeout>
 liveQuery(async()=>{for(const nome of nomesSync)await banco.table(nome).toArray()}).subscribe({next:()=>{
  clearTimeout(atraso);atraso=setTimeout(()=>void atualizarFila(),500)
 },error:()=>alterar({erro:'Não foi possível conferir as pendências. Seus registros locais foram preservados.'})})
}
export async function confirmarVinculo(){
 if(!estado.usuario)return
 if(!navigator.onLine)throw new Error('Conecte à internet para vincular este aparelho.')
 await prepararPrimeiroLogin(estado.usuario.id,transporteSupabase)
 await vincular(estado.usuario.id);alterar({vinculado:true});await sincronizar()
}
export async function sincronizar(){
 if(estado.ocupado)return
 if(!estado.usuario||!estado.vinculado){alterar({erro:'Entre na conta e confirme a mesclagem para sincronizar.'});return}
 if(!navigator.onLine){alterar({erro:'Você está offline. Seus registros continuam salvos no aparelho.'});return}
 const usuario=estado.usuario.id
 alterar({ocupado:true,erro:'',mensagem:'Sincronizando…'})
 try{
  const executar=()=>executarSync(usuario,transporteSupabase)
  if(navigator.locks)await navigator.locks.request('vida-em-dia-sincronizar',executar);else await executar()
  const pendentes=await contarPendencias(usuario)
  alterar({mensagem:pendentes?'Sincronização concluída. Novas alterações aguardam envio.':'Dados sincronizados.',pendentes})
 }
 catch(e){alterar({erro:e instanceof Error?e.message:'Não foi possível sincronizar. Tente novamente.',mensagem:'',pendentes:await contarPendencias(usuario)})}
 finally{alterar({ocupado:false})}
}
async function sincronizarAutomatico(){
 try{
  const config=await tabela('configuracoes').where('chave').equals('principal').first()
  if(config?.sync_automatico&&estado.vinculado&&navigator.onLine)await sincronizar()
  else await atualizarFila()
 }catch{alterar({erro:'Não foi possível conferir a sincronização. Seus registros continuam neste aparelho.'})}
}
async function atualizarFila(){
 try{if(estado.usuario&&estado.vinculado&&!estado.ocupado){await prepararFila(estado.usuario.id);alterar({pendentes:await contarPendencias(estado.usuario.id)})}}
 catch(e){alterar({erro:e instanceof Error?e.message:'Não foi possível atualizar as pendências.'})}
}
export async function sairConta(){
 if(estado.ocupado)throw new Error('Aguarde a sincronização terminar.')
 const {error}=await supabase!.auth.signOut({scope:'local'})
 if(error)throw new Error('Não foi possível sair. Tente novamente.')
 alterar({usuario:null,vinculado:false,mensagem:'Sessão encerrada. Os registros continuam neste aparelho.'})
}
