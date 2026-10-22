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
 return <section className="painel privacidade-dados"><h2>Privacidade e dados</h2>
  <p className="nota-resumo">Revise o que removeu ou gerencie os dados guardados neste navegador.</p>
  <details className="privacidade-grupo"><summary><span>Itens removidos<small>Revisar e eliminar definitivamente</small></span><span className="privacidade-contagem">{removidos?.length??0}</span></summary>
   <p className="nota-resumo">Remover permite Desfazer. Eliminar apaga o conteúdo e as fotos, sem volta. Após {RETENCAO_REMOVIDOS_DIAS} dias, o conteúdo dos removidos é eliminado automaticamente; neste aparelho, ao abrir seu espaço.</p>
   {!removidos?.length&&<p>Nenhum item removido aguardando eliminação.</p>}
   {removidos?.map(r=><div className="formulario" key={r.tabela+'/'+r.id}><p>{r.nome} · {r.tabela}</p><button className="botao-destrutivo" disabled={ocupado||conta.ocupado} onClick={()=>{setItem(r);abrir('registro')}}>Eliminar definitivamente</button></div>)}
  </details>
  <div className="privacidade-grupo formulario"><h3>Limpar este aparelho</h3><p className="nota-resumo">Apaga os dados do perfil atual neste navegador. Sua conta e os dados na nuvem permanecem.</p>
   <button className="botao-secundario" disabled={ocupado||conta.ocupado} onClick={()=>void executar(async()=>{setPendentes(await pendenciasLimpeza());abrir('aparelho')})}>Sair e apagar dados deste aparelho</button>
  </div>
  <details className="privacidade-grupo"><summary>Dados antigos deste navegador</summary><p className="nota-resumo">O armazenamento antigo (legado) fica separado dos perfis atuais. Apague apenas se não precisar mais desses registros.</p><button className="botao-destrutivo largura-total" disabled={ocupado||conta.ocupado} onClick={()=>abrir('legado')}>Apagar dados antigos</button></details>
  {conta.usuario&&<div className="privacidade-grupo formulario"><h3>Excluir conta</h3><p className="nota-resumo">Encerra seu acesso e elimina os registros e arquivos da conta. Esta ação é irreversível.</p><button className="botao-destrutivo" disabled={ocupado||conta.ocupado} onClick={()=>abrir('conta')}>Excluir minha conta definitivamente</button></div>}
  <details className="privacidade-grupo"><summary>O que não é apagado?</summary><p className="nota-resumo">Limpar este aparelho não apaga arquivos exportados, backups e logs do provedor nem dados em outros aparelhos. Exclusões na conta chegam aos outros aparelhos ao sincronizar, mas não apagam cópias externas.</p></details>
  {aviso&&<p role="status">{aviso}</p>}{erro&&!acao&&<p className="erro" role="alert">{erro}</p>}
  {acao==='backup'?<Painel titulo="Guardar backup antes de excluir" fechar={fechar}><BackupConfiguracoes/></Painel>:acao&&<Painel titulo={acao==='conta'?'Excluir conta':acao==='aparelho'?'Apagar dados deste aparelho':acao==='legado'?'Apagar legado':'Eliminar definitivamente'} fechar={fechar}>
   <div className="formulario confirmacao-privacidade">
    {acao==='registro'&&<p>Eliminar {item?.nome}? Fotos e registros dependentes também serão eliminados. Não há Desfazer. A exclusão remota e de objetos ficará pendente se estiver offline.</p>}
    {acao==='aparelho'&&<><p>Os dados deste perfil serão apagados deste navegador. Você sairá do app.</p><p className="nota-resumo">A conta na nuvem, os outros perfis e os dados antigos serão mantidos.</p><div className="privacidade-alerta"><strong>{pendentes?`${pendentes} itens pendentes`:'Nenhum envio pendente agora'}</strong><p>A fila será conferida novamente ao confirmar. Dados ainda não enviados poderão ser perdidos.</p></div><label className="opcao-copia-exercicio"><input type="checkbox" checked={aceitar} disabled={ocupado} onChange={e=>setAceitar(e.target.checked)}/><span>Aceito perder dados e remoções que ainda estejam na fila.</span></label></>}
    {acao==='legado'&&<><p>Apaga os dados antigos deste navegador, que podem pertencer a mais de uma pessoa.</p><div className="privacidade-alerta"><strong>Não é possível desfazer</strong><p>Os perfis atuais e a conta na nuvem serão mantidos.</p></div></>}
    {acao==='conta'&&<><p>A exclusão é irreversível: apaga arquivos, registros remotos e o acesso à conta. Após confirmação do servidor, apaga o banco desta identidade no aparelho. Em falha parcial, o conteúdo remoto já apagado não volta, mas os dados locais ficam para você exportar e tentar novamente.</p><button className="botao-secundario" disabled={ocupado} onClick={()=>abrir('backup')}>Exportar backup criptografado antes</button><label>Senha atual da conta<input type="password" autoComplete="current-password" value={senha} disabled={ocupado} onChange={e=>setSenha(e.target.value)}/></label></>}
    <label>Digite {acao==='conta'?'EXCLUIR MINHA CONTA':acao==='legado'?'APAGAR LEGADO':acao==='aparelho'?'APAGAR APARELHO':'ELIMINAR'} para confirmar<input value={confirmacao} autoComplete="off" disabled={ocupado} onChange={e=>setConfirmacao(e.target.value)}/></label>
    {erro&&<p className="erro" role="alert">{erro}</p>}
    <button className="botao-destrutivo" disabled={ocupado||conta.ocupado||confirmacao!==(acao==='conta'?'EXCLUIR MINHA CONTA':acao==='legado'?'APAGAR LEGADO':acao==='aparelho'?'APAGAR APARELHO':'ELIMINAR')||(acao==='conta'&&!senha)} onClick={()=>void executar(async()=>{
     if(acao==='conta')await excluirMinhaConta(senha,confirmacao)
     if(acao==='aparelho')await sairApagandoDados(aceitar)
     if(acao==='legado')await apagarLegado(confirmacao)
     if(acao==='registro'&&item)await eliminarRegistro(item.tabela,item.id,true)
     setAcao(undefined);setAviso('Operação concluída neste aparelho. Exclusões da conta e de fotos podem aguardar sincronização.')
    })}>{ocupado?'Aguarde…':acao==='aparelho'?'Apagar dados e sair':acao==='legado'?'Apagar dados antigos':acao==='conta'?'Excluir minha conta':'Eliminar definitivamente'}</button>
    <button className="botao-secundario" disabled={ocupado} onClick={fechar}>Cancelar</button>
   </div>
  </Painel>}
 </section>
}
