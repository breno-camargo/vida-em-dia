import { formatarDuracaoCardio } from '../utilitarios/duracaoCardio'
import { tipoCardioDoExercicio } from '../dados/tiposCardio'
import { MiniaturaExercicio } from './MiniaturaExercicio'
import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { tabela } from '../dados/banco'
import type { CardioSessao, TreinoExercicio } from '../dados/modelos'
import { novoCardio } from '../dados/cardio'
import { EditorCardio } from './EditorCardio'
export function CardioNoTreino({ item, data, remover }: { item:TreinoExercicio; data:string; remover:()=>void }) {
 const [edicao,definirEdicao]=useState<CardioSessao>()
 const sessoes=useLiveQuery(()=>tabela('cardio_sessoes').where('treino_id').equals(item.treino_id).filter(c=>!c.apagado_em&&c.exercicio_id===item.exercicio_id).toArray(),[item.treino_id,item.exercicio_id])
 const tipo=tipoCardioDoExercicio(item.nome)
 return <section className="painel cardio-planejado"><div className="cabecalho-cardio-planejado"><MiniaturaExercicio id={item.exercicio_id} nome={item.nome} /><div><h2>{item.nome}</h2><p>{sessoes?.length ? `${formatarDuracaoCardio(sessoes.reduce((t,s)=>t+s.duracao_minutos,0))} registrados` : 'Cardio planejado · registre a duração ao terminar.'}</p></div></div><div className="acoes-medida"><button onClick={()=>definirEdicao(sessoes?.[0]??{...novoCardio(tipo,item.treino_id,data),exercicio_id:item.exercicio_id})}>{sessoes?.length?'Editar cardio':'Registrar cardio'}</button><button onClick={remover}>Retirar do dia</button></div>{edicao&&<EditorCardio sessao={edicao} fechar={()=>definirEdicao(undefined)}/>}</section>
}
