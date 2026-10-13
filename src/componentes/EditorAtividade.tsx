import { useEffect, useId, useState } from 'react'
import { tabela } from '../dados/banco'
import { Painel } from './Painel'
import { SelecionarNumero } from './SelecionarNumero'
import { SelecionarData } from './SelecionarData'
import { formatarDataMedida } from '../dados/medidas'
import { salvarAtividade } from '../dados/atividade'
import type { AtividadeDiaria } from '../dados/modelos'
export function EditorAtividade({ data, registro, modo, fechar, campoInicial }: { data:string; registro?:AtividadeDiaria; modo:'soma'|'total_manual'; fechar:()=>void; campoInicial?:'passos'|'kcal' }) {
  const [dia,definirDia]=useState(data),[passos,definirPassos]=useState(registro?.passos??0),[kcal,definirKcal]=useState(registro?.calorias_gastas??0)
  const [campo,definirCampo]=useState<'passos'|'kcal'| 'data'|undefined>()
  const [erro,definirErro]=useState(''),[ocupado,definirOcupado]=useState(false)
  useEffect(()=>{const quadro=requestAnimationFrame(()=>definirCampo(campoInicial));return()=>cancelAnimationFrame(quadro)},[campoInicial])
  const form=useId()
  return <Painel titulo="Atividade do dia" fechar={fechar} acao={<button className="botao-principal salvar-cabecalho" type="submit" form={form} disabled={ocupado}>Salvar</button>}><form className="formulario" id={form} onSubmit={async e=>{e.preventDefault();definirOcupado(true);try{await salvarAtividade(dia,passos,kcal);fechar()}catch(e){definirErro(e instanceof Error?e.message:'Não foi possível salvar.')}finally{definirOcupado(false)}}}><button type="button" className="data-medida" disabled={!!registro} onClick={()=>definirCampo('data')}>Data<strong>{formatarDataMedida(dia)}</strong></button><button type="button" className="data-medida" onClick={()=>definirCampo('passos')}>Passos<strong>{passos.toLocaleString('pt-BR')}</strong></button><button type="button" className="data-medida" onClick={()=>definirCampo('kcal')}>{modo==='total_manual'?'Calorias totais do relógio':'Calorias de atividade extra'}<strong>{kcal.toLocaleString('pt-BR')} kcal</strong></button><p className="nota-resumo">{modo==='total_manual'?'Informe o total do dia do relógio ou Saúde. Não somamos treino e cardio novamente.':'Informe somente atividade que ainda não está nos registros de treino e cardio, para não contar duas vezes.'} Os passos são o total diário, não a soma das sessões.</p>{erro&&<p className="erro" role="alert">{erro}</p>}</form>{campo==='data'&&<SelecionarData valor={dia} fechar={()=>definirCampo(undefined)} confirmar={data=>{definirDia(data);definirOcupado(true);void tabela('atividade_diaria').where('data').equals(data).filter(a=>!a.apagado_em).first().then(r=>{definirPassos(r?.passos??0);definirKcal(r?.calorias_gastas??0)}).catch(()=>definirErro('Não foi possível carregar esse dia.')).finally(()=>definirOcupado(false))}}/ >}{(campo==='passos'||campo==='kcal')&&<SelecionarNumero titulo={campo==='passos'?'Passos do dia':'Calorias do dia'} unidade={campo==='passos'?'passos':'kcal'} valor={campo==='passos'?passos:kcal} maximo={campo==='passos'?200000:20000} fechar={()=>definirCampo(undefined)} confirmar={v=>campo==='passos'?definirPassos(v??0):definirKcal(v??0)}/>}</Painel>
}



