import { useMemo, useState } from 'react'
import { Painel } from './Painel'
import { Rolagem } from './Rolagem'
export function SelecionarNumero({ titulo, unidade, valor, maximo, fechar, confirmar, decimal = false, opcional = false }: { titulo:string; unidade:string; valor?:number; maximo:number; fechar:()=>void; confirmar:(v?:number)=>void|Promise<void>; decimal?:boolean; opcional?:boolean }) {
  const [ocupado, definirOcupado] = useState(false)
  const [erro, definirErro] = useState('')
  const aplicar = async (v?:number) => { definirOcupado(true); try { await confirmar(v); fechar() } catch(e) { definirErro(e instanceof Error ? e.message : 'Não foi possível salvar.') } finally { definirOcupado(false) } }
  const [inteiro, definirInteiro] = useState(Math.floor(valor ?? 0))
  const [fracao, definirFracao] = useState(Math.round(((valor ?? 0)%1)*10))
  const milhares = maximo > 2000
  const [mil, definirMil] = useState(Math.floor((valor ?? 0)/1000))
  const [centena, definirCentena] = useState(Math.floor((valor ?? 0)%1000/100))
  const [dezena, definirDezena] = useState(Math.floor((valor ?? 0)%100/10))
  const [unidadeNumero, definirUnidadeNumero] = useState(Math.floor((valor ?? 0)%10))
  const lista = useMemo(() => Array.from({length:(milhares ? 10 : maximo+1)},(_,i)=>i),[maximo,milhares])
  const listaMil = useMemo(() => Array.from({length:Math.floor(maximo/1000)+1},(_,i)=>i),[maximo])
  const decimais = useMemo(() => Array.from({length:10},(_,i)=>i),[])
  const numero = milhares ? mil*1000+centena*100+dezena*10+unidadeNumero : inteiro+(decimal ? fracao/10 : 0)
  return <Painel titulo={titulo} fechar={fechar}><p className="subtitulo-seletor">Deslize e confirme para aplicar.</p><div className={`rodas-numero${milhares ? ' casas-numero' : decimal ? ' dupla-roda' : ''}`}>{milhares ? <><Rolagem valores={listaMil} inicial={Math.floor((valor ?? 0)/1000)} rotulo="MILHARES" escolher={definirMil} /><Rolagem valores={lista} inicial={Math.floor((valor ?? 0)%1000/100)} rotulo="CENTENAS" escolher={definirCentena} /><Rolagem valores={lista} inicial={Math.floor((valor ?? 0)%100/10)} rotulo="DEZENAS" escolher={definirDezena} /><Rolagem valores={lista} inicial={Math.floor((valor ?? 0)%10)} rotulo="UNIDADES" escolher={definirUnidadeNumero} /></> : <><Rolagem valores={lista} inicial={Math.floor(valor ?? 0)} rotulo={unidade} escolher={definirInteiro} />{decimal && <Rolagem valores={decimais} inicial={Math.round(((valor ?? 0)%1)*10)} rotulo="DECIMAL" escolher={definirFracao} formatar={v=>`,${v}`} />}</>}</div><p className="valor-escolhido">{numero.toLocaleString('pt-BR')} {unidade}</p>{erro && <p className="erro" role="alert">{erro}</p>}<button className="botao-principal largura-total" disabled={ocupado||numero>maximo} onClick={()=>void aplicar(Math.round(numero*10)/10)}>Confirmar</button>{opcional && <button className="botao-secundario" disabled={ocupado} onClick={()=>void aplicar(undefined)}>Não informar</button>}</Painel>
}


