import { banco } from '../dados/banco'
import { comExclusaoSync, controle, conflitos, filaBanco, mensagemPausa, pausaRestauracao, pendencias, recibos, type ConflitoData } from './armazenamento'
export { filaBanco } from './armazenamento'
import type { LinhaBackup } from '../dados/backup'
import { importarBackup } from '../dados/backup'
import { nomesBibliotecaInicial } from '../dados/biblioteca'

export const nomesSync = ['exercicios','fichas','ficha_exercicios','treinos','treino_exercicios','series_treino','cardio_sessoes','medidas_corporais','atividade_diaria','feriados','refeicoes_dia','alimentos_favoritos','combos_refeicao','agua_dia','consumo_diario_meta','configuracoes'] as const
export type NomeSync = typeof nomesSync[number]
export interface Remoto { id:string; user_id:string; criado_em:string; atualizado_em:string; apagado_em:string|null; dados:LinhaBackup }
export interface Transporte {
  enviar(nome:NomeSync, registros:Remoto[]):Promise<void>
  baixar(nome:NomeSync, depois:string):Promise<Remoto[]>
}
export async function vinculoLocal(){return (await controle.get('usuario'))?.valor}
export async function aparelhoSemRegistros(){
  for(const nome of nomesSync.filter(n=>!['exercicios','configuracoes','feriados'].includes(n)))if(await banco.table(nome).count())return false
  if(await banco.table('fotos').count())return false
  const exercicios=await banco.table('exercicios').toArray()
  if(exercicios.length!==nomesBibliotecaInicial.length||exercicios.some(r=>!nomesBibliotecaInicial.includes(r.nome)||r.nota_fixa||r.como_fazer||r.equipamento||r.apagado_em||r.atualizado_em!==r.criado_em))return false
  const config=await banco.table('configuracoes').where('chave').equals('principal').first()
  return !!config&&!config.user_id&&!config.ultimo_backup&&Date.parse(config.atualizado_em)-Date.parse(config.criado_em)<10000
}
export async function prepararPrimeiroLogin(usuario:string,transporte:Transporte){
  if(await vinculoLocal())return
  if(!await aparelhoSemRegistros())return
  const dados:Record<string,LinhaBackup[]>={fotos:[]}
  for(const nome of nomesSync){
    dados[nome]=[];let depois=''
    for(;;){const lote=await transporte.baixar(nome,depois);if(!lote.length)break
      for(const r of lote){if(r.user_id!==usuario||r.dados.user_id!==usuario||r.dados.id!==r.id)throw new Error('Resposta de sincronização inválida.');dados[nome].push({...r.dados})}
      depois=lote.at(-1)!.id;if(lote.length<200)break
    }
  }
  // Só substitui o catálogo padrão intocado quando a conta já tem configuração.
  if(!dados.configuracoes.length)return
  const c=dados.configuracoes[0]
  dados.configuracoes=[{...c,id:crypto.randomUUID(),sync_automatico:false}]
  if(!await aparelhoSemRegistros())throw new Error('Os dados locais mudaram durante a conexão. Confirme a mesclagem novamente.')
  await importarBackup({app:'vida-em-dia',versao:1,schema:banco.verno,criado_em:new Date().toISOString(),fotos_incluidas:false,tabelas:dados},'substituir',async()=>{
    if(!await aparelhoSemRegistros())throw new Error('Os dados locais mudaram durante a conexão. Confirme a mesclagem novamente.')
  })
}
export async function vincular(usuario:string){
 return comExclusaoSync(async()=>{
  const anterior=await vinculoLocal()
  if(anterior&&anterior!==usuario)throw new Error('Este aparelho está vinculado a outra conta. Entre com a mesma conta para proteger seus dados.')
  for(const nome of nomesSync){if(await banco.table(nome).filter(r=>r.user_id&&r.user_id!==usuario).count())throw new Error('Existem dados de outra conta neste aparelho. Não é possível mesclar automaticamente.')}
  await controle.put({chave:'usuario',valor:usuario})
 })
}
function assinatura(valor:unknown):string{
  if(Array.isArray(valor))return '['+valor.map(assinatura).join(',')+']'
  if(valor&&typeof valor==='object')return '{'+Object.entries(valor).filter(([,v])=>v!==undefined).sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>JSON.stringify(k)+':'+assinatura(v)).join(',')+'}'
  return JSON.stringify(valor)
}
function serializar(nome:NomeSync,r:LinhaBackup,usuario:string):Remoto{
  const dados:LinhaBackup={...r,user_id:usuario,criado_em:new Date(String(r.criado_em)).toISOString(),atualizado_em:new Date(r.atualizado_em).toISOString(),apagado_em:r.apagado_em?new Date(String(r.apagado_em)).toISOString():null}
  if(nome==='configuracoes'){
    dados.id='principal'
    for(const c of ['ultimo_backup','ultima_sincronizacao','sync_automatico'])delete dados[c]
  }
  return {id:dados.id,user_id:usuario,criado_em:String(dados.criado_em),atualizado_em:dados.atualizado_em,apagado_em:dados.apagado_em as string|null,dados}
}
const chaveFila=(usuario:string,nome:string,id:string)=>`${usuario}/${nome}/${id}`
export async function prepararFila(usuario:string){
 return comExclusaoSync(()=>prepararFilaInterna(usuario))
}
async function prepararFilaInterna(usuario:string){
  if(await vinculoLocal()!==usuario)throw new Error('Confirme a vinculação antes de sincronizar.')
  if(await pausaRestauracao())throw new Error(mensagemPausa)
  for(const nome of nomesSync){
    const linhas=await banco.table(nome).toArray() as LinhaBackup[]
    const chaves=new Set(linhas.map(r=>chaveFila(usuario,nome,nome==='configuracoes'?'principal':r.id)))
    await pendencias.where('usuario').equals(usuario).filter(p=>p.tabela===nome&&!chaves.has(p.chave)).delete()
    for(const r of linhas){
      if(r.user_id&&r.user_id!==usuario)throw new Error('Há dados de outra conta neste aparelho.')
      const registro=serializar(nome,r,usuario),chave=chaveFila(usuario,nome,registro.id),resumo=assinatura(registro)
      if((await recibos.get(chave))?.assinatura!==resumo)await pendencias.put({chave,usuario,tabela:nome,registro,assinatura:resumo})
      else await pendencias.delete(chave)
    }
  }
}
export async function contarPendencias(usuario:string){return pendencias.where('usuario').equals(usuario).count()}
export async function listarConflitos(usuario:string){return conflitos.where('usuario').equals(usuario).toArray()}
const tabelasPorData:readonly NomeSync[]=['medidas_corporais','atividade_diaria','agua_dia','consumo_diario_meta']
export class ColisaoData extends Error {}
export class RevisaoPendente extends Error {
  constructor(){super('Há registros da mesma data para revisar. As outras tabelas foram sincronizadas; escolha qual registro manter.')}
}
function validarRemoto(usuario:string,r:Remoto){
  if(r.user_id!==usuario||r.dados.id!==r.id||r.dados.user_id!==usuario||!Number.isFinite(Date.parse(r.criado_em))||!Number.isFinite(Date.parse(r.atualizado_em))||(r.apagado_em!==null&&!Number.isFinite(Date.parse(r.apagado_em))))throw new Error('Resposta de sincronização inválida.')
}
async function baixarTabela(usuario:string,nome:NomeSync,transporte:Transporte){
  const linhas:Remoto[]=[];let depois=''
  for(;;){
    const lote=await transporte.baixar(nome,depois)
    for(const r of lote){validarRemoto(usuario,r);if(r.id<=depois)throw new Error('Página de sincronização inválida.');linhas.push(r)}
    if(lote.length<200)break
    depois=lote.at(-1)!.id
  }
  return linhas
}
async function conferirDatas(usuario:string,nome:NomeSync,transporte:Transporte){
  const remotos=await baixarTabela(usuario,nome,transporte)
  const locais=await banco.table(nome).toArray() as LinhaBackup[]
  const porId=new Map(remotos.map(r=>[r.id,r]))
  const localPorId=new Map(locais.map(r=>[r.id,r]))
  const encontrados:ConflitoData[]=[]
  for(const local of locais){
    if(local.apagado_em)continue
    const mesmo=porId.get(local.id)
    // Uma versão remota mais recente vai substituir este registro pelo próprio ID.
    if(mesmo&&Date.parse(mesmo.atualizado_em)>=Date.parse(local.atualizado_em))continue
    for(const remoto of remotos){
      if(remoto.id===local.id||remoto.apagado_em||remoto.dados.data!==local.data)continue
      const alteracao=localPorId.get(remoto.id)
      if(alteracao&&Date.parse(alteracao.atualizado_em)>Date.parse(remoto.atualizado_em)&&(alteracao.apagado_em||alteracao.data!==local.data))continue
      encontrados.push({chave:chaveFila(usuario,nome,`${local.id}/${remoto.id}`),usuario,tabela:nome,data:String(local.data),local:serializar(nome,local,usuario),remoto})
    }
  }
  await filaBanco.transaction('rw',conflitos,async()=>{
    await conflitos.where('usuario').equals(usuario).filter(c=>c.tabela===nome).delete()
    await conflitos.bulkPut(encontrados)
  })
  return encontrados.length
}
export async function retomarRestauracao(usuario:string){
  return comExclusaoSync(async()=>{
    if(await vinculoLocal()!==usuario)throw new Error('Entre na conta vinculada a este aparelho.')
    if(!await pausaRestauracao())return
    await filaBanco.transaction('rw',controle,pendencias,recibos,conflitos,async()=>{
      await pendencias.clear();await recibos.clear();await conflitos.clear()
      await controle.delete('restauracao')
    })
  })
}
export async function resolverConflito(usuario:string,chave:string,escolha:'local'|'remoto',transporte:Transporte,visao?:ConflitoData){
  return comExclusaoSync(async()=>{
    if(await vinculoLocal()!==usuario)throw new Error('Entre na conta vinculada a este aparelho.')
    if(await pausaRestauracao())throw new Error(mensagemPausa)
    if(escolha!=='local'&&escolha!=='remoto')throw new Error('Escolha qual registro manter.')
    const conflito=await conflitos.get(chave)
    if(!conflito||conflito.usuario!==usuario||!tabelasPorData.includes(conflito.tabela))throw new Error('Atualize a revisão dos registros antes de continuar.')
    if(visao&&assinatura(visao)!==assinatura(conflito))throw new Error('A revisão mudou. Compare os valores novamente antes de escolher.')
    const {tabela:nome,local:anterior,remoto:previsto}=conflito
    const remoto=(await baixarTabela(usuario,nome,transporte)).find(r=>r.id===previsto.id)
    if(!remoto||assinatura(remoto)!==assinatura(previsto))throw new Error('O registro da conta mudou. Sincronize para atualizar a revisão antes de escolher novamente.')
    await banco.transaction('rw',banco.table(nome),banco.table('fotos'),async()=>{
      const t=banco.table(nome),local=await t.get(anterior.id)
      if(!local||assinatura(serializar(nome,local,usuario))!==assinatura(anterior))throw new Error('O registro deste aparelho mudou. Sincronize para atualizar a revisão antes de escolher novamente.')
      const canonico=await t.get(remoto.id)
      if(canonico&&Date.parse(canonico.atualizado_em)>Date.parse(remoto.atualizado_em))throw new Error('Há outra alteração local para esse registro. Atualize a revisão antes de continuar.')
      const agora=new Date(Math.max(Date.now(),Date.parse(local.atualizado_em)+1,Date.parse(remoto.atualizado_em)+1)).toISOString()
      // Preserva o conteúdo recusado como tombstone, inclusive para o backup.
      const recusado=escolha==='local'?remoto.dados:local
      await t.put({...recusado,id:local.id,user_id:usuario,criado_em:local.criado_em,apagado_em:agora,atualizado_em:agora})
      const escolhido=escolha==='local'?local:remoto.dados
      await t.put({...escolhido,id:remoto.id,user_id:usuario,criado_em:remoto.criado_em,atualizado_em:agora,apagado_em:null})
      if(nome==='medidas_corporais'&&escolha==='local')await banco.table('fotos').where('medida_id').equals(local.id).modify({medida_id:remoto.id,atualizado_em:agora})
    })
    await conflitos.delete(chave)
    await prepararFilaInterna(usuario)
  })
}
async function receber(usuario:string,nome:NomeSync,linhas:Remoto[]){
  // Um lote é aplicado inteiro; conflito por data deixa os dados locais intactos.
  await banco.transaction('rw',banco.table(nome),async()=>{
    const t=banco.table(nome)
    for(const remoto of linhas){
      if(remoto.user_id!==usuario||remoto.dados.id!==remoto.id||remoto.dados.user_id!==usuario||!Number.isFinite(Date.parse(remoto.atualizado_em)))throw new Error('Resposta de sincronização inválida.')
      let local=await t.get(remoto.id)
      let r:LinhaBackup={...remoto.dados,criado_em:new Date(remoto.criado_em).toISOString(),atualizado_em:new Date(remoto.atualizado_em).toISOString(),apagado_em:remoto.apagado_em?new Date(remoto.apagado_em).toISOString():null}
      if(nome==='configuracoes'){
        local=await t.where('chave').equals('principal').first()
        r={...r,id:local?.id??crypto.randomUUID(),sync_automatico:local?.sync_automatico??false,ultimo_backup:local?.ultimo_backup,ultima_sincronizacao:local?.ultima_sincronizacao}
      }
      if(!local||Date.parse(r.atualizado_em)>=Date.parse(local.atualizado_em)){
        if(['medidas_corporais','atividade_diaria','agua_dia','consumo_diario_meta'].includes(nome)&&!r.apagado_em){
          const conflito=await t.where('data').equals(String(r.data)).filter(l=>!l.apagado_em&&l.id!==r.id).first()
          if(conflito)throw new Error(`Há dois registros diferentes em ${String(r.data)} (${nome}). Faça um backup e revise a data antes de sincronizar novamente.`)
        }
        await t.put(r)
      } else if(!local.user_id)await t.update(local.id,{user_id:usuario})
    }
  })
  // Recibo só quando o conteúdo local coincide com o remoto confirmado.
  for(const remoto of linhas){
    const t=banco.table(nome),local=nome==='configuracoes'?await t.where('chave').equals('principal').first():await t.get(remoto.id)
    if(local){const atual=serializar(nome,local,usuario),normalizado=serializar(nome,remoto.dados,usuario);if(assinatura(atual)===assinatura(normalizado))await recibos.put({chave:chaveFila(usuario,nome,remoto.id),assinatura:assinatura(atual)})}
  }
}
export async function executarSync(usuario:string,transporte:Transporte){
 return comExclusaoSync(async()=>{
  await prepararFilaInterna(usuario)
  for(const nome of nomesSync){
    if(tabelasPorData.includes(nome)&&await conferirDatas(usuario,nome,transporte))continue
    const fila=await pendencias.where('usuario').equals(usuario).filter(p=>p.tabela===nome).toArray()
    // Exclusões liberam a data antes da gravação do registro escolhido.
    fila.sort((a,b)=>Number(!!b.registro.apagado_em)-Number(!!a.registro.apagado_em))
    let colisao=false
    const lotes:typeof fila[]=[]
    for(const grupo of [fila.filter(p=>p.registro.apagado_em),fila.filter(p=>!p.registro.apagado_em)]){
      for(let i=0;i<grupo.length;i+=100)lotes.push(grupo.slice(i,i+100))
    }
    for(const lote of lotes){
      try{await transporte.enviar(nome,lote.map(p=>p.registro))}
      catch(e){
        // Outro aparelho pode criar a data depois da nossa conferência inicial.
        if(e instanceof ColisaoData&&tabelasPorData.includes(nome)&&await conferirDatas(usuario,nome,transporte)){colisao=true;break}
        throw e
      }
      // Mesmo se o processo fechar aqui, reenviar o lote é seguro (LWW no servidor).
      for(const p of lote){await recibos.put({chave:p.chave,assinatura:p.assinatura});await pendencias.delete(p.chave)}
    }
    if(colisao)continue
    let depois=''
    for(;;){
      const lote=await transporte.baixar(nome,depois)
      if(!lote.length)break
      await receber(usuario,nome,lote)
      depois=lote[lote.length-1].id
      if(lote.length<200)break
    }
  }
  await prepararFilaInterna(usuario)
  if((await listarConflitos(usuario)).length)throw new RevisaoPendente()
  const config=await banco.table('configuracoes').where('chave').equals('principal').first()
  if(config)await banco.table('configuracoes').update(config.id,{ultima_sincronizacao:new Date().toISOString()})
 })
}
