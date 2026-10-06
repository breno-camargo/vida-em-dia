import { useMemo, useState } from 'react'
import { Painel } from './Painel'
import { Rolagem } from './Rolagem'
export function SelecionarValores({ reps, peso, titulo, permitirProximas = false, fechar, confirmar }: {
  reps: number; peso: number; titulo: string; permitirProximas?: boolean; fechar: () => void
  confirmar: (reps: number, peso: number, proximas: boolean) => Promise<void>
}) {
  const [repeticoes, definirReps] = useState(Math.max(1, reps))
  const [inteiro, definirInteiro] = useState(Math.floor(peso))
  const [fracao, definirFracao] = useState(Number((peso % 1).toFixed(3)))
  const [proximas, definirProximas] = useState(permitirProximas)
  const [ocupado, definirOcupado] = useState(false)
  const [erro, definirErro] = useState('')
  const listaReps = useMemo(() => Array.from({ length: Math.max(100, reps) }, (_, i) => i + 1), [reps])
  const listaKg = useMemo(() => Array.from({ length: Math.max(2000, Math.ceil(peso)) + 1 }, (_, i) => i), [peso])
  const fracoes = useMemo(() => [...new Set([0, 0.25, 0.5, 0.75, Number((peso % 1).toFixed(3))])].sort((a, b) => a - b), [peso])
  return <Painel titulo={titulo} fechar={fechar}><div className="seletor-valores">
    <p className="subtitulo-seletor">Deslize para escolher · confirme para salvar</p>
    <div className="rodas-valores"><Rolagem valores={listaReps} inicial={Math.max(1, reps)} rotulo="REPS" escolher={definirReps} /><Rolagem valores={listaKg} inicial={Math.floor(peso)} rotulo="KG" escolher={definirInteiro} /><Rolagem valores={fracoes} inicial={Number((peso % 1).toFixed(3))} rotulo="DECIMAIS" escolher={definirFracao} formatar={v => v.toLocaleString('pt-BR', { minimumFractionDigits: 2 }).replace(/^0,/, '')} /></div>
    <p className="valor-escolhido">{repeticoes} reps · {(inteiro + fracao).toLocaleString('pt-BR')} kg</p>
    {permitirProximas && <label className="aplicar-proximas"><input type="checkbox" checked={proximas} onChange={e => definirProximas(e.target.checked)} />Aplicar às próximas séries pendentes</label>}
    {erro && <p role="alert" className="erro">{erro}</p>}
    <button className="botao-principal largura-total" disabled={ocupado} onClick={async () => { definirOcupado(true); try { await confirmar(repeticoes, inteiro + fracao, proximas); fechar() } catch (error) { definirErro(error instanceof Error ? error.message : 'Não foi possível salvar os valores.') } finally { definirOcupado(false) } }}>Confirmar valores</button>
  </div></Painel>
}
