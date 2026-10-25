import { useMemo, useState } from 'react'
import { Painel } from './Painel'
import { Rolagem } from './Rolagem'
import { dataMedida, formatarDataMedida } from '../dados/medidas'
export function SelecionarData({ valor, fechar, confirmar, permitirFuturo = false }: { valor: string; permitirFuturo?: boolean; fechar: () => void; confirmar: (valor: string) => void }) {
  const [ano, definirAno] = useState(Number(valor.slice(0,4)))
  const [mes, definirMes] = useState(Number(valor.slice(5,7)))
  const [dia, definirDia] = useState(Number(valor.slice(8,10)))
  const [erro, definirErro] = useState('')
  const anos = useMemo(() => Array.from({ length: new Date().getFullYear() - 2000 + 1 + (permitirFuturo ? 5 : 0) }, (_, i) => 2000 + i), [permitirFuturo])
  const meses = useMemo(() => Array.from({ length: 12 }, (_, i) => i + 1), [])
  const dias = useMemo(() => Array.from({ length: 31 }, (_, i) => i + 1), [])
  const escolhida = `${ano}-${String(mes).padStart(2,'0')}-${String(dia).padStart(2,'0')}`
  return <Painel titulo="Data do registro" fechar={fechar}><p className="subtitulo-seletor">Escolha a data.</p><div className="rodas-data"><Rolagem valores={dias} inicial={dia} rotulo="DIA" escolher={definirDia} /><Rolagem valores={meses} inicial={mes} rotulo="MÊS" escolher={definirMes} /><Rolagem valores={anos} inicial={ano} rotulo="ANO" escolher={definirAno} /></div>{erro && <p className="erro" role="alert">{erro}</p>}<button className="botao-principal largura-total" onClick={() => { const data = new Date(`${escolhida}T12:00:00`); if (dataMedida(data) !== escolhida || (!permitirFuturo && escolhida > dataMedida())) { definirErro('Escolha uma data válida, até hoje.'); return } confirmar(escolhida); fechar() }}>Confirmar · {formatarDataMedida(escolhida)}</button></Painel>
}



