import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { identidadeAtual, tabelasDados } from '../dados/banco'
import { eliminarRegistro } from '../dados/eliminacao'
import { RETENCAO_REMOVIDOS_DIAS } from '../dados/retencao'
import { apagarLegado, pendenciasLimpeza } from '../dados/limpezaAparelho'
import { excluirMinhaConta, sairApagandoDados, useConta } from '../sincronizacao/estado'
import { Painel } from './Painel'
import { BackupConfiguracoes } from './BackupConfiguracoes'

export function PrivacidadeDados(){
 const conta=useConta()
 const removidos=useLiveQuery(async()=>{
  const itens:{tabela:string;id:string;nome:string}[]=[]
  for(const t of tabelasDados().filter(t=>t.name!=='configuracoes'))for(const r of await t.filter(r=>r.user_id===identidadeAtual()&&!!r.apagado_em&&!r.eliminado_em).toArray())itens.push({tabela:t.name,id:r.id,nome:String(r.nome??r.data??r.id)})
  return itens
 },[])
 const [acao,setAcao]=useState<'conta'|'aparelho'|'legado'|'registro'|'backup'>(),[item,setItem]=useState<{tabela:string;id:string;nome:string}>()
 const [confirmacao,setConfirmacao]=useState(''),[senha,setSenha]=useState(''),[pendentes,setPendentes]=useState(0),[aceitar,setAceitar]=useState(false)
 const [ocupado,setOcupado]=useState(false),[erro,setErro]=useState(''),[aviso,setAviso]=useState('')
 const executar=async(f:()=>Promise<void>)=>{setOcupado(true);setErro('');try{await f()}catch(e){setErro(e instanceof Error?e.message:'Não foi possível concluir.')}finally{setOcupado(false);setSenha('')}}
 const abrir=(valor:typeof acao)=>{setAcao(valor);setConfirmacao('');setAceitar(false);setErro('');setSenha('')}
 const fechar=()=>{if(!ocupado){setAcao(undefined);setSenha('');setConfirmacao('')}}
 return <section className="painel"><h2>Privacidade e eliminação</h2>
  <p>Remover permite Desfazer. Eliminar definitivamente apaga o conteúdo e as fotos associadas, sem Desfazer. Itens removidos são purgados após {RETENCAO_REMOVIDOS_DIAS} dias; no aparelho, isso acontece ao abrir seu espaço.</p>
  <details><summary>Revisar itens removidos ({removidos?.length??0})</summary>
   {!removidos?.length&&<p>Nenhum item removido aguardando eliminação.</p>}
   {removidos?.map(r=><div className="formulario" key={r.tabela+'/'+r.id}><p>{r.nome} · {r.tabela}</p><button className="botao-destrutivo" disabled={ocupado||conta.ocupado} onClick={()=>{setItem(r);abrir('registro')}}>Eliminar definitivamente</button></div>)}
  </details>
  <div className="formulario">
   <button className="botao-secundario" disabled={ocupado||conta.ocupado} onClick={()=>void executar(async()=>{setPendentes(await pendenciasLimpeza());abrir('aparelho')})}>Sair e apagar dados deste aparelho</button>
   <button className="botao-destrutivo" disabled={ocupado||conta.ocupado} onClick={()=>abrir('legado')}>Apagar banco legado deste navegador</button>
   {conta.usuario&&<button className="botao-destrutivo" disabled={ocupado||conta.ocupado} onClick={()=>abrir('conta')}>Excluir minha conta definitivamente</button>}
  </div>
  <p className="nota-resumo">Arquivos exportados, backups e logs do provedor e dados em outros aparelhos não são apagados por uma limpeza deste aparelho. Uma exclusão na conta chega aos outros aparelhos ao sincronizar. Não controla cópias externas.</p>
  {aviso&&<p role="status">{aviso}</p>}{erro&&!acao&&<p className="erro" role="alert">{erro}</p>}
  {acao==='backup'?<Painel titulo="Guardar backup antes de excluir" fechar={fechar}><BackupConfiguracoes/></Painel>:acao&&<Painel titulo={acao==='conta'?'Excluir conta':acao==='aparelho'?'Apagar dados deste aparelho':acao==='legado'?'Apagar legado':'Eliminar definitivamente'} fechar={fechar}>
   <div className="formulario">
    {acao==='registro'&&<p>Eliminar {item?.nome}? Fotos e registros dependentes também serão eliminados. Não há Desfazer. A exclusão remota e de objetos ficará pendente se estiver offline.</p>}
    {acao==='aparelho'&&<><p>Apaga somente o banco da identidade atual. A nuvem, o visitante separado, as outras contas e o legado permanecem. Você poderá perder dados ainda não enviados.</p><p>{pendentes} envios ou remoções de objetos na fila agora. A fila será conferida novamente ao confirmar.</p><label><input type="checkbox" checked={aceitar} onChange={e=>setAceitar(e.target.checked)}/> Aceito perder quaisquer envios ou remoções de objetos pendentes.</label></>}
    {acao==='legado'&&<p>Apaga exclusivamente o banco antigo vida-em-dia deste navegador. Pode conter dados de várias pessoas. Não apaga os bancos separados das contas nem a nuvem. Esta confirmação é independente e não há Desfazer.</p>}
    {acao==='conta'&&<><p>A exclusão é irreversível: apaga arquivos, registros remotos e o acesso à conta. Após confirmação do servidor, apaga o banco desta identidade no aparelho. Em falha parcial, o conteúdo remoto já apagado não volta, mas os dados locais ficam para você exportar e tentar novamente.</p><button className="botao-secundario" disabled={ocupado} onClick={()=>abrir('backup')}>Exportar backup criptografado antes</button><label>Senha atual da conta<input type="password" autoComplete="current-password" value={senha} disabled={ocupado} onChange={e=>setSenha(e.target.value)}/></label></>}
    <label>Digite {acao==='conta'?'EXCLUIR MINHA CONTA':acao==='legado'?'APAGAR LEGADO':acao==='aparelho'?'APAGAR APARELHO':'ELIMINAR'} para confirmar<input value={confirmacao} autoComplete="off" disabled={ocupado} onChange={e=>setConfirmacao(e.target.value)}/></label>
    {erro&&<p className="erro" role="alert">{erro}</p>}
    <button className="botao-destrutivo" disabled={ocupado||conta.ocupado||confirmacao!==(acao==='conta'?'EXCLUIR MINHA CONTA':acao==='legado'?'APAGAR LEGADO':acao==='aparelho'?'APAGAR APARELHO':'ELIMINAR')||(acao==='conta'&&!senha)} onClick={()=>void executar(async()=>{
     if(acao==='conta')await excluirMinhaConta(senha,confirmacao)
     if(acao==='aparelho')await sairApagandoDados(aceitar)
     if(acao==='legado')await apagarLegado(confirmacao)
     if(acao==='registro'&&item)await eliminarRegistro(item.tabela,item.id,true)
     setAcao(undefined);setAviso('Operação concluída neste aparelho. Exclusões da conta e de fotos podem aguardar sincronização.')
    })}>{ocupado?'Aguarde…':'Confirmar ação irreversível'}</button>
    <button className="botao-secundario" disabled={ocupado} onClick={fechar}>Cancelar</button>
   </div>
  </Painel>}
 </section>
}
