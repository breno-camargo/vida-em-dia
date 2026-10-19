import { formatarDuracaoCardio } from '../utilitarios/duracaoCardio'
import { useLiveQuery } from 'dexie-react-hooks'
import { tabela } from '../dados/banco'
import { caloriasCardio, tiposCardio } from '../dados/cardio'
export function ResumoCardioDia({ data }: { data:string }) {
  const dados = useLiveQuery(async()=>({ sessoes:await tabela('cardio_sessoes').where('data').equals(data).filter(s=>!s.apagado_em).toArray(), config:await tabela('configuracoes').where('chave').equals('principal').first() }),[data])
  if (!dados?.sessoes.length) return null
  return <section className="painel cardio-do-dia"><h2>Cardio do dia</h2>{dados.sessoes.map(s=><div key={s.id}><strong>{tiposCardio.find(([t])=>t===s.tipo)?.[1]}</strong><p>{formatarDuracaoCardio(s.duracao_minutos)}{s.distancia_km!==undefined ? ` · ${s.distancia_km.toLocaleString('pt-BR')} km` : ''} · {caloriasCardio(s,dados.config?.fator_calorias_cardio) ?? '—'} kcal{s.calorias_informadas===undefined ? ' estimadas' : ' informadas'}</p></div>)}</section>
}
