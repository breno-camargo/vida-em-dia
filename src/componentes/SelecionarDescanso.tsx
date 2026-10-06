import { useMemo, useState } from 'react'
import { Painel } from './Painel'
import { Rolagem } from './Rolagem'
export function SelecionarDescanso({ valor, confirmar }: { valor: number; confirmar: (segundos: number) => Promise<void> }) {
  const [aberto, definirAberto] = useState(false)
  const [selecionado, definirSelecionado] = useState(valor)
  const [erro, definirErro] = useState('')
  const [ocupado, definirOcupado] = useState(false)
  const valores = useMemo(() => [...new Set([30, 45, 60, 90, 120, valor])].sort((a, b) => a - b), [valor])
  return <><button type="button" className="botao-descanso" onClick={() => { definirSelecionado(valor); definirAberto(true) }}>Descanso <strong>{valor} s</strong><span>Alterar</span></button>
    {aberto && <Painel titulo="Tempo de descanso" fechar={() => definirAberto(false)}><p className="subtitulo-seletor">Deslize para escolher os segundos</p><Rolagem valores={valores} inicial={valor} rotulo="SEGUNDOS" escolher={definirSelecionado} formatar={v => `${v} s`} />
      {erro && <p className="erro" role="alert">{erro}</p>}
      <button type="button" className="botao-principal largura-total" disabled={ocupado} onClick={async () => { definirOcupado(true); try { await confirmar(selecionado); definirAberto(false) } catch { definirErro('Não foi possível salvar o descanso.') } finally { definirOcupado(false) } }}>Confirmar · {selecionado} s</button>
    </Painel>}
  </>
}
