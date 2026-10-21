import Dexie from 'dexie'
import { banco, identidadeAtual } from './banco'
import { comExclusaoSync } from '../sincronizacao/armazenamento'
export async function pendenciasLimpeza(){return await banco.table('pendencias').count()+await banco.table('remocoes_storage').count()}
export async function apagarBancoAtual(confirmado:boolean,aceitarPendencias:boolean){
 if(!confirmado)throw new Error('Confirme que deseja apagar os dados deste aparelho.')
 return comExclusaoSync(async()=>{
  if(await pendenciasLimpeza()&&!aceitarPendencias)throw new Error('Há envios ou remoções de fotos pendentes. Confirme a perda dessas pendências.')
  const atual=banco,dono=identidadeAtual()
  try{await atual.delete()}catch{if(atual===banco&&identidadeAtual()===dono)await atual.open();throw new Error('Não foi possível apagar este banco. Feche as outras abas e tente novamente.')}
 })
}
export async function apagarLegado(confirmacao:string){
 if(confirmacao!=='APAGAR LEGADO')throw new Error('Digite APAGAR LEGADO para confirmar separadamente.')
 if(!indexedDB.databases)throw new Error('Não foi possível verificar a existência do legado.')
 if((await indexedDB.databases()).some(db=>db.name==='vida-em-dia'))await Dexie.delete('vida-em-dia')
}
export async function excluirContaConfirmada(enviar:()=>Promise<{concluido?:boolean;etapa?:string;erro?:string}>){
 const origem=banco,dono=identidadeAtual()
 // Falha de rede/servidor nunca apaga o armazenamento local.
 const resposta=await enviar()
 if(origem!==banco||dono!==identidadeAtual())throw new Error('A identidade mudou. Limpeza local cancelada.')
 if(resposta.concluido!==true)throw new Error(resposta.erro??`Exclusão incompleta (${resposta.etapa??'servidor'}). Seus dados locais permanecem.`)
 await apagarBancoAtual(true,true)
}
