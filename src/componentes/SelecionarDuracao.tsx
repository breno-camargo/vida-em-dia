import { useMemo, useState } from 'react'
import { Painel } from './Painel'
import { Rolagem } from './Rolagem'
import { lerDuracaoCardio, partesDuracao } from '../utilitarios/duracaoCardio'

export function SelecionarDuracao({ valor = 0, fechar, confirmar }: { valor?: number; fechar: () => void; confirmar: (valor: number) => void }) {
  const inicial = partesDuracao(valor)
  const [minutos, definirMinutos] = useState(String(inicial.minutos))
  const [segundos, definirSegundos] = useState(String(inicial.segundos))
  const [modo, definirModo] = useState<'rolar' | 'digitar'>('rolar')
  const [erro, definirErro] = useState('')
  const listaMinutos = useMemo(() => Array.from({ length: 1441 }, (_, i) => i), [])
  const listaSegundos = useMemo(() => Array.from({ length: 60 }, (_, i) => i), [])
  const validarRascunho = () => lerDuracaoCardio(minutos, segundos)
  const mudarModo = (novo: 'rolar' | 'digitar') => {
    if (novo === 'rolar' && modo === 'digitar') {
      if (!minutos.trim() || !segundos.trim()) {
        const partes = partesDuracao(valor)
        definirMinutos(String(partes.minutos)); definirSegundos(String(partes.segundos))
        definirErro(''); definirModo(novo); return
      }
      try { validarRascunho() } catch (e) { definirErro((e as Error).message); return }
    }
    definirErro(''); definirModo(novo)
  }
  const aplicar = () => { try { const valor = validarRascunho(); confirmar(valor); fechar() } catch (e) { definirErro((e as Error).message) } }
  const salto = (delta: number) => {
    try {
      // Zero inicial é permitido no rascunho, mas nunca como duração confirmada.
      const base = minutos === '0' && segundos === '0' ? 0 : validarRascunho()
      const partes = partesDuracao(Math.max(1 / 60, Math.min(1440, base + delta)))
      definirMinutos(String(partes.minutos)); definirSegundos(String(partes.segundos)); definirErro('')
    } catch (e) { definirErro((e as Error).message) }
  }
  return <Painel titulo="Duração" fechar={fechar}>
    <div className="cabecalho-seletor-numero"><div className="alternador-seletor" aria-label="Modo de seleção">{(['rolar', 'digitar'] as const).map(m => <button type="button" key={m} className={`opcao-seletor${modo === m ? ' selecionada' : ''}`} aria-pressed={modo === m} onClick={() => mudarModo(m)}>{m === 'rolar' ? 'Rolar' : 'Digitar'}</button>)}</div><div className="atalhos-numero"><button type="button" className="botao-atalho-numero" onClick={() => salto(-5)}>−5 min</button><button type="button" className="botao-atalho-numero" onClick={() => salto(5)}>+5 min</button></div></div>
    {modo === 'rolar' ? <div className="rodas-numero dupla-roda"><Rolagem valores={listaMinutos} inicial={Number(minutos)} valor={Number(minutos)} rotulo="MINUTOS" escolher={v => { definirMinutos(String(v)); definirErro('') }} /><Rolagem valores={listaSegundos} inicial={Number(segundos)} valor={Number(segundos)} rotulo="SEGUNDOS" escolher={v => { definirSegundos(String(v)); definirErro('') }} /></div> : <div className="digitar-duracao">{([['Minutos', minutos, definirMinutos], ['Segundos', segundos, definirSegundos]] as const).map(([nome, texto, definir], i) => <label key={nome}>{nome}<input autoFocus={i === 0} type="text" inputMode="numeric" value={texto} onChange={e => { definir(e.target.value); definirErro('') }} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); aplicar() } }} /></label>)}</div>}
    <p className="valor-escolhido">{minutos || '—'} min {segundos || '—'} s</p><p className="nota-resumo dica-duracao">Exemplo: 1 minuto e 33 segundos. Não use decimais.</p>
    {erro && <p className="erro" role="alert">{erro}</p>}<button type="button" className="botao-principal largura-total" onClick={aplicar}>Confirmar duração</button>
  </Painel>
}
