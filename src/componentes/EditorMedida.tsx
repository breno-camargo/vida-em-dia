import { useId, useState } from 'react'
import { CalendarDays, ChevronRight } from 'lucide-react'
import { Painel } from './Painel'
import { ValorMedida } from './ValorMedida'
import { SelecionarData } from './SelecionarData'
import type { MedidaCorporal } from '../dados/modelos'
import { camposMedidas, formatarValorMedida, paresMedidas, formatarDataMedida, complementarMedida, AlteracaoMedidas, validarMedida, type CampoMedida } from '../dados/medidas'
import { useConfirmacao } from '../hooks/useConfirmacao'
export function EditorMedida({ medida, fechar, aoConfirmar }: { medida: MedidaCorporal; fechar: () => void; aoConfirmar?: (medida: MedidaCorporal) => void | Promise<void> }) {
  const [dados, definir] = useState(medida)
  const [campo, definirCampo] = useState<CampoMedida>()
  const [dataAberta, definirDataAberta] = useState(false)
  const [ocupado, definirOcupado] = useState(false)
  const [erro, definirErro] = useState('')
  const formulario = useId()
  const { confirmar, dialogo } = useConfirmacao()
  const salvarMedida = async (m: MedidaCorporal) => {
    try { await complementarMedida(m); return true } catch (e) {
      if (!(e instanceof AlteracaoMedidas)) throw e
      if (!await confirmar(e.aviso, 'Confirmar alterações')) return false
      await complementarMedida(m, e.revisao); return true
    }
  }
  const campoFormulario = (chave: CampoMedida, rotulo?: string) => {
    const [, nome, unidade] = camposMedidas.find(c => c[0] === chave)!
    return <button type="button" key={chave} className={`campo-medida${dados[chave] === undefined ? ' medida-vazia' : ''}${chave === 'peso' ? ' campo-peso' : ''}`} aria-label={`${nome}, ${dados[chave] === undefined ? 'adicionar em ' + unidade : dados[chave] + ' ' + unidade}`} onClick={() => definirCampo(chave)}><span>{rotulo ?? nome}<small>{unidade}</small></span><strong>{dados[chave] === undefined ? 'Adicionar' : formatarValorMedida(chave, dados[chave])}</strong></button>
  }
  return <Painel titulo={aoConfirmar?'Medidas iniciais':'Registrar medidas'} fechar={fechar} acao={<button type="submit" form={formulario} className="botao-principal salvar-cabecalho" disabled={ocupado}>{ocupado ? 'Salvando…' : aoConfirmar ? 'Usar estas medidas' : 'Salvar'}</button>}><form id={formulario} className="formulario" onSubmit={async e => { e.preventDefault(); definirOcupado(true); try { validarMedida(dados); if (aoConfirmar) await aoConfirmar(dados); else if (!await salvarMedida(dados)) return; fechar() } catch (e) { definirErro(e instanceof Error ? e.message : 'Não foi possível salvar.') } finally { definirOcupado(false) } }}>{dialogo}<p className="nota-resumo">Preencha só o que você mediu. Peso em kg, com precisão de gramas; demais medidas em cm, com até duas casas decimais. Confirme os valores para continuar.</p><button type="button" className="data-medida" onClick={() => definirDataAberta(true)}><CalendarDays size={18} />Data<strong>{formatarDataMedida(dados.data)}</strong><ChevronRight size={16} /></button><div className="editor-medidas-grupos"><div className="campos-medidas">{camposMedidas.filter(([chave]) => ['peso', 'busto', 'cintura', 'abdomen', 'quadril'].includes(chave)).map(([chave]) => campoFormulario(chave))}</div>{paresMedidas.map(([nome, direito, esquerdo]) => <fieldset className="par-editor-medidas" key={nome}><legend>{nome}</legend><div className="campos-medidas">{campoFormulario(direito, 'Direito')}{campoFormulario(esquerdo, 'Esquerdo')}</div></fieldset>)}</div>{erro && <p className="erro" role="alert">{erro}</p>}</form>{campo && <ValorMedida campo={campo} valor={dados[campo]} fechar={() => definirCampo(undefined)} confirmar={valor => definir(d => ({ ...d, [campo]: valor }))} />}{dataAberta && <SelecionarData valor={dados.data} fechar={() => definirDataAberta(false)} confirmar={data => definir(d => ({ ...d, data }))} />}</Painel>
}
