import Dexie from 'dexie'
import { banco, identidadeAtual, geracaoAtual, tabelasDados } from './banco'
import { blobParaJson, importarBackup, type LinhaBackup } from './backup'

export async function consultarLegado(usuario: string, incluirSemDono = false) {
 if (identidadeAtual() !== usuario) throw new Error('Entre na conta de destino antes de consultar o legado.')
 const geracao=geracaoAtual()
 if (!indexedDB.databases) throw new Error('Este navegador não permite detectar o legado sem criar banco.')
 if (!(await indexedDB.databases()).some(db=>db.name==='vida-em-dia')) return null
 // Sem version(). A opção impede criar um banco ausente entre detecção e abertura.
 const legado=new Dexie('vida-em-dia',{autoOpen:false,allowEmptyDB:false})
 try {
  await legado.open()
  const dados:Record<string,LinhaBackup[]>={}
  const nomes = new Set(legado.tables.map(t=>t.name))
  for (const tabela of tabelasDados()) {
   dados[tabela.name]=[]
   if (!nomes.has(tabela.name)) continue
   await legado.transaction('r',legado.table(tabela.name),async()=>{
    const origem=legado.table(tabela.name)
    // Proprietário filtrado na consulta: nunca listar/contar registros de outra conta.
    const proprios=await origem.where('user_id').equals(usuario).toArray() as LinhaBackup[]
    const semDono=incluirSemDono ? await origem.filter(r=>r.user_id===null||r.user_id===undefined).toArray() as LinhaBackup[] : []
    dados[tabela.name]=[...proprios,...semDono]
   })
  }
  // Não seguir referências para registros de outro proprietário, inclusive fotos.
  const referencias:Record<string,[string,string][]>={ficha_exercicios:[['ficha_id','fichas'],['exercicio_id','exercicios']],treinos:[['ficha_id','fichas']],treino_exercicios:[['treino_id','treinos'],['exercicio_id','exercicios']],series_treino:[['treino_id','treinos'],['exercicio_id','exercicios']],cardio_sessoes:[['treino_id','treinos'],['exercicio_id','exercicios']],fotos:[['medida_id','medidas_corporais'],['exercicio_id','exercicios']],refeicoes_dia:[['foto_id','fotos'],['alimento_id','alimentos_favoritos']]}
  let mudou=true
  while(mudou){mudou=false;for(const[nome,refs]of Object.entries(referencias)){
   const antes=dados[nome]??[]
   dados[nome]=antes.filter(r=>refs.every(([campo,pai])=>r[campo]===undefined||(dados[pai]??[]).some(p=>p.id===r[campo])))
   if(dados[nome].length!==antes.length)mudou=true
  }}
  if (geracao!==geracaoAtual() || identidadeAtual()!==usuario) throw new Error('A conta mudou. Consulta cancelada.')
  return dados
 } finally { legado.close() }
}

export async function importarLegado(usuario:string,incluirSemDono:boolean,confirmado:boolean) {
 if(!confirmado)throw new Error('Confirme a importação e a atribuição à conta atual.')
 const geracao=geracaoAtual(), dados=await consultarLegado(usuario,incluirSemDono)
 if(!dados)return
 const config=await banco.table('configuracoes').where('chave').equals('principal').first()
 const anterior=dados.configuracoes.find(r=>r.chave==='principal'&&!r.apagado_em)
 dados.configuracoes=[anterior?{...anterior,id:config.id,atualizado_em:new Date().toISOString()}:config]
 for(const foto of dados.fotos)for(const campo of ['imagem_local','miniatura_local'])if(foto[campo] instanceof Blob)foto[campo]=await blobParaJson(foto[campo])
 if(geracao!==geracaoAtual())throw new Error('A conta mudou. Importação cancelada.')
 await importarBackup({app:'vida-em-dia',versao:1,schema:banco.verno,criado_em:new Date().toISOString(),fotos_incluidas:true,tabelas:dados},'mesclar')
}
