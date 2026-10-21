import { tiposCardio } from './tiposCardio'
import { eliminado } from './retencao'
import { validarDominioBackup, validarReferenciasBackup } from './validacaoBackup'
import { banco, tabela, tabelasDados, identidadeAtual, geracaoAtual } from './banco'
import { comExclusaoSync, controle, filaBanco, pendencias, recibos, conflitos } from '../sincronizacao/armazenamento'
export type LinhaBackup = Record<string, unknown> & { id:string; atualizado_em:string }
export interface Backup { app:'vida-em-dia'; versao:1; schema:number; criado_em:string; fotos_incluidas:boolean; tabelas:Record<string,LinhaBackup[]> }
export const blobParaJson = async (blob:Blob) => {
 const bytes=new Uint8Array(await blob.arrayBuffer());let texto='';for(let i=0;i<bytes.length;i+=8192)texto+=String.fromCharCode(...bytes.subarray(i,i+8192));return {tipo:'blob',mime:blob.type,base64:btoa(texto)}
}
export async function exportarBackup(fotos=true,incluirRemovidos=false):Promise<Backup>{
 const linhas:Record<string,LinhaBackup[]>={}
 const dono = identidadeAtual(), geracao = geracaoAtual()
 await banco.transaction('r',tabelasDados(),async()=>{for(const t of tabelasDados())linhas[t.name]=await t.filter(r=>r.user_id===dono&&(incluirRemovidos||r.apagado_em===null)).toArray()})
 if(!incluirRemovidos){
  // Não ressuscitar pais removidos nem exportar dependentes com vínculos inválidos.
  const refs:Record<string,[string,string][]>={ficha_exercicios:[['ficha_id','fichas'],['exercicio_id','exercicios']],treinos:[['ficha_id','fichas']],treino_exercicios:[['treino_id','treinos'],['exercicio_id','exercicios']],series_treino:[['treino_id','treinos'],['exercicio_id','exercicios']],cardio_sessoes:[['treino_id','treinos'],['exercicio_id','exercicios']],fotos:[['medida_id','medidas_corporais'],['exercicio_id','exercicios']],refeicoes_dia:[['foto_id','fotos'],['alimento_id','alimentos_favoritos']]}
  let mudou=true
  while(mudou){mudou=false;for(const[nome,vinculos]of Object.entries(refs)){const antes=linhas[nome];const ids=vinculos.map(([campo,pai])=>[campo,new Set(linhas[pai].map(r=>r.id))] as const);linhas[nome]=antes.filter(r=>ids.every(([campo,pais])=>r[campo]===undefined||pais.has(String(r[campo]))));if(antes.length!==linhas[nome].length)mudou=true}}
 }
 for(const foto of linhas.fotos??[]){for(const campo of ['imagem_local','miniatura_local']){const valor=foto[campo];if(valor instanceof Blob){if(fotos)foto[campo]=await blobParaJson(valor);else delete foto[campo]}}}
 if(geracao!==geracaoAtual())throw new Error('A identidade mudou. Exportação cancelada.')
 return {app:'vida-em-dia',versao:1,schema:banco.verno,criado_em:new Date().toISOString(),fotos_incluidas:fotos,tabelas:linhas}
}
export function validarBackup(valor:unknown):Backup{
 if(!valor||typeof valor!=='object')throw new Error('Arquivo de backup inválido.')
 const b=valor as Backup
 if(b.app!=='vida-em-dia'||b.versao!==1||!Number.isSafeInteger(b.schema)||b.schema<1||b.schema>banco.verno||!Number.isFinite(Date.parse(b.criado_em))||typeof b.fotos_incluidas!=='boolean'||!b.tabelas||typeof b.tabelas!=='object')throw new Error('Formato ou versão de backup incompatível.')
 const nomes=tabelasDados().map(t=>t.name)
 if(Object.keys(b.tabelas).some(n=>!nomes.includes(n))||nomes.some(n=>!Array.isArray(b.tabelas[n])))throw new Error('O backup não contém as tabelas esperadas.')
 for(const [nome,linhas]of Object.entries(b.tabelas)){
  const ids=new Set<string>()
  for(const r of linhas){
   if(eliminado(r)){
    if(nome==='configuracoes'||typeof r.id!=='string'||!r.id||ids.has(r.id)||!(r.user_id===null||typeof r.user_id==='string')||!Number.isFinite(Date.parse(r.eliminado_em))||!Number.isFinite(Date.parse(r.apagado_em))||Object.keys(r).some(k=>!['id','user_id','apagado_em','eliminado_em'].includes(k)))throw new Error('Tombstone inválido.')
    ids.add(r.id);continue
   }
   if(!r||typeof r!=='object'||typeof r.id!=='string'||!r.id||ids.has(r.id)||!Number.isFinite(Date.parse(r.atualizado_em))||!Number.isFinite(Date.parse(String(r.criado_em)))||(r.apagado_em!==null&&!Number.isFinite(Date.parse(String(r.apagado_em))))||!(r.user_id===null||typeof r.user_id==='string'))throw new Error(`Registro inválido em ${nome}.`);ids.add(r.id)
   if(Object.keys(r).some(k=>['__proto__','constructor','prototype'].includes(k)))throw new Error('Campo inválido no backup.')
   validarLinha(nome,r)
   if(nome==='fotos')for(const campo of ['imagem_local','miniatura_local']){const v=r[campo];if(v!==undefined){const f=v as {tipo:string;mime:string;base64:string};if(!f||f.tipo!=='blob'||typeof f.mime!=='string'||typeof f.base64!=='string'||!/^image\/(jpeg|png|webp|gif)$/.test(f.mime)||!/^([A-Za-z0-9+/]{4})*([A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(f.base64))throw new Error('Foto inválida no backup.')}}
  }
  if(['medidas_corporais','atividade_diaria','agua_dia','configuracoes'].includes(nome)){const chaves=new Set();for(const r of linhas.filter(r=>!r.apagado_em)){const chave=nome==='configuracoes'?r.chave:r.data;if(typeof chave!=='string'||chaves.has(chave))throw new Error(`Registros duplicados ou sem data em ${nome}.`);chaves.add(chave)}}
 }
 if(b.tabelas.configuracoes.filter(r=>r.chave==='principal'&&!r.apagado_em).length!==1)throw new Error('Configuração principal ausente ou duplicada.')
 validarReferenciasBackup(b.tabelas)
 return b
}
function validarLinha(nome:string,r:LinhaBackup){
 const obrigatorios:Record<string,string[]>={exercicios:['nome','tipo','grupo_muscular','equipamento','descanso_padrao_segundos','modo_carga','peso_barra','nota_fixa','como_fazer','musculos','origem'],fichas:['nome','ordem'],ficha_exercicios:['ficha_id','exercicio_id','ordem','series_planejadas'],treinos:['data','inicio','observacao'],treino_exercicios:['treino_id','exercicio_id','nome','ordem','descanso_segundos'],series_treino:['treino_id','exercicio_id','numero_serie','tipo','peso_digitado','peso_total','repeticoes','recorde'],cardio_sessoes:['data','tipo','duracao_minutos','observacao'],medidas_corporais:['data'],atividade_diaria:['data','passos','calorias_gastas','tipo_dia','meta_passos_aplicada','meta_calorias_gastas_aplicada'],feriados:['data','nome'],refeicoes_dia:['data','refeicao','horario','descricao','kcal','precisao'],alimentos_favoritos:['nome','porcao','vezes_usado','kcal'],combos_refeicao:['nome','itens'],agua_dia:['data','ml'],consumo_diario_meta:['data','tipo_dia','meta_kcal_aplicada'],fotos:['tipo','data','angulo','tamanho_bytes'],configuracoes:['chave','tema','unidade','dias_lembrete_backup','dia_lembrete_medidas']}
 if(obrigatorios[nome]?.some(c=>r[c]===undefined))throw new Error(`Campos obrigatórios ausentes em ${nome}.`)
 if(nome==='configuracoes'&&['meta_passos_util','meta_passos_fds_feriado','meta_calorias_gastas_util','meta_calorias_gastas_fds_feriado','meta_kcal_util','meta_kcal_fds_feriado','meta_agua_ml','meta_treinos_semana','fator_calorias_cardio','modo_calorias_gastas','prompt_ia_modelo','sync_automatico'].some(c=>r[c]===undefined))throw new Error('Configurações incompletas no backup.')
 const numeros=['ordem','descanso_padrao_segundos','peso_barra','alvo_reps','series_planejadas','descanso_segundos','duracao_minutos','calorias','peso_corporal','numero_serie','peso_digitado','peso_total','repeticoes','rpe','distancia_km','velocidade_media_kmh','inclinacao_pct','passos','calorias_informadas','calorias_estimadas','fc_media','fc_max','peso','busto','cintura','abdomen','quadril','biceps_d','biceps_e','coxa_d','coxa_e','panturrilha_d','panturrilha_e','calorias_gastas','meta_passos_aplicada','meta_calorias_gastas_aplicada','kcal','proteina_g','carbo_g','gordura_g','vezes_usado','ml','meta_kcal_aplicada','meta_proteina_aplicada','tamanho_bytes','altura_cm','meta_peso','meta_passos_util','meta_passos_fds_feriado','meta_calorias_gastas_util','meta_calorias_gastas_fds_feriado','meta_kcal_util','meta_kcal_fds_feriado','meta_proteina','meta_agua_ml','meta_treinos_semana','meta_cardio_min_semana','fator_calorias_cardio','dia_lembrete_medidas','dias_lembrete_backup']
 for(const campo of numeros)if(r[campo]!==undefined&&(typeof r[campo]!=='number'||!Number.isFinite(r[campo])))throw new Error(`Valor numérico inválido em ${nome}.`)
 for(const campo of ['nome','grupo_muscular','equipamento','nota_fixa','como_fazer','musculos','origem','observacao','ficha_id','treino_id','exercicio_id','refeicao','horario','descricao','porcao','tipo_dia','tema','unidade','chave'])if(r[campo]!==undefined&&typeof r[campo]!=='string')throw new Error(`Texto inválido em ${nome}.`)
 for(const campo of ['recorde','biblioteca_inicializada','sync_automatico','origem_ficha','retirado_da_ficha','metas_calorias_separadas'])if(r[campo]!==undefined&&typeof r[campo]!=='boolean')throw new Error(`Opção inválida em ${nome}.`)
 if(r.data!==undefined&&(typeof r.data!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(r.data)||new Date(`${r.data}T12:00:00`).toLocaleDateString('sv-SE')!==r.data))throw new Error(`Data inválida em ${nome}.`)
 if(r.reducoes!==undefined&&(!Array.isArray(r.reducoes)||r.reducoes.some(v=>!v||typeof v.peso_digitado!=='number'||typeof v.repeticoes!=='number')))throw new Error('Reduções inválidas no backup.')
 if(r.itens!==undefined&&!Array.isArray(r.itens))throw new Error('Itens inválidos no backup.')
 if(r.anos_feriados_inicializados!==undefined&&(!Array.isArray(r.anos_feriados_inicializados)||r.anos_feriados_inicializados.some(v=>!Number.isInteger(v))))throw new Error('Anos inválidos no backup.')
 if(nome==='configuracoes'&&(r.chave!=='principal'||!Number.isInteger(r.dias_lembrete_backup)||Number(r.dias_lembrete_backup)<1||Number(r.dia_lembrete_medidas)<0||Number(r.dia_lembrete_medidas)>6))throw new Error('Configuração inválida no backup.')
 const tipos:Record<string,string[]>={exercicios:['forca','cardio'],series_treino:['normal','aquecimento','falha','dropset'],cardio_sessoes:tiposCardio.map(([tipo])=>tipo),fotos:['maquina','refeicao','progresso'],treino_exercicios:['forca','cardio']}
 if(r.tipo!==undefined&&tipos[nome]&&!tipos[nome].includes(String(r.tipo)))throw new Error(`Tipo inválido em ${nome}.`)
 if(r.modo_carga!==undefined&&!['total','por_lado','peso_corporal'].includes(String(r.modo_carga)))throw new Error('Modo de carga inválido.')
 if(r.tipo_dia!==undefined&&!['util','fds_feriado'].includes(String(r.tipo_dia)))throw new Error('Tipo de dia inválido.')
 if(nome==='configuracoes'&&(!['escuro','claro'].includes(String(r.tema))||r.unidade!=='kg'||!['soma','total_manual'].includes(String(r.modo_calorias_gastas))))throw new Error('Configuração incompatível.')
 for(const c of ['inicio','fim','concluida_em','descanso_fim','ultimo_backup','ultima_sincronizacao'])if(r[c]!==undefined&&r[c]!==null&&!Number.isFinite(Date.parse(String(r[c]))))throw new Error(`Horário inválido em ${nome}.`)
 validarDominioBackup(nome,r)
}
function decodificar(b:Backup){const tabelas:Record<string,LinhaBackup[]>={};for(const[nome,linhas]of Object.entries(b.tabelas)){tabelas[nome]=linhas.map(r=>({...r}));if(nome==='fotos')for(const r of tabelas[nome])for(const campo of ['imagem_local','miniatura_local']){const f=r[campo] as {mime:string;base64:string}|undefined;if(f){const s=atob(f.base64),bytes=Uint8Array.from(s,c=>c.charCodeAt(0));r[campo]=new Blob([bytes],{type:f.mime})}}}return tabelas}
export async function importarBackup(arquivo:unknown,modo:'mesclar'|'substituir',verificarAntes?:()=>Promise<void>){
 const b=validarBackup(arquivo),dados=decodificar(b)
 const dono=identidadeAtual()
 for(const linhas of Object.values(dados))for(const r of linhas)r.user_id=dono
 if(modo!=='mesclar'&&modo!=='substituir')throw new Error('Escolha como importar.')
 return comExclusaoSync(async()=>{
 const usuario=(await controle.get('usuario'))?.valor
 if(verificarAntes&&usuario)throw new Error('O vínculo local mudou durante a conexão. Confirme a mesclagem novamente.')
 if(modo==='substituir'){
  // A pausa é durável ANTES de substituir a base. Se o app fechar, nenhum
  // envio pode consumir a fila anterior ou desfazer silenciosamente a restauração.
  await filaBanco.transaction('rw',controle,pendencias,recibos,conflitos,async()=>{
   if(usuario)await controle.put({chave:'restauracao',valor:b.criado_em})
   await pendencias.clear();await recibos.clear();await conflitos.clear()
  })
 }
 await banco.transaction('rw',tabelasDados(),async()=>{
  if(verificarAntes)await verificarAntes()
  if(modo==='substituir'){
   for(const t of tabelasDados()){
    const removidos=await t.filter(r=>r.user_id===dono&&r.apagado_em!==null).toArray()
    const preservados=new Map(removidos.map(r=>[r.id,r]))
    const restaurados=dados[t.name].map(r=>{const local=preservados.get(r.id);return local&&(eliminado(local)||(!eliminado(r)&&Date.parse(local.atualizado_em)>=Date.parse(r.atualizado_em)))?local:r})
    await t.clear();await t.bulkPut(restaurados)
    await t.bulkPut(removidos.filter(r=>!restaurados.some(s=>s.id===r.id)))
   }
   return
  }
  for(const t of tabelasDados()){for(const recebido of dados[t.name]){
   let r={...recebido},local=await t.get(r.id)
   if(eliminado(local))continue
   if(eliminado(r)){await t.put(r);continue}
   if(t.name==='configuracoes'){const principal=await t.where('chave').equals(String(r.chave)).first();if(principal){local=principal;r={...r,id:principal.id}}}
   if(['medidas_corporais','atividade_diaria','agua_dia'].includes(t.name)&&!r.apagado_em){const conflito=await t.where('data').equals(String(r.data)).filter(l=>!l.apagado_em&&l.id!==r.id).first();if(conflito)throw new Error(`Já existe outro registro em ${String(r.data)} (${t.name}). Mesclagem cancelada; revise os registros antes de importar.`)}
   if(!local||Date.parse(r.atualizado_em)>Date.parse(local.atualizado_em)){
    if(t.name==='fotos'&&local){for(const campo of ['imagem_local','miniatura_local'])if(!b.fotos_incluidas&&r[campo]===undefined)r[campo]=local[campo]}
    await t.put(r)
   } else if(t.name==='fotos'&&local&&!local.apagado_em&&b.fotos_incluidas&&r.atualizado_em===local.atualizado_em) {
    const enriquecida={...local};let mudou=false
    for(const campo of ['imagem_local','miniatura_local'])if(local[campo]===undefined&&r[campo]!==undefined){enriquecida[campo]=r[campo];mudou=true}
    if(mudou)await t.put(enriquecida)
   }
  }}
 })
 })
}
export function csvTabela(linhas:LinhaBackup[]){
 const campos=[...new Set(linhas.flatMap(r=>Object.keys(r)))].filter(c=>!['imagem_local','miniatura_local'].includes(c)).sort()
 const escapar=(v:unknown)=>{let s=v===null||v===undefined?'':typeof v==='object'?JSON.stringify(v):String(v);if(/^[=+\-@\t\r]/.test(s))s=`'${s}`;return `"${s.replace(/"/g,'""')}"`}
 return '\ufeff'+[campos.map(escapar).join(';'),...linhas.map(r=>campos.map(c=>escapar(r[c])).join(';'))].join('\r\n')
}
export function lembreteBackup(
  config: { ultimo_backup?: string | null; ultima_sincronizacao?: string | null; criado_em?: string; dias_lembrete_backup?: number },
  agora: number | Date | string = Date.now()
): boolean {
  if (!config || typeof config.dias_lembrete_backup !== 'number' || !Number.isFinite(config.dias_lembrete_backup) || config.dias_lembrete_backup <= 0) {
    return false
  }
  const tempoAgora = typeof agora === 'number' ? agora : (agora instanceof Date ? agora.getTime() : Date.parse(String(agora)))
  if (!Number.isFinite(tempoAgora)) return false

  let baseTime: number | null = null
  if (typeof config.ultimo_backup === 'string') {
    const parseBackup = Date.parse(config.ultimo_backup)
    if (Number.isFinite(parseBackup)) baseTime = parseBackup
  }
  if (baseTime === null && typeof config.criado_em === 'string') {
    const parseCriado = Date.parse(config.criado_em)
    if (Number.isFinite(parseCriado)) baseTime = parseCriado
  }
  if (baseTime === null) return false

  return (tempoAgora - baseTime) >= config.dias_lembrete_backup * 86400000
}
export async function marcarBackup(){const c=await tabela('configuracoes').where('chave').equals('principal').first();if(c)await tabela('configuracoes').update(c.id,{ultimo_backup:new Date().toISOString(),atualizado_em:new Date().toISOString()})}
