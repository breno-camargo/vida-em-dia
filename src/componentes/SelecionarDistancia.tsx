import { useMemo, useState } from 'react'
import { Painel } from './Painel'
import { Rolagem } from './Rolagem'
import { lerDistanciaCardio, partesDistancia } from '../utilitarios/distanciaCardio'

export function SelecionarDistancia({ valor = 0, fechar, confirmar }: { valor?: number; fechar: () => void; confirmar: (valor?: number) => void }) {
  const inicial = partesDistancia(valor)
  const [km, definirKm] = useState(String(inicial.km))
  const [metros, definirMetros] = useState(String(inicial.metros))
  const [modo, definirModo] = useState<'rolar' | 'digitar'>('rolar')
  const [erro, definirErro] = useState('')
  const listaKm = useMemo(() => Array.from({ length: 1001 }, (_, i) => i), [])
  const digitos = useMemo(() => Array.from({ length: 10 }, (_, i) => i), [])
  const validarRascunho = () => lerDistanciaCardio(km, metros)
  const mudarModo = (novo: 'rolar' | 'digitar') => {
    if (novo === 'rolar' && modo === 'digitar') {
      if (!km.trim() || !metros.trim()) {
        const partes = partesDistancia(valor)
        definirKm(String(partes.km)); definirMetros(String(partes.metros))
        definirErro(''); definirModo(novo); return
      }
      try { validarRascunho() } catch (e) { definirErro((e as Error).message); return }
    }
    definirErro(''); definirModo(novo)
  }
  const aplicar = () => { try { const valor = validarRascunho(); confirmar(valor); fechar() } catch (e) { definirErro((e as Error).message) } }
  const salto = (delta: number) => {
    try {
      // Distância zero continua sendo permitida; ausência é uma opção separada.
      const base = km === '0' && metros === '0' ? 0 : validarRascunho()
      const partes = partesDistancia(Math.max(0, Math.min(1000, base + delta)))
      definirKm(String(partes.km)); definirMetros(String(partes.metros)); definirErro('')
    } catch (e) { definirErro((e as Error).message) }
  }
  return <Painel titulo="Distância" fechar={() => { confirmar(undefined); fechar() }} acao={<button type="button" className="botao-principal salvar-cabecalho" onClick={aplicar}>Salvar</button>}>
    <div className="cabecalho-seletor-numero"><div className="alternador-seletor" aria-label="Modo de seleção">{(['rolar', 'digitar'] as const).map(m => <button type="button" key={m} className={`opcao-seletor${modo === m ? ' selecionada' : ''}`} aria-pressed={modo === m} onClick={() => mudarModo(m)}>{m === 'rolar' ? 'Rolar' : 'Digitar'}</button>)}</div><div className="atalhos-numero"><button type="button" className="botao-atalho-numero" onClick={() => salto(-1)}>−1 km</button><button type="button" className="botao-atalho-numero" onClick={() => salto(1)}>+1 km</button></div></div>
    {modo === 'rolar' ? <div className="rodas-numero casas-numero"><Rolagem valores={listaKm} inicial={Number(km)} valor={Number(km)} rotulo="KM" escolher={v => { definirKm(String(v)); definirErro('') }} />{([100, 10, 1] as const).map(casa => { const atual = Math.floor(Number(metros) / casa) % 10; return <Rolagem key={casa} valores={digitos} inicial={atual} valor={atual} rotulo={`${casa} M`} escolher={v => { definirMetros(String(Number(metros) + (v - atual) * casa)); definirErro('') }} /> })}</div> : <div className="digitar-duracao">{([['Quilômetros', km, definirKm], ['Metros', metros, definirMetros]] as const).map(([nome, texto, definir], i) => <label key={nome}>{nome}<input autoFocus={i === 0} type="text" inputMode="numeric" value={texto} onChange={e => { definir(e.target.value); definirErro('') }} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); aplicar() } }} /></label>)}</div>}
    <p className="valor-escolhido">{km || '—'} km {metros || '—'} m</p><p className="nota-resumo dica-duracao">Metros nas três últimas rodas: 5 · 0 · 0 = 500 m.</p>
    {erro && <p className="erro" role="alert">{erro}</p>}
  </Painel>
}
