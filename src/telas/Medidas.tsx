import { useEffect, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Plus, Pencil, Trash2, CalendarDays, ChevronDown } from 'lucide-react'
import { tabela } from '../dados/banco'
import { repositorio } from '../dados/repositorio'
import type { MedidaCorporal } from '../dados/modelos'
import { camposMedidas, diferencaMedida, formatarDataMedida, novaMedida, salvarMedida } from '../dados/medidas'
import { EditorMedida } from '../componentes/EditorMedida'
import { EscolherOpcao } from '../componentes/EscolherOpcao'
import { ResumoMedidas } from '../componentes/ResumoMedidas'
export default function Medidas({ registrarInicial = false }: { registrarInicial?: boolean }) {
  const registros = useLiveQuery(() => tabela('medidas_corporais').filter(m => !m.apagado_em).sortBy('data'))
  const [edicao, definirEdicao] = useState<MedidaCorporal>()
  const [aba, definirAba] = useState<'historico' | 'comparar'>('historico')
  const [antesId, definirAntes] = useState('')
  const [depoisId, definirDepois] = useState('')
  const [escolha, definirEscolha] = useState<'antes' | 'depois'>()
  const [removido, definirRemovido] = useState<MedidaCorporal>()
  const [erro, definirErro] = useState('')
  const [ocupado, definirOcupado] = useState(false)
  useEffect(() => { if (!registrarInicial) return; let ativo = true; void novaMedida().then(m => { if (ativo) definirEdicao(m) }).catch(() => { if (ativo) definirErro('Não foi possível abrir o registro.'); }); return () => { ativo = false } }, [registrarInicial])
  if (!registros) return <p role="status">Carregando medidas…</p>
  const antes = registros.find(m => m.id === antesId) ?? registros[0]
  const depois = registros.find(m => m.id === depoisId) ?? registros.at(-1)
  const executar = async (acao: () => Promise<void>) => { definirOcupado(true); definirErro(''); try { await acao() } catch (e) { definirErro(e instanceof Error ? e.message : 'Não foi possível salvar.') } finally { definirOcupado(false) } }
  return <div className="tela-medidas"><div className="topo-medidas"><p>Peso e medidas, no seu ritmo.</p><button disabled={ocupado} className="nova-medida" onClick={() => void executar(async () => { definirEdicao(await novaMedida()) })}><Plus size={18} />Registrar</button></div>{erro && <p className="erro" role="alert">{erro}</p>}{removido && <div className="aviso-remocao"><span>Registro removido</span><button disabled={ocupado} onClick={() => void executar(async () => { await salvarMedida({ ...removido, apagado_em: null }); definirRemovido(undefined) })}>Desfazer</button></div>}
    {!registros.length ? <section className="painel vazio-medidas"><CalendarDays size={28} /><h2>Seu primeiro registro</h2><p>Você pode informar apenas o peso ou as medidas que quiser acompanhar.</p><p>Os registros ficam salvos neste aparelho e funcionam offline.</p></section> : <><ResumoMedidas registros={registros} />
    <div className="abas-treino"><button aria-pressed={aba === 'historico'} onClick={() => definirAba('historico')}>Histórico</button><button aria-pressed={aba === 'comparar'} onClick={() => definirAba('comparar')}>Antes e depois</button></div>
    {aba === 'historico' ? <div className="historico-medidas">{[...registros].reverse().map(m => <details className="registro-medida" key={m.id}><summary><span>{formatarDataMedida(m.data)}<small>{m.peso !== undefined ? `${m.peso.toLocaleString('pt-BR')} kg` : `${camposMedidas.filter(([campo]) => m[campo] !== undefined).length} medidas registradas`}</small></span><ChevronDown size={18} /></summary><dl>{camposMedidas.filter(([campo]) => m[campo] !== undefined).map(([campo, nome, unidade]) => <div key={campo}><dt>{nome}</dt><dd>{m[campo]!.toLocaleString('pt-BR')} {unidade}</dd></div>)}</dl><div className="acoes-medida"><button onClick={() => definirEdicao(m)}><Pencil size={16} />Editar</button><button disabled={ocupado} onClick={() => void executar(async () => { await repositorio('medidas_corporais').apagar(m.id); definirRemovido(m) })}><Trash2 size={16} />Remover</button></div></details>)}</div> : registros.length < 2 ? <p className="nota-resumo">Registre duas datas diferentes para comparar.</p> : antes && depois && <section className="comparacao-medidas"><div className="dupla"><button className="escolher-comparacao" onClick={() => definirEscolha('antes')}><span>Antes</span><strong>{formatarDataMedida(antes.data)}</strong></button><button className="escolher-comparacao" onClick={() => definirEscolha('depois')}><span>Depois</span><strong>{formatarDataMedida(depois.data)}</strong></button></div>{antes.data >= depois.data ? <p className="nota-resumo">Escolha uma data de “Depois” posterior à data de “Antes”.</p> : <><p className="nota-resumo">A diferença descreve a mudança; não classifica o resultado como bom ou ruim.</p><div className="tabela-comparacao"><div className="cabecalho-comparacao"><span>Medida</span><span>Antes</span><span>Depois</span><span>Diferença</span></div>{camposMedidas.filter(([campo]) => antes[campo] !== undefined || depois[campo] !== undefined).map(([campo, nome, unidade]) => { const diferenca = diferencaMedida(antes, depois, campo); return <div key={campo}><span>{nome}<small>{unidade}</small></span><span>{antes[campo]?.toLocaleString('pt-BR') ?? '—'}</span><span>{depois[campo]?.toLocaleString('pt-BR') ?? '—'}</span><strong>{diferenca === null ? '—' : `${diferenca > 0 ? '+' : ''}${diferenca.toLocaleString('pt-BR')}`}</strong></div> })}</div></>}</section>}
    </>}{edicao && <EditorMedida medida={edicao} fechar={() => definirEdicao(undefined)} />}{escolha && <EscolherOpcao titulo={escolha === 'antes' ? 'Data de antes' : 'Data de depois'} opcoes={registros.map(m => formatarDataMedida(m.data))} inicial={Math.max(0, registros.findIndex(m => m.id === (escolha === 'antes' ? antes?.id : depois?.id)))} fechar={() => definirEscolha(undefined)} confirmar={indice => { if (escolha === 'antes') definirAntes(registros[indice].id); else definirDepois(registros[indice].id) }} />}</div>
}


