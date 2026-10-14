import Dexie, { type Table } from 'dexie'
import { banco } from '../dados/banco'
import type { LinhaBackup } from '../dados/backup'
import { importarBackup } from '../dados/backup'
import { nomesBibliotecaInicial } from '../dados/biblioteca'

export const nomesSync = ['exercicios','fichas','ficha_exercicios','treinos','treino_exercicios','series_treino','cardio_sessoes','medidas_corporais','atividade_diaria','feriados','refeicoes_dia','alimentos_favoritos','combos_refeicao','agua_dia','consumo_diario_meta','configuracoes'] as const
export type NomeSync = typeof nomesSync[number]
export interface Remoto { id:string; user_id:string; criado_em:string; atualizado_em:string; apagado_em:string|null; dados:LinhaBackup }
interface Pendente { chave:string; usuario:string; tabela:NomeSync; registro:Remoto; assinatura:string }
interface Controle { chave:string; valor:string }
export const filaBanco = new Dexie('vida-em-dia-sincronizacao')
filaBanco.version(1).stores({ pendencias:'chave, usuario, tabela', recibos:'chave', controle:'chave' })
const pendencias = filaBanco.table('pendencias') as Table<Pendente,string>
const recibos = filaBanco.table('recibos') as Table<{chave:string;assinatura:string},string>
const controle = filaBanco.table('controle') as Table<Controle,string>
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
  await importarBackup({app:'vida-em-dia',versao:1,schema:banco.verno,criado_em:new Date().toISOString(),fotos_incluidas:false,tabelas:dados},'substituir')
}
export async function vincular(usuario:string){
  const anterior=await vinculoLocal()
  if(anterior&&anterior!==usuario)throw new Error('Este aparelho está vinculado a outra conta. Entre com a mesma conta para proteger seus dados.')
  for(const nome of nomesSync){if(await banco.table(nome).filter(r=>r.user_id&&r.user_id!==usuario).count())throw new Error('Existem dados de outra conta neste aparelho. Não é possível mesclar automaticamente.')}
  await controle.put({chave:'usuario',valor:usuario})
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
  if(await vinculoLocal()!==usuario)throw new Error('Confirme a vinculação antes de sincronizar.')
  for(const nome of nomesSync){
    const linhas=await banco.table(nome).toArray() as LinhaBackup[]
    for(const r of linhas){
      if(r.user_id&&r.user_id!==usuario)throw new Error('Há dados de outra conta neste aparelho.')
      const registro=serializar(nome,r,usuario),chave=chaveFila(usuario,nome,registro.id),resumo=assinatura(registro)
      if((await recibos.get(chave))?.assinatura!==resumo)await pendencias.put({chave,usuario,tabela:nome,registro,assinatura:resumo})
      else await pendencias.delete(chave)
    }
  }
}
export async function contarPendencias(usuario:string){return pendencias.where('usuario').equals(usuario).count()}
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
  await prepararFila(usuario)
  for(const nome of nomesSync){
    const fila=await pendencias.where('usuario').equals(usuario).filter(p=>p.tabela===nome).toArray()
    for(let i=0;i<fila.length;i+=100){
      const lote=fila.slice(i,i+100)
      await transporte.enviar(nome,lote.map(p=>p.registro))
      // Mesmo se o processo fechar aqui, reenviar o lote é seguro (LWW no servidor).
      for(const p of lote){await recibos.put({chave:p.chave,assinatura:p.assinatura});await pendencias.delete(p.chave)}
    }
    let depois=''
    for(;;){
      const lote=await transporte.baixar(nome,depois)
      if(!lote.length)break
      await receber(usuario,nome,lote)
      depois=lote[lote.length-1].id
      if(lote.length<200)break
    }
  }
  await prepararFila(usuario)
  const config=await banco.table('configuracoes').where('chave').equals('principal').first()
  if(config)await banco.table('configuracoes').update(config.id,{ultima_sincronizacao:new Date().toISOString()})
}
