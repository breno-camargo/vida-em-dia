import { useState } from 'react'
import { useConta } from '../sincronizacao/estado'
import { consultarLegado, importarLegado } from '../dados/legado'
import { useConfirmacao } from '../hooks/useConfirmacao'

export function ImportarLegado(){
 const conta=useConta(), {confirmar,dialogo}=useConfirmacao()
 const [semDono, incluir]=useState(false),[ocupado, ocupar]=useState(false),[mensagem, avisar]=useState('')
 if(!conta.usuario)return null
 return <div className="formulario">{dialogo}<h3>Registros da versão anterior</h3><p>O arquivo local antigo permanece intacto. Apenas registros desta conta serão oferecidos para importação.</p><label><input type="checkbox" checked={semDono} disabled={ocupado} onChange={e=>incluir(e.target.checked)}/>Também considero meus os registros sem proprietário. Eles podem ter sido criados por outra pessoa neste navegador.</label><button type="button" className="botao-secundario" disabled={ocupado} onClick={async()=>{ocupar(true);try{
  const usuario=conta.usuario!.id,dados=await consultarLegado(usuario,semDono)
  if(!dados){avisar('Nenhum banco antigo encontrado.');return}
  const total=Object.values(dados).reduce((s,r)=>s+r.length,0)
  if(!total){avisar('Nenhum registro elegível para esta seleção.');return}
  if(await confirmar(`Importar ${total} registros elegíveis para ${conta.usuario!.email}?${semDono?' Você está atribuindo também os registros sem proprietário a esta conta.':''} O banco antigo não será modificado.`,'Importar registros antigos')){await importarLegado(usuario,semDono,true);avisar('Registros importados nesta conta. O banco antigo foi preservado.')}
 }catch(e){avisar(e instanceof Error?e.message:'Não foi possível importar.')}finally{ocupar(false)}}}>Revisar importação antiga</button>{mensagem&&<p role="status">{mensagem}</p>}</div>
}
