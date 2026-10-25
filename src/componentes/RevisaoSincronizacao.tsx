import { recolherDetalhesSuavemente } from '../utilitarios/enquadrarDetalhes'
import { useEffect, useRef, useState } from 'react'
import { CheckCircle2, Files, ArrowRight, Smartphone, Cloud, Check, RefreshCw, ChevronDown } from 'lucide-react'
import { useLiveQuery } from 'dexie-react-hooks'
import { listarConflitos } from '../sincronizacao/motor'
import { pausaRestauracao, type ConflitoData } from '../sincronizacao/armazenamento'
import { aplicarResolucao, confirmarRetomada, sincronizar, useConta } from '../sincronizacao/estado'
import { formatarDataMedida } from '../dados/medidas'
import { Painel } from './Painel'

const titulos:Record<string,string>={medidas_corporais:'Medidas corporais',atividade_diaria:'Atividade do dia',agua_dia:'Água do dia',consumo_diario_meta:'Metas do dia'}
const campos:Record<string,string>={peso:'Peso (kg)',busto:'Busto (cm)',cintura:'Cintura (cm)',abdomen:'Abdômen (cm)',quadril:'Quadril (cm)',biceps_d:'Bíceps direito (cm)',biceps_e:'Bíceps esquerdo (cm)',coxa_d:'Coxa direita (cm)',coxa_e:'Coxa esquerda (cm)',panturrilha_d:'Panturrilha direita (cm)',panturrilha_e:'Panturrilha esquerda (cm)',passos:'Passos',calorias_gastas:'Calorias registradas (kcal)',tipo_dia:'Tipo de dia',meta_passos_aplicada:'Meta de passos',meta_calorias_gastas_aplicada:'Meta de calorias (kcal)',ml:'Água (ml)',meta_kcal_aplicada:'Meta de consumo (kcal)',meta_proteina_aplicada:'Meta de proteína (g)'}
const principais:Record<string,string[]>={atividade_diaria:['passos','calorias_gastas'],medidas_corporais:['peso','busto','cintura','abdomen','quadril','biceps_d','biceps_e','coxa_d','coxa_e','panturrilha_d','panturrilha_e'],agua_dia:['ml'],consumo_diario_meta:['meta_kcal_aplicada','meta_proteina_aplicada']}
function formatarValor(valor:unknown){return valor===undefined?'—':typeof valor==='number'?valor.toLocaleString('pt-BR'):valor==='util'?'Dia útil':valor==='fds_feriado'?'Fim de semana/feriado':String(valor)}
function ComparacaoRegistro({conflito,escolha,bloqueado,escolher,aplicar}:{conflito:ConflitoData;escolha?:'local'|'remoto';bloqueado:boolean;escolher:(lado:'local'|'remoto')=>void;aplicar:()=>void}){
 const c=conflito
 const destaques=(principais[c.tabela]??[]).filter(campo=>c.local.dados[campo]!==undefined||c.remoto.dados[campo]!==undefined).slice(0,2)
 const detalhes=Object.entries(campos).filter(([campo])=>c.local.dados[campo]!==undefined||c.remoto.dados[campo]!==undefined)
 return <section className="registro-em-revisao">
  <header><span>{titulos[c.tabela]}</span><strong>{formatarDataMedida(c.data)}</strong></header>
  <div className="opcoes-registro-sync" role="group" aria-label={`Registro a manter em ${formatarDataMedida(c.data)}`}>
   {(['local','remoto'] as const).map(lado=>{
    const r=c[lado],selecionado=escolha===lado
    return <button type="button" className="opcao-registro-sync" key={lado} disabled={bloqueado} aria-pressed={selecionado} onClick={()=>escolher(lado)}>
     <span className="origem-registro-sync">{lado==='local'?<Smartphone size={16} aria-hidden="true"/>:<Cloud size={17} aria-hidden="true"/>}<span>{lado==='local'?'Aparelho':'Conta'}</span><span className="marca-escolha-sync" aria-hidden="true">{selecionado&&<Check size={12}/>}</span></span>
     {destaques.map(campo=><span className="valor-comparado-sync" key={campo}><strong>{formatarValor(r.dados[campo])}</strong><span>{campos[campo]}</span></span>)}
     <span className="data-versao-sync">Atualizado<time dateTime={r.atualizado_em}>{new Date(r.atualizado_em).toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'})}</time></span>
    </button>
   })}
  </div>
  <details className="detalhes-comparacao-sync"><summary onClick={recolherDetalhesSuavemente}>Ver todos os detalhes<ChevronDown size={16} aria-hidden="true"/></summary><div className="cabecalho-detalhes-sync"><span>Aparelho</span><span>Conta</span></div>{detalhes.map(([campo,rotulo])=><div className="linha-detalhes-sync" key={campo}><span>{rotulo}</span><strong>{formatarValor(c.local.dados[campo])}</strong><strong>{formatarValor(c.remoto.dados[campo])}</strong></div>)}</details>
  <button type="button" className="botao-principal largura-total confirmar-registro-sync" disabled={bloqueado||!escolha} onClick={aplicar}>{bloqueado?'Salvando escolha…':escolha?'Confirmar escolha':'Selecione um registro'}</button>
 </section>
}
export function RevisaoSincronizacao({pedido=0}:{pedido?:number}){
  const conta=useConta(),usuario=conta.usuario?.id
  const pausa=useLiveQuery(pausaRestauracao)
  const lista=useLiveQuery(()=>usuario?listarConflitos(usuario):Promise.resolve([]),[usuario])??[]
  const [retomar,definirRetomar]=useState(false),[revisar,definirRevisar]=useState(false)
  const [avisoConflito,definirAvisoConflito]=useState(false)
  const [escolhas,definirEscolhas]=useState<Record<string,{lado:'local'|'remoto';versao:string}>>({})
  const [ocupado,definirOcupado]=useState(false),[erro,definirErro]=useState('')
  const ultimoPedido=useRef(0)
  useEffect(()=>{
    if(pedido>ultimoPedido.current&&lista.length>0){ultimoPedido.current=pedido;definirErro('');definirRevisar(false);definirAvisoConflito(true)}
  },[pedido,lista.length])
  const executar=async(acao:()=>Promise<void>)=>{definirOcupado(true);definirErro('');try{await acao()}catch(e){definirErro(e instanceof Error?e.message:'Não foi possível aplicar a escolha.')}finally{definirOcupado(false)}}
  if(!usuario||!conta.vinculado)return null
  const bloqueado=ocupado||conta.ocupado
  return <>
    {pausa&&<div className="revisao-sync"><p role="status">Backup restaurado neste aparelho. A sincronização está pausada para preservar a restauração.</p><button className="botao-secundario" disabled={bloqueado} onClick={()=>{definirErro('');definirRetomar(true)}}>Revisar retomada da sincronização</button></div>}
    {avisoConflito&&!pausa&&lista.length>0&&<Painel centralizado titulo="Revisão necessária" fechar={()=>{if(!bloqueado)definirAvisoConflito(false)}}><div className="aviso-conflito-popup"><span className="icone-aviso-conflito"><Files size={28} aria-hidden="true"/></span><h3>{lista.length===1?'Um registro para revisar':`${lista.length} registros para revisar`}</h3><p>Há valores diferentes para a mesma data. Compare os registros e escolha qual manter.</p><button type="button" className="botao-principal largura-total" disabled={bloqueado} onClick={()=>{definirAvisoConflito(false);definirErro('');definirRevisar(true)}}><span>Revisar registros</span><ArrowRight size={18} aria-hidden="true"/></button><button type="button" className="link-conta" disabled={bloqueado} onClick={()=>definirAvisoConflito(false)}>Revisar depois</button><p className="andamento-aviso-conflito">As outras tabelas foram sincronizadas.</p></div></Painel>}
    {retomar&&pausa&&<Painel titulo="Retomar sincronização" fechar={()=>{if(!bloqueado)definirRetomar(false)}}><div className="formulario"><p>A restauração alterou apenas este aparelho. Os registros da conta continuam na nuvem.</p><p>Ao retomar, os dois conjuntos serão mesclados. Registros ausentes do backup podem voltar; para o mesmo registro vence a alteração mais recente. Datas duplicadas serão apresentadas para revisão.</p><p>Guarde um backup com fotos se quiser conservar uma cópia exata desta restauração.</p>{erro&&<p className="erro" role="alert">{erro}</p>}<button className="botao-principal largura-total" disabled={bloqueado} onClick={()=>void executar(async()=>{await confirmarRetomada();definirRetomar(false)})}>Confirmar e mesclar com a conta</button><button className="botao-secundario" disabled={bloqueado} onClick={()=>definirRetomar(false)}>Manter sincronização pausada</button></div></Painel>}
    {revisar&&!pausa&&<Painel centralizado titulo={lista.length?'Comparar registros':'Revisão dos registros'} fechar={()=>{if(!bloqueado)definirRevisar(false)}}><div className="formulario revisao-comparacao">{lista.length>0&&<div className="introducao-comparacao-sync"><p>Qual registro você quer manter?</p><button type="button" disabled={bloqueado} onClick={()=>void executar(async()=>{await sincronizar();definirEscolhas({})})}><RefreshCw size={14} aria-hidden="true"/>Atualizar</button></div>}{erro&&<p className="erro" role="alert">{erro}</p>}{!lista.length&&<><div className="conclusao-revisao" role="status"><span><CheckCircle2 size={28} aria-hidden="true"/></span><h3>Nenhum conflito pendente</h3><p>{bloqueado?'Finalizando a sincronização…':conta.erro?'Suas escolhas foram salvas. A sincronização ainda precisa ser concluída.':'Você terminou de revisar os registros.'}</p></div>{conta.erro&&<p className="erro" role="alert">{conta.erro}</p>}<button type="button" className="botao-principal largura-total" disabled={bloqueado} aria-busy={bloqueado} aria-label={bloqueado?'Aguarde, finalizando a sincronização':'Concluído'} onClick={()=>{definirRevisar(false);definirEscolhas({});definirErro('')}}>{bloqueado?<span className="aguarde-revisao">Aguarde<span className="pontos-espera" aria-hidden="true"><span>.</span><span>.</span><span>.</span></span></span>:'Concluído'}</button></>}{lista.map(c=><ComparacaoRegistro key={c.chave} conflito={c} escolha={escolhas[c.chave]?.versao===JSON.stringify(c)?escolhas[c.chave].lado:undefined} bloqueado={bloqueado} escolher={lado=>definirEscolhas({...escolhas,[c.chave]:{lado,versao:JSON.stringify(c)}})} aplicar={()=>void executar(async()=>{await aplicarResolucao(c.chave,escolhas[c.chave].lado,c)})}/>)}{lista.length>0&&<p className="nota-escolha-sync">O registro não escolhido fica guardado como removido no backup JSON.</p>}</div></Painel>}
  </>
}
