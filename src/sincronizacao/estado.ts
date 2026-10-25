import { useSyncExternalStore } from 'react'
import { observarDados } from './observarDados'
import { atualizarCampos } from '../utilitarios/atualizarCampos'
import type { User } from '@supabase/supabase-js'
import { supabase, sessaoLocal, removerSessaoLocal } from './cliente'
import { apagarBancoAtual, excluirContaConfirmada } from '../dados/limpezaAparelho'
import { abrirIdentidade, identidadeAtual, observarBanco } from '../dados/banco'
import { iniciarBanco } from '../dados/configuracoes'
import { iniciarBiblioteca } from '../dados/biblioteca'
import { iniciarFeriados } from '../dados/atividade'
import { reiniciarIdentidade } from './trocaIdentidade'
import { contarPendencias, executarSync, prepararFila, prepararPrimeiroLogin, resolverConflito, retomarRestauracao, vincular, vinculoLocal, RevisaoPendente } from './motor'
import { mensagemPausa, pausaRestauracao, type ConflitoData } from './armazenamento'
import { transporteSupabase, sincronizarEliminacaoFotos } from './transporte'
import { banco, tabela } from '../dados/banco'
import { nomesSync } from './motor'
interface Estado { usuario:User|null; carregando:boolean; vinculado:boolean; ocupado:boolean; mensagem:string; erro:string; pendentes:number; visitante:boolean; recuperando:boolean }
let estado:Estado={usuario:null,carregando:!!supabase,vinculado:false,ocupado:false,mensagem:'',erro:'',pendentes:0,visitante:false,recuperando:false}
const ouvintes=new Set<()=>void>()
const alterar=(valor:Partial<Estado>)=>{const novo=atualizarCampos(estado,valor);if(novo===estado)return;estado=novo;ouvintes.forEach(f=>f())}
const assinar=(f:()=>void)=>{ouvintes.add(f);return()=>{ouvintes.delete(f)}}
const lerEstado=()=>estado
export function useConta(){return useSyncExternalStore(assinar,lerEstado)}
export function usuarioAtual(){return estado.usuario}
export function continuarSemConta(){localStorage.setItem('vida-em-dia:visitante-ativo','sim');reiniciarIdentidade()}
export function definirRecuperacao(recuperando:boolean){alterar({recuperando})}
let ativo=false
let encerrando=false
export async function iniciarConta(){
 if(ativo)return
 ativo=true
 const usuario = sessaoLocal()?.user ?? null
 const visitante = !usuario && (!supabase || localStorage.getItem('vida-em-dia:visitante-ativo') === 'sim')
 await abrirIdentidade(usuario?.id ?? null)
 await iniciarBanco(); await iniciarBiblioteca(); await iniciarFeriados()
 alterar({usuario,visitante,carregando:false,vinculado:!!usuario&&await vinculoLocal()===usuario.id})
 if(!supabase)return
 const atualizar=async(usuario:User|null)=>{
  alterar({usuario,carregando:false,vinculado:!!usuario&&await vinculoLocal()===usuario.id,mensagem:'',erro:''})
  if(usuario&&!estado.recuperando&&await vinculoLocal()===usuario.id)void sincronizarAutomatico()
 }
 // Sessão inicial resolvida localmente, inclusive expirada offline.
 supabase.auth.onAuthStateChange((evento,sessao)=>{
  if(encerrando)return
  if(!navigator.onLine&&!sessao?.user&&estado.usuario)return
  if(['SIGNED_IN','SIGNED_OUT','INITIAL_SESSION','PASSWORD_RECOVERY'].includes(evento)){
   const usuarioEvento=sessao?.user??null
   if((usuarioEvento?.id??null)!==identidadeAtual()){
    localStorage.removeItem('vida-em-dia:visitante-ativo')
    reiniciarIdentidade()
   }else setTimeout(()=>void atualizar(usuarioEvento),0)
  }
 })
 window.addEventListener('online',()=>void sincronizarAutomatico())
 document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')void sincronizarAutomatico()})
 window.addEventListener('vida-em-dia:treino-finalizado',()=>void sincronizarAutomatico())
 let atraso:ReturnType<typeof setTimeout>
 const origem=banco
 const agendar=()=>{
  if(banco!==origem)return
  clearTimeout(atraso);atraso=setTimeout(()=>{if(banco===origem&&origem.isOpen())void atualizarFila()},500)
 }
 const parar=observarDados(banco.name,nomesSync,agendar)
 const pararBanco=observarBanco(()=>{clearTimeout(atraso);parar();pararBanco()})
 agendar()
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
  await sincronizarEliminacaoFotos(usuario)
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
async function concluirLimpeza(){
 try{await supabase?.auth.signOut({scope:'local'})}catch{/* Auth já pode ter sido eliminado; limpar só a sessão local abaixo. */}
 removerSessaoLocal();localStorage.removeItem('vida-em-dia:visitante-ativo');reiniciarIdentidade()
}
export async function sairApagandoDados(aceitarPendencias:boolean){
 if(estado.ocupado)throw new Error('Aguarde a sincronização terminar.')
 alterar({ocupado:true});encerrando=true
 try{
  if(estado.usuario&&estado.vinculado&&!await pausaRestauracao())await prepararFila(estado.usuario.id)
  await apagarBancoAtual(true,aceitarPendencias)
  await concluirLimpeza()
 }finally{encerrando=false;alterar({ocupado:false})}
}
export async function excluirMinhaConta(senha:string,confirmacao:string){
 if(!supabase||!estado.usuario||estado.ocupado)throw new Error('Entre na conta e aguarde a sincronização terminar.')
 if(confirmacao!=='EXCLUIR MINHA CONTA')throw new Error('Digite EXCLUIR MINHA CONTA.')
 const usuario=estado.usuario.id
 alterar({ocupado:true});encerrando=true
 try{
  await excluirContaConfirmada(async()=>{
   const {data,error}=await supabase!.functions.invoke('excluir-conta',{body:{senha,confirmacao}})
   if(identidadeAtual()!==usuario)throw new Error('A sessão mudou. Limpeza local cancelada.')
   if(error){
    let detalhe:{etapa?:string;erro?:string}|undefined
    try{detalhe=await error.context?.json()}catch{/* Não mostrar detalhes internos do SDK. */}
    throw new Error(detalhe?.erro??'Não foi possível confirmar a exclusão. Ela pode estar incompleta; seus dados locais permanecem. Tente novamente.')
   }
   return data
  })
  await concluirLimpeza()
 }finally{encerrando=false;alterar({ocupado:false})}
}
