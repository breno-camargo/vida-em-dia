import { CompartilharCardio } from '../componentes/CompartilharCardio'
import { formatarDistanciaCardio } from '../utilitarios/distanciaCardio'
import { formatarDuracaoCardio } from '../utilitarios/duracaoCardio'
import { useEstadoTemporario } from '../hooks/useEstadoTemporario'
import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Plus, Pencil, Trash2, ChevronDown, Share2 } from 'lucide-react'
import { tabela } from '../dados/banco'
import { repositorio } from '../dados/repositorio'
import type { CardioSessao } from '../dados/modelos'
import { caloriasCardio, novoCardio, tiposCardio, ritmoCardio, velocidadeCardio, recordesCardio } from '../dados/cardio'
import { dataMedida, formatarDataMedida } from '../dados/medidas'
import { inicioSemana } from '../dados/atividade'
import { EditorCardio } from '../componentes/EditorCardio'
import { EscolherOpcao } from '../componentes/EscolherOpcao'
export function Cardio() {
  const dados=useLiveQuery(async()=>({ sessoes:await tabela('cardio_sessoes').filter(s=>!s.apagado_em).sortBy('data'), config:await tabela('configuracoes').where('chave').equals('principal').first(), treinos:await tabela('treinos').filter(t=>!t.apagado_em).toArray() }))
  const [edicao,definirEdicao]=useState<CardioSessao>()
  const [compartilhar, definirCompartilhar] = useState<CardioSessao>()
  const [filtro,definirFiltro]=useState(0)
  const [escolher,definirEscolher]=useState(false)
  const [removido,definirRemovido]=useEstadoTemporario<CardioSessao | undefined>(undefined)
  const [erro,definirErro]=useState('')
  const [ocupado,definirOcupado]=useState(false)
  if(!dados)return <p role="status">Carregando cardio…</p>
  const inicio=inicioSemana(dataMedida()), semana=dados.sessoes.filter(s=>s.data>=inicio && s.data<=dataMedida())
  const fator=dados.config?.fator_calorias_cardio??100
  const minutos=semana.reduce((t,s)=>t+s.duracao_minutos,0)
  const executar=async(acao:()=>Promise<void>)=>{definirOcupado(true);try{await acao();definirErro('')}catch(e){definirErro(e instanceof Error?e.message:'Não foi possível salvar.')}finally{definirOcupado(false)}}
  return <div className="tela-cardio"><div className="acoes-cardio acao-cardio-unica"><button type="button" className="botao-principal" onClick={()=>definirEdicao(novoCardio())}><Plus size={18} aria-hidden="true"/>Registrar cardio</button></div><section className="painel resumo-semanal-cardio"><h2>Esta semana</h2><div className="metricas-resumo"><div><span>Duração</span><strong>{formatarDuracaoCardio(minutos)}</strong></div><div><span>Distância</span><strong>{formatarDistanciaCardio(semana.reduce((t,s)=>t+(s.distancia_km??0),0))}</strong></div><div><span>Calorias ajustadas</span><strong>{semana.reduce((t,s)=>t+(caloriasCardio(s,fator)??0),0).toLocaleString('pt-BR')}<small> kcal</small></strong></div><div><span>Sessões</span><strong>{semana.length}</strong></div></div>{semana.some(s=>caloriasCardio(s,fator)===undefined)&&<p className="nota-resumo">Total parcial: há sessões sem calorias disponíveis.</p>}{!!dados.config?.meta_cardio_min_semana&&<><p className="nota-resumo">Meta semanal: {dados.config.meta_cardio_min_semana} min</p><progress max={dados.config.meta_cardio_min_semana} value={minutos}/></>}</section><button className="data-medida" onClick={()=>definirEscolher(true)}>Filtrar tipo<strong>{filtro?tiposCardio[filtro-1][1]:'Todos'}</strong></button>{erro&&<p className="erro" role="alert">{erro}</p>}{removido&&<div className="aviso-remocao"><span>Cardio removido</span><button disabled={ocupado} onClick={()=>void executar(async()=>{await repositorio('cardio_sessoes').salvar(removido);definirRemovido(undefined)})}>Desfazer</button></div>}{![...dados.sessoes].filter(s=>!filtro||s.tipo===tiposCardio[filtro-1][0]).length&&<section className="painel"><h2>Seu próximo movimento</h2><p>Registre uma sessão para acompanhar seu cardio.</p></section>}{[...dados.sessoes].reverse().filter(s=>!filtro||s.tipo===tiposCardio[filtro-1][0]).map(s=>{const recordes=recordesCardio(s,dados.sessoes);return <details className="registro-medida" key={s.id}><summary><span>{tiposCardio.find(([t])=>t===s.tipo)?.[1]}<small>{formatarDataMedida(s.data)} · {formatarDuracaoCardio(s.duracao_minutos)}{recordes.length?' · Novo recorde':''}</small></span><ChevronDown size={18}/></summary><div className="detalhe-cardio"><p>Distância: {s.distancia_km===undefined ? '—' : formatarDistanciaCardio(s.distancia_km)}</p><p>Velocidade: {velocidadeCardio(s)?.toLocaleString('pt-BR',{maximumFractionDigits:1})??'—'} km/h · Ritmo: {ritmoCardio(s)??'—'}</p><p>Calorias: {s.calorias_informadas??s.calorias_estimadas??'—'} kcal ({s.calorias_informadas!==undefined?'informadas':'estimadas'})</p><p>Nas somas: {caloriasCardio(s,fator)??'—'} kcal · ajuste {fator}%</p>{s.inclinacao_pct!==undefined&&<p>Inclinação: {s.inclinacao_pct}%</p>}{s.passos!==undefined&&<p>Passos da sessão: {s.passos.toLocaleString('pt-BR')}</p>}{s.fc_media!==undefined&&<p>Frequência média: {s.fc_media} bpm</p>}{s.fc_max!==undefined&&<p>Frequência máxima: {s.fc_max} bpm</p>}{s.treino_id&&<p>Treino: {dados.treinos.find(t=>t.id===s.treino_id)?.titulo??'Vínculo indisponível'}</p>}{s.observacao&&<p>{s.observacao}</p>}{recordes.length>0&&<p className="verde">{recordes.join(' · ')}</p>}</div><button className="botao-secundario largura-total" onClick={()=>definirCompartilhar(s)}><Share2 size={16}/>Compartilhar adesivo</button><div className="acoes-medida"><button onClick={()=>definirEdicao(s)}><Pencil size={16}/>Editar</button><button disabled={ocupado} onClick={()=>void executar(async()=>{await repositorio('cardio_sessoes').apagar(s.id);definirRemovido(s)})}><Trash2 size={16}/>Remover</button></div></details>})}{compartilhar&&<CompartilharCardio sessao={compartilhar} fechar={()=>definirCompartilhar(undefined)}/ >}{edicao&&<EditorCardio sessao={edicao} fechar={()=>definirEdicao(undefined)}/ >}{escolher&&<EscolherOpcao titulo="Tipo de cardio" opcoes={['Todos',...tiposCardio.map(([,n])=>n)]} inicial={filtro} fechar={()=>definirEscolher(false)} confirmar={definirFiltro}/>}</div>
}
