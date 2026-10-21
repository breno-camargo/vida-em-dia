import { banco, identidadeAtual, tabelasDados } from './banco'
import { comExclusaoSync } from '../sincronizacao/armazenamento'
import { eliminado, RETENCAO_REMOVIDOS_DIAS, tombstone } from './retencao'

export interface RemocaoObjeto { caminho:string; usuario:string; tentativas:number }
const dependencias:Record<string,[string,string][]>={fichas:[['ficha_exercicios','ficha_id']],exercicios:[['ficha_exercicios','exercicio_id'],['treino_exercicios','exercicio_id'],['series_treino','exercicio_id'],['cardio_sessoes','exercicio_id'],['fotos','exercicio_id']],treinos:[['treino_exercicios','treino_id'],['series_treino','treino_id'],['cardio_sessoes','treino_id']],medidas_corporais:[['fotos','medida_id']]}
// Deve ser chamada sob o lock e uma transação que inclua todas as tabelas.
export async function eliminarNaTransacao(nome:string,id:string,quando=new Date().toISOString()) {
 const dono=identidadeAtual(),t=banco.table(nome),r=await t.get(id)
 if(!r||r.user_id!==dono||eliminado(r))return
 if(nome==='configuracoes')throw new Error('Para eliminar seu perfil, use Excluir conta ou apagar dados deste aparelho.')
 for(const[filha,campo]of dependencias[nome]??[])for(const filho of await banco.table(filha).filter(r=>r[campo]===id).toArray())await eliminarNaTransacao(filha,filho.id,quando)
 if(nome==='fotos'&&typeof r.caminho_storage==='string'&&dono){
  if(!r.caminho_storage.startsWith(dono+'/'))throw new Error('Caminho de foto de outro proprietário.')
  await banco.table('remocoes_storage').put({caminho:r.caminho_storage,usuario:dono,tentativas:0})
 }
 await t.put(tombstone(r,quando))
 // A fila é reconstruída a partir do tombstone; nenhum snapshot pessoal sobrevive.
 await banco.table('pendencias').filter(p=>p.tabela===nome&&p.registro.id===id).delete()
 await banco.table('recibos').filter(p=>p.chave.endsWith('/'+nome+'/'+id)).delete()
 await banco.table('conflitos').filter(c=>(c.tabela===nome&&(c.local.id===id||c.remoto.id===id))).delete()
}
export async function eliminarRegistro(nome:string,id:string,confirmado:boolean) {
 if(!confirmado)throw new Error('Confirme a eliminação definitiva. Não há Desfazer.')
 if(!tabelasDados().some(t=>t.name===nome))throw new Error('Tabela inválida.')
 return comExclusaoSync(()=>banco.transaction('rw',banco.tables,()=>eliminarNaTransacao(nome,id)))
}
export async function purgarRemovidos(agora=Date.now()) {
 return comExclusaoSync(()=>banco.transaction('rw',banco.tables,async()=>{
  for(const t of tabelasDados().filter(t=>t.name!=='configuracoes'))for(const r of await t.toArray()){
   if(r.user_id===identidadeAtual()&&!eliminado(r)&&r.apagado_em&&Date.parse(r.apagado_em)<=agora-RETENCAO_REMOVIDOS_DIAS*86400000)await eliminarNaTransacao(t.name,r.id,new Date(agora).toISOString())
  }
 }))
}
export async function processarRemocoesStorage(usuario:string,remover:(caminho:string)=>Promise<void>) {
 for(const item of await banco.table<RemocaoObjeto>('remocoes_storage').toArray()){
  if(usuario!==identidadeAtual()||item.usuario!==usuario||!item.caminho.startsWith(usuario+'/'))throw new Error('A identidade mudou. Remoção cancelada.')
  try{await remover(item.caminho);if(usuario!==identidadeAtual())throw new Error('A identidade mudou.');await banco.table('remocoes_storage').delete(item.caminho)}
  catch{await banco.table('remocoes_storage').update(item.caminho,{tentativas:item.tentativas+1});throw new Error('Conteúdo local eliminado. Fotos remotas aguardam nova tentativa de remoção.')}
 }
}
