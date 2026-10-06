import { useMemo, useState } from 'react'
import { Painel } from './Painel'
import { Rolagem } from './Rolagem'

export function SelecionarResumo({ tipo, valor, confirmar, fechar }: { tipo: 'peso' | 'calorias'; valor: number; confirmar: (valor: number) => void; fechar: () => void }) {
  const peso = tipo === 'peso'
  const base = peso ? 1 : 100
  const [parte, definirParte] = useState(Math.floor(valor / base))
  const [resto, definirResto] = useState(peso ? Math.round((valor % 1) * 10) : Math.round(valor % 100))
  const partes = useMemo(() => Array.from({ length: peso ? 501 : 101 }, (_, i) => i), [peso])
  const restos = useMemo(() => Array.from({ length: peso ? 10 : 100 }, (_, i) => i), [peso])
  const escolhido = Math.min(peso ? 500 : 10000, peso ? Number((parte + resto / 10).toFixed(1)) : parte * 100 + resto)
  return <Painel titulo={peso ? 'Peso corporal' : 'Calorias do treino'} fechar={fechar}>
    <p className="subtitulo-seletor">{peso ? 'Escolha os quilos e os décimos · 7 equivale a 700 g' : 'Escolha as centenas e as calorias restantes'}</p>
    <div className="rodas-resumo"><Rolagem valores={partes} inicial={Math.floor(valor / base)} rotulo={peso ? 'QUILOS' : 'CENTENAS'} escolher={definirParte} /><Rolagem valores={restos} inicial={peso ? Math.round((valor % 1) * 10) : Math.round(valor % 100)} rotulo={peso ? 'DÉCIMOS (100 G)' : 'KCAL RESTANTES'} escolher={definirResto} /></div>
    <p className="valor-escolhido">{escolhido.toLocaleString('pt-BR')} {peso ? 'kg' : 'kcal'}</p>
    <button type="button" className="botao-principal largura-total" onClick={() => { confirmar(escolhido); fechar() }}>Confirmar valor</button>
  </Painel>
}
