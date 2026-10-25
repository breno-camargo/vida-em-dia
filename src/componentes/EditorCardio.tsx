import { recolherDetalhesSuavemente } from '../utilitarios/enquadrarDetalhes'
import { camposDaModalidade } from '../dados/detalhesCardio'
import { SelecionarDistancia } from './SelecionarDistancia'
import { formatarDistanciaCardio } from '../utilitarios/distanciaCardio'
import { SelecionarDuracao } from './SelecionarDuracao'
import { formatarDuracaoCardio } from '../utilitarios/duracaoCardio'
import { useId, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { tabela } from '../dados/banco'
import type { CardioSessao } from '../dados/modelos'
import { salvarCardio, possuiEstimativaCardio, tiposCardio, velocidadeCardio, ritmoCardio } from '../dados/cardio'
import { formatarDataMedida } from '../dados/medidas'
import { Painel } from './Painel'
import { EscolherOpcao } from './EscolherOpcao'
import { SelecionarNumero } from './SelecionarNumero'
import { SelecionarData } from './SelecionarData'
const campos = [
  ['duracao_minutos', 'Duração', 'min', 1440, 5, 0.1],
  ['distancia_km', 'Distância', 'km', 1000, 1, 0],
  ['calorias_informadas', 'Calorias informadas', 'kcal', 20000, 100, 0],
  ['velocidade_media_kmh', 'Velocidade média', 'km/h', 150, 1, 0.1],
  ['inclinacao_pct', 'Inclinação', '%', 50, 1, 0],
  ['passos', 'Passos da sessão', 'passos', 200000, 1000, 0],
  ['fc_media', 'Frequência média', 'bpm', 250, 10, 1],
  ['cadencia_rpm', 'Cad\u00eancia m\u00e9dia', 'rpm', 300, 10, 0.1],
  ['potencia_watts', 'Pot\u00eancia m\u00e9dia', 'W', 3000, 25, 0.1],
  ['comprimentos_piscina', 'Comprimentos nadados', 'comprimentos', 10000, 10, 1],
  ['piscina_metros', 'Comprimento da piscina', 'm', 100, 5, 0.1],
  ['fc_max', 'Frequência máxima', 'bpm', 250, 10, 1]
] as const
type Campo = typeof campos[number][0]
export function EditorCardio({ sessao, fechar }: { sessao:CardioSessao; fechar:()=>void }) {
  const [dados, definir] = useState(sessao)
  const [campo, definirCampo] = useState<Campo>()
  const [escolha, definirEscolha] = useState<'tipo'|'treino'>()
  const [dataAberta, definirDataAberta] = useState(false)
  const [erro, definirErro] = useState('')
  const [ocupado, definirOcupado] = useState(false)
  const form = useId()
  const treinos = useLiveQuery(()=>tabela('treinos').where('data').equals(dados.data).filter(t=>!t.apagado_em).toArray(),[dados.data]) ?? []
  const permitidos = camposDaModalidade(dados.tipo)
  const info = campos.find(c=>c[0]===campo)
  const botaoCampo = (c:typeof campos[number]) => <button type="button" className="campo-medida" key={c[0]} onClick={()=>definirCampo(c[0])}><span>{c[1]}{c[0]==='duracao_minutos' ? ' *' : ''}</span><strong>{dados[c[0]]===undefined || (c[0]==='duracao_minutos' && !dados[c[0]]) ? 'Adicionar' : c[0]==='duracao_minutos' ? formatarDuracaoCardio(dados.duracao_minutos) : c[0]==='distancia_km' ? formatarDistanciaCardio(dados.distancia_km!) : `${dados[c[0]]!.toLocaleString('pt-BR')} ${c[2]}`}</strong></button>
  return <Painel titulo="Registrar cardio" fechar={fechar} acao={<button className="botao-principal salvar-cabecalho" form={form} type="submit" disabled={ocupado}>Salvar</button>}><form id={form} className="formulario formulario-cardio" onSubmit={async e=>{e.preventDefault();definirOcupado(true);try{await salvarCardio(dados);fechar()}catch(e){definirErro(e instanceof Error ? e.message : 'Não foi possível salvar.')}finally{definirOcupado(false)}}}><p className="nota-resumo">Escolha a modalidade e informe a duração. O restante é opcional.</p><button type="button" className="data-medida" onClick={()=>definirEscolha('tipo')}>Tipo<strong>{tiposCardio.find(([tipo])=>tipo===dados.tipo)?.[1]}</strong></button><button type="button" className="data-medida" onClick={()=>definirDataAberta(true)}>Data<strong>{formatarDataMedida(dados.data)}</strong></button><div className="campos-medidas basicos-cardio">{campos.slice(0,3).filter(c=>c[0]!=='distancia_km'||permitidos.includes(c[0])).map(botaoCampo)}</div><p className="nota-resumo">{possuiEstimativaCardio(dados.tipo) ? 'Sem calorias informadas, usamos uma estimativa geral pelo peso cadastrado.' : 'Esta modalidade ainda não tem estimativa automática. Sem calorias informadas, o valor fica ausente.'}</p><details className="opcionais-cardio"><summary onClick={recolherDetalhesSuavemente}>Mais detalhes (opcional)</summary>{permitidos.length > 0 && <fieldset className="grupo-campos-cardio"><legend>Detalhes da modalidade</legend><div className="campos-medidas">{campos.filter(c=>c[0]!=='distancia_km'&&permitidos.includes(c[0])).map(botaoCampo)}</div>{permitidos.includes('passos') && <p className="nota-resumo">Passos da sessão não são somados ao total diário.</p>}</fieldset>}<fieldset className="grupo-campos-cardio"><legend>Frequência cardíaca</legend><div className="campos-medidas">{campos.filter(c=>c[0]==='fc_media'||c[0]==='fc_max').map(botaoCampo)}</div></fieldset><button type="button" className="data-medida" onClick={()=>definirEscolha('treino')}>Vincular a treino<strong>{treinos.find(t=>t.id===dados.treino_id)?.titulo ?? 'Sem vínculo'}</strong></button><label>Observação<textarea value={dados.observacao} onChange={e=>definir(d=>({...d,observacao:e.target.value}))} placeholder="Opcional" /></label></details>{dados.distancia_km && dados.duracao_minutos>0 ? <p className="nota-resumo">Ritmo: {ritmoCardio(dados)} · Velocidade: {velocidadeCardio(dados)?.toLocaleString('pt-BR',{maximumFractionDigits:1})} km/h{dados.velocidade_media_kmh===undefined ? ' (calculada)' : ''}</p> : null}{erro && <p className="erro" role="alert">{erro}</p>}</form>{campo === 'duracao_minutos' && <SelecionarDuracao valor={dados.duracao_minutos} fechar={()=>definirCampo(undefined)} confirmar={v=>definir(d=>({...d,duracao_minutos:v}))} />}{campo === 'distancia_km' && <SelecionarDistancia valor={dados.distancia_km} fechar={()=>definirCampo(undefined)} confirmar={v=>definir(d=>({...d,distancia_km:v}))} />}{campo && campo !== 'duracao_minutos' && campo !== 'distancia_km' && info && <SelecionarNumero titulo={info[1]} unidade={info[2]} valor={dados[campo]} maximo={info[3]} passoRapido={info[4]} minimo={info[5]} permitirDigitar decimal={['distancia_km','velocidade_media_kmh','inclinacao_pct','cadencia_rpm','potencia_watts','piscina_metros'].includes(campo)} opcional fechar={()=>definirCampo(undefined)} confirmar={v=>definir(d=>({...d,[campo]:v??0,...(v===undefined ? {[campo]:undefined} : {})}))} />}{dataAberta && <SelecionarData valor={dados.data} fechar={()=>definirDataAberta(false)} confirmar={data=>definir(d=>({...d,data,treino_id:data===d.data ? d.treino_id : undefined}))} />}{escolha && <EscolherOpcao titulo={escolha==='tipo' ? 'Tipo de cardio' : 'Treino do dia'} opcoes={escolha==='tipo' ? tiposCardio.map(([,nome])=>nome) : ['Sem vínculo',...treinos.map(t=>t.titulo??'Treino')]} inicial={escolha==='tipo' ? tiposCardio.findIndex(([tipo])=>tipo===dados.tipo) : treinos.findIndex(t=>t.id===dados.treino_id)+1} fechar={()=>definirEscolha(undefined)} confirmar={i=>definir(d=>escolha==='tipo' ? {...d,tipo:tiposCardio[i][0]} : {...d,treino_id:i ? treinos[i-1].id : undefined})} />}</Painel>
}
