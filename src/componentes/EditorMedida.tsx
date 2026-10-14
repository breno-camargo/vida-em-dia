import { useId, useMemo, useState } from 'react'
import { CalendarDays, ChevronRight } from 'lucide-react'
import { Painel } from './Painel'
import { Rolagem } from './Rolagem'
import { SelecionarData } from './SelecionarData'
import type { MedidaCorporal } from '../dados/modelos'
import { camposMedidas, formatarDataMedida, salvarMedida, type CampoMedida } from '../dados/medidas'
function ValorMedida({ campo, valor, fechar, confirmar }: { campo: CampoMedida; valor?: number; fechar: () => void; confirmar: (valor?: number) => void }) {
  const info = camposMedidas.find(c => c[0] === campo)!
  const inicial = valor ?? (campo === 'peso' ? 70 : campo === 'busto' || campo === 'cintura' || campo === 'abdomen' || campo === 'quadril' ? 80 : 35)
  const [inteiro, definirInteiro] = useState(Math.floor(inicial))
  const [decimal, definirDecimal] = useState(Math.round(inicial % 1 * 10))
  const inteiros = useMemo(() => Array.from({ length: campo === 'peso' ? 401 : 301 }, (_, i) => i), [campo])
  const decimais = useMemo(() => Array.from({ length: 10 }, (_, i) => i), [])
  return <Painel titulo={info[1]} fechar={fechar}><div className="rodas-medida"><Rolagem valores={inteiros} inicial={Math.floor(inicial)} rotulo={info[2].toUpperCase()} escolher={definirInteiro} /><Rolagem valores={decimais} inicial={Math.round(inicial % 1 * 10)} rotulo="DECIMAL" escolher={definirDecimal} formatar={v => `,${v}`} /></div><p className="valor-escolhido">{(inteiro + decimal / 10).toLocaleString('pt-BR')} {info[2]}</p><button className="botao-principal largura-total" disabled={inteiro + decimal / 10 <= 0 || inteiro + decimal / 10 > (campo === 'peso' ? 400 : 300)} onClick={() => { confirmar(Math.round((inteiro + decimal / 10) * 10) / 10); fechar() }}>Confirmar valor</button>{valor !== undefined && <button className="botao-secundario" onClick={() => { confirmar(undefined); fechar() }}>Deixar sem informar</button>}</Painel>
}
export function EditorMedida({ medida, fechar }: { medida: MedidaCorporal; fechar: () => void }) {
  const [dados, definir] = useState(medida)
  const [campo, definirCampo] = useState<CampoMedida>()
  const [dataAberta, definirDataAberta] = useState(false)
  const [ocupado, definirOcupado] = useState(false)
  const [erro, definirErro] = useState('')
  const formulario = useId()
  return <Painel titulo="Registrar medidas" fechar={fechar} acao={<button type="submit" form={formulario} className="botao-principal salvar-cabecalho" disabled={ocupado}>{ocupado ? 'Salvando…' : 'Salvar'}</button>}><form id={formulario} className="formulario" onSubmit={async e => { e.preventDefault(); definirOcupado(true); try { await salvarMedida(dados); fechar() } catch (e) { definirErro(e instanceof Error ? e.message : 'Não foi possível salvar.') } finally { definirOcupado(false) } }}><p className="nota-resumo">Preencha só o que você mediu. Peso em kg; demais medidas em cm. Os valores são salvos ao tocar em Salvar.</p><button type="button" className="data-medida" onClick={() => definirDataAberta(true)}><CalendarDays size={18} />Data<strong>{formatarDataMedida(dados.data)}</strong><ChevronRight size={16} /></button><div className="campos-medidas">{camposMedidas.map(([chave, nome, unidade]) => <button type="button" key={chave} className="campo-medida" onClick={() => definirCampo(chave)}><span>{nome}</span><strong>{dados[chave] === undefined ? 'Adicionar' : `${dados[chave].toLocaleString('pt-BR')} ${unidade}`}</strong></button>)}</div>{erro && <p className="erro" role="alert">{erro}</p>}</form>{campo && <ValorMedida campo={campo} valor={dados[campo]} fechar={() => definirCampo(undefined)} confirmar={valor => definir(d => ({ ...d, [campo]: valor }))} />}{dataAberta && <SelecionarData valor={dados.data} fechar={() => definirDataAberta(false)} confirmar={data => definir(d => ({ ...d, data }))} />}</Painel>
}
