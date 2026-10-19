import { useEffect, useId, useState } from 'react'

import { Painel } from './Painel'
import { SelecionarNumero } from './SelecionarNumero'
import { SelecionarData } from './SelecionarData'
import { formatarDataMedida } from '../dados/medidas'
import { salvarFormularioAtividade, type IntencaoAtividade } from '../dados/atividade'
import type { AtividadeDiaria } from '../dados/modelos'
export function EditorAtividade({ data, registro, modo, fechar, campoInicial, intencao = 'dia' }: { data:string; registro?:AtividadeDiaria; intencao?:IntencaoAtividade; modo:'soma'|'total_manual'; fechar:()=>void; campoInicial?:'passos'|'kcal' }) {
  const [original]=useState(intencao==='novo'?undefined:registro)
  const [dia,definirDia]=useState(data),[passos,definirPassos]=useState(original?.passos??0),[kcal,definirKcal]=useState(original?.calorias_gastas??0)
  const [campo,definirCampo]=useState<'passos'|'kcal'| 'data'|undefined>()
  const [erro,definirErro]=useState(''),[ocupado,definirOcupado]=useState(false)
  useEffect(()=>{const quadro=requestAnimationFrame(()=>definirCampo(campoInicial));return()=>cancelAnimationFrame(quadro)},[campoInicial])
  const [confirmarMudanca,definirConfirmarMudanca]=useState(false)
  const mudouData=!!original&&dia!==original.data
  const exigeConfirmacao=intencao==='editar'&&mudouData
  const form=useId()
  return <Painel titulo={intencao==='editar'?'Editar atividade':intencao==='novo'?'Registrar um dia':'Atividade do dia'} fechar={fechar} acao={<button className="botao-principal salvar-cabecalho" type="submit" form={form} disabled={ocupado||(exigeConfirmacao&&!confirmarMudanca)}>Salvar</button>}><form className="formulario" id={form} onSubmit={async e=>{e.preventDefault();definirOcupado(true);try{await salvarFormularioAtividade(dia,passos,kcal,intencao,original,confirmarMudanca);fechar()}catch(e){definirErro(e instanceof Error?e.message:'Não foi possível salvar.')}finally{definirOcupado(false)}}}><button type="button" className="data-medida" disabled={ocupado} onClick={()=>definirCampo('data')}>{intencao==='editar'?'Corrigir data':'Data'}<strong>{formatarDataMedida(dia)}</strong></button><button type="button" className="data-medida" onClick={()=>definirCampo('passos')}>Passos<strong>{passos.toLocaleString('pt-BR')}</strong></button><button type="button" className="data-medida" onClick={()=>definirCampo('kcal')}>{modo==='total_manual'?'Calorias totais do relógio':'Calorias de atividade extra'}<strong>{kcal.toLocaleString('pt-BR')} kcal</strong></button><p className="nota-resumo">{modo==='total_manual'?'Informe o total do dia do relógio ou Saúde. Não somamos treino e cardio novamente.':'Informe somente atividade que ainda não está nos registros de treino e cardio, para não contar duas vezes.'} Os passos são o total diário, não a soma das sessões.</p>{mudouData&&original&&<div className="aviso-data-atividade">{exigeConfirmacao?<><p>Ao salvar, este registro sairá de {formatarDataMedida(original.data)} e passará para {formatarDataMedida(dia)}.</p><label className="incluir-fotos"><input type="checkbox" checked={confirmarMudanca} onChange={e=>definirConfirmarMudanca(e.target.checked)}/>Quero corrigir a data deste registro.</label></>:<p>Será criado um registro em {formatarDataMedida(dia)}. O dia {formatarDataMedida(original.data)} será mantido.</p>}</div>}{erro&&<p className="erro" role="alert">{erro}</p>}</form>{campo==='data'&&<SelecionarData valor={dia} fechar={()=>definirCampo(undefined)} confirmar={data=>{definirDia(data);definirConfirmarMudanca(false);definirErro('')}}/ >}{(campo==='passos'||campo==='kcal')&&<SelecionarNumero titulo={campo==='passos'?'Passos do dia':'Calorias do dia'} unidade={campo==='passos'?'passos':'kcal'} valor={campo==='passos'?passos:kcal} maximo={campo==='passos'?200000:20000} fechar={()=>definirCampo(undefined)} confirmar={v=>campo==='passos'?definirPassos(v??0):definirKcal(v??0)}/>}</Painel>
}
