import { useMemo, useState } from 'react'
import { Painel } from './Painel'
import { Rolagem } from './Rolagem'
import { camposMedidas, casasMedida, formatarValorMedida, lerValorMedida, type CampoMedida } from '../dados/medidas'

export function ValorMedida({ campo, valor, fechar, confirmar }: { campo: CampoMedida; valor?: number; fechar: () => void; confirmar: (valor?: number) => void }) {
  const [, nome, unidade] = camposMedidas.find(c => c[0] === campo)!
  const casas = casasMedida(campo), fator = 10 ** casas
  const inicial = valor ?? (campo === 'peso' ? 70 : ['busto','cintura','abdomen','quadril'].includes(campo) ? 80 : 35)
  const [total, definirTotal] = useState(Math.round(inicial * fator))
  const [texto, definirTexto] = useState(valor === undefined ? '' : formatarValorMedida(campo, valor))
  const [modo, definirModo] = useState<'rolar' | 'digitar'>('rolar')
  const [erro, definirErro] = useState('')
  const inteiros = useMemo(() => Array.from({ length: (campo === 'peso' ? 400 : 300) + 1 }, (_, i) => i), [campo])
  const digitos = useMemo(() => Array.from({ length: 10 }, (_, i) => i), [])
  const mudar = (novo: 'rolar' | 'digitar') => {
    if (novo === modo) return
    if (novo === 'rolar' && texto.trim()) {
      try { definirTotal(Math.round(lerValorMedida(campo, texto) * fator)) } catch (e) { definirErro((e as Error).message); return }
    }
    if (novo === 'digitar' && modo === 'rolar') definirTexto(formatarValorMedida(campo, total / fator))
    definirErro(''); definirModo(novo)
  }
  const atualizar = (novo: number) => { definirTotal(novo); definirTexto(formatarValorMedida(campo, novo / fator)); definirErro('') }
  const aplicar = () => {
    try { confirmar(lerValorMedida(campo, modo === 'digitar' ? texto : String(total / fator))); fechar() } catch (e) { definirErro((e as Error).message) }
  }
  return <Painel titulo={nome} fechar={fechar}>
    <div className="alternador-seletor" aria-label="Modo de seleção">{(['rolar','digitar'] as const).map(m => <button type="button" key={m} aria-pressed={modo === m} className={`opcao-seletor${modo === m ? ' selecionada' : ''}`} onClick={() => mudar(m)}>{m === 'rolar' ? 'Rolar' : 'Digitar'}</button>)}</div>
    {modo === 'rolar' ? <div className={`rodas-medida rodas-numero${campo === 'peso' ? ' casas-numero' : ' centesimos-medida'}`}><Rolagem valores={inteiros} inicial={Math.floor(total / fator)} valor={Math.floor(total / fator)} rotulo={unidade.toUpperCase()} escolher={v => atualizar(v * fator + total % fator)} />{(campo === 'peso' ? [100,10,1] : [10,1]).map(casa => {
      const atual = Math.floor(total % fator / casa) % 10
      return <Rolagem key={casa} valores={digitos} inicial={atual} valor={atual} rotulo={campo === 'peso' ? `${casa} G` : 'DÉCIMO DE CM'} escolher={v => atualizar(total + (v - atual) * casa)} formatar={String} />
    })}</div> : <div className="campo-digitar-numero"><label className="input-com-unidade"><span className="sr-only">{nome} em {unidade}</span><input autoFocus type="text" inputMode="decimal" value={texto} onChange={e => { definirTexto(e.target.value); definirErro('') }} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); aplicar() } }} /><span className="unidade-input">{unidade}</span></label></div>}
    <p className="valor-escolhido">{modo === 'digitar' ? texto || '—' : formatarValorMedida(campo, total / fator)} {unidade}</p>
    <p className="nota-resumo dica-duracao">{campo === 'peso' ? 'Quilogramas e gramas. Exemplo: 77,830 kg ou 77 kg + 830 g.' : 'Centímetros com até duas casas decimais. Exemplo: 83,75 cm.'}</p>
    {erro && <p className="erro" role="alert">{erro}</p>}<button type="button" className="botao-principal largura-total" onClick={aplicar}>Confirmar valor</button><button type="button" className="botao-secundario" onClick={() => { confirmar(undefined); fechar() }}>Deixar sem informar</button>
  </Painel>
}
