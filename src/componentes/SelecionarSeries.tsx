import { useState } from 'react'
import { Painel } from './Painel'
import { Rolagem } from './Rolagem'
const quantidades = Array.from({ length: 20 }, (_, i) => i + 1)
export function SelecionarSeries({ valor, confirmar }: { valor: number; confirmar: (valor: number) => void }) {
  const [aberto, definirAberto] = useState(false)
  const [quantidade, definirQuantidade] = useState(valor)
  return <><button type="button" className="botao-descanso" onClick={() => { definirQuantidade(valor); definirAberto(true) }}>Séries planejadas <strong>{valor}</strong><span>Alterar</span></button>
    {aberto && <Painel titulo="Quantidade de séries" fechar={() => definirAberto(false)}><p className="subtitulo-seletor">Deslize para escolher a quantidade</p><Rolagem valores={quantidades} inicial={valor} rotulo="SÉRIES" escolher={definirQuantidade} /><button type="button" className="botao-principal largura-total" onClick={() => { confirmar(quantidade); definirAberto(false) }}>Confirmar · {quantidade} séries</button></Painel>}
  </>
}
