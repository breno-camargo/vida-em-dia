import { useEffect, useId, useState, type FormEvent } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Plus, Utensils, Trash2, BookOpen, ChevronDown } from 'lucide-react'
import { enquadrarDetalhes, recolherDetalhesSuavemente } from '../utilitarios/enquadrarDetalhes'
import { FiltrosAlimentos, type FiltroAlimentos } from '../componentes/FiltrosAlimentos'
import { tipoAlimento, tiposAlimentos } from '../dados/tiposAlimentos'
import { EditorRefeicao } from '../componentes/EditorRefeicao'
import { EditorMedida } from '../componentes/EditorMedida'
import { Painel } from '../componentes/Painel'
import { PainelEnergia, ResumoEnergia } from '../componentes/PerfilEnergia'
import { criarRegistro, repositorio } from '../dados/repositorio'
import { referenciaAlimentar, registrarReferenciaHoje } from '../dados/referenciaAlimentar'
import { pesoParaEnergia } from '../dados/energia'
import { tipoDia } from '../dados/atividade'
import { alimentosComuns } from '../dados/alimentosComuns'
import { lerGramas, nomeAlimento, salvarAlimentoPessoal, excluirAlimentoPessoal, alterarVisibilidadeAlimentosComuns } from '../dados/alimentacao'
import { novaMedida, dataMedida, formatarDataMedida } from '../dados/medidas'
import type { MedidaCorporal, AlimentoFavorito, RefeicaoDia } from '../dados/modelos'

const refeicoes = ['Café da manhã', 'Almoço', 'Jantar', 'Lanche']
const nenhumAlimento: AlimentoFavorito[] = []
const formatar = (valor: number, casas = 0) => valor.toLocaleString('pt-BR', { maximumFractionDigits: casas, minimumFractionDigits: casas })
const decimal = lerGramas
const textoBusca = (valor: string) => valor.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR')

export function Comida() {
  const [editorRefeicao, setEditorRefeicao] = useState<{ data: string; grupo?: string; anteriores?: RefeicaoDia[] }>()
  const [retornoEditor, setRetornoEditor] = useState(false)
  const [medidaAberta, setMedidaAberta] = useState<MedidaCorporal>()
  async function registrarPeso() {
    try { setMedidaAberta(await novaMedida()) }
    catch { setErro('Não foi possível abrir o registro de medidas.') }
  }
  const hoje = dataMedida()
  const [data, setData] = useState(hoje)
  const [metaAberta, setMetaAberta] = useState(false)
  const [painel, setPainel] = useState<'cadastro' | 'alimentos' | null>(null)
  const formularioAlimento = useId()
  const [erro, setErro] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [nomeNovo, setNomeNovo] = useState('')
  const [marcaNova, setMarcaNova] = useState('')
  const [alimentoEmEdicao, setAlimentoEmEdicao] = useState<AlimentoFavorito | null>(null)
  const [copiandoAlimento, setCopiandoAlimento] = useState(false)
  const [listaAlimentos, setListaAlimentos] = useState<FiltroAlimentos>('todos')
  const [tipoCadastro, setTipoCadastro] = useState('')
  const [tipoNovo, setTipoNovo] = useState('Outros')
  const [buscaCadastro, setBuscaCadastro] = useState('')
  const [paraExcluir, setParaExcluir] = useState<AlimentoFavorito | typeof alimentosComuns[number] | null>(null)
  const [baseNova, setBaseNova] = useState('50')
  const [nutrientesNovos, setNutrientesNovos] = useState({ kcal: '', proteina_g: '', carbo_g: '', gordura_g: '', fibra_g: '', sodio_mg: '', acucares_g: '' })
  const registros = useLiveQuery(() => repositorio('refeicoes_dia').listar(), [], []) ?? []
  const pessoais = useLiveQuery(() => repositorio('alimentos_favoritos').listar(), [], nenhumAlimento)
  const config = useLiveQuery(async () => (await repositorio('configuracoes').listar()).find(c => c.chave === 'principal'))
  const feriados = useLiveQuery(() => repositorio('feriados').listar(), [], [])
  const tipoMeta = tipoDia(data, feriados, config?.descanso_por_data?.[data] === true)
  const medidas = useLiveQuery(() => repositorio('medidas_corporais').listar(), [], [])
  const referencias = useLiveQuery(() => repositorio('consumo_diario_meta').listar(), [], [])
  useEffect(() => { if (config) void registrarReferenciaHoje().catch(() => setErro('Não foi possível guardar a referência alimentar do dia.')) }, [config, medidas, feriados, hoje])
  const historica = referencias.find(r => r.data === data)
  const referencia = data === hoje ? referenciaAlimentar(config, pesoParaEnergia(medidas, data)?.peso, tipoMeta, data) : { kcal: historica?.meta_kcal_aplicada ?? 0, origem: historica?.origem_meta ?? 'manual' }
  const metaDia = referencia.kcal
  const comunsVisiveis = alimentosComuns.filter(a => !config?.alimentos_comuns_ocultos?.includes(a.id))
  const doDia = registros.filter(r => r.data === data).sort((a, b) => b.horario.localeCompare(a.horario))
  const totais = doDia.reduce((s, r) => ({ kcal: s.kcal + r.kcal, proteina_g: s.proteina_g + (r.proteina_g ?? 0), carbo_g: s.carbo_g + (r.carbo_g ?? 0), gordura_g: s.gordura_g + (r.gordura_g ?? 0), fibra_g: s.fibra_g + (r.fibra_g ?? 0) }), { kcal: 0, proteina_g: 0, carbo_g: 0, gordura_g: 0, fibra_g: 0 })
  const comSodio = doDia.filter(r => r.sodio_mg !== undefined)
  const comAcucares = doDia.filter(r => r.acucares_g !== undefined)
  const acucaresDia = comAcucares.reduce((s,r) => s + (r.acucares_g ?? 0), 0)
  const sodioDia = comSodio.reduce((s, r) => s + (r.sodio_mg ?? 0), 0)
  function abrirRefeicao(grupo?: string, anteriores?: RefeicaoDia[]) {
    setErro(''); setEditorRefeicao({ data, grupo, anteriores })
  }

  function abrirCadastro(alimento?: AlimentoFavorito | typeof alimentosComuns[number]) {
    setAlimentoEmEdicao(alimento && 'user_id' in alimento ? alimento : null)
    setNomeNovo(alimento?.nome ?? '')
    setTipoNovo(tipoAlimento(alimento ?? {}))
    setMarcaNova(alimento && 'user_id' in alimento ? alimento.marca ?? '' : '')
    setBaseNova(alimento ? String(alimento.base_quantidade_g ?? '') : '50')
    setNutrientesNovos({
      kcal: alimento ? String(alimento.kcal) : '',
      proteina_g: alimento?.proteina_g !== undefined ? String(alimento.proteina_g) : '',
      carbo_g: alimento?.carbo_g !== undefined ? String(alimento.carbo_g) : '',
      gordura_g: alimento?.gordura_g !== undefined ? String(alimento.gordura_g) : '',
      fibra_g: alimento?.fibra_g !== undefined ? String(alimento.fibra_g) : '',
      acucares_g: alimento?.acucares_g !== undefined ? String(alimento.acucares_g) : '',
      sodio_mg: alimento?.sodio_mg !== undefined ? String(alimento.sodio_mg) : '',
    })
    setCopiandoAlimento(!!alimento && !('user_id' in alimento))
    setErro(''); setPainel('cadastro')
  }

  async function cadastrarAlimento(evento: FormEvent) {
    evento.preventDefault(); if (salvando) return; setErro('')
    const base = decimal(baseNova)
    const valores = Object.fromEntries(Object.entries(nutrientesNovos).map(([chave, valor]) => [chave, decimal(valor)])) as Record<string, number>
    if (!nutrientesNovos.fibra_g.trim()) valores.fibra_g = 0
    if (!nomeNovo.trim() || nomeNovo.trim().length > 100 || marcaNova.trim().length > 100 || !Number.isFinite(base) || base <= 0 || base > 5000 || ['kcal', 'proteina_g', 'carbo_g', 'gordura_g', 'fibra_g'].some(c => !Number.isFinite(valores[c]) || valores[c] < 0 || valores[c] > 10000) || !nutrientesNovos.kcal || !nutrientesNovos.proteina_g || !nutrientesNovos.carbo_g) {
      setErro('Preencha nome, porção base, calorias, proteína, carboidratos e gorduras com valores válidos. Use 0 quando não houver o nutriente.'); return
    }
    const acucares = nutrientesNovos.acucares_g.trim() ? decimal(nutrientesNovos.acucares_g) : undefined
    if (acucares !== undefined && (!Number.isFinite(acucares) || acucares < 0)) { setErro('Informe os açúcares totais em g ou deixe vazio.'); return }
    const sodio = nutrientesNovos.sodio_mg.trim() ? decimal(nutrientesNovos.sodio_mg) : undefined
    if (sodio !== undefined && (!Number.isFinite(sodio) || sodio < 0)) { setErro('Informe o sódio em mg ou deixe o campo vazio.'); return }
    setSalvando(true)
    try {
      const alimento: AlimentoFavorito = { ...(alimentoEmEdicao ?? criarRegistro()), nome: nomeNovo.trim(), tipo_alimento: tipoNovo, marca: marcaNova.trim(), porcao: `${formatar(base, 1)} g`, base_quantidade_g: base, fonte: 'pessoal', vezes_usado: alimentoEmEdicao?.vezes_usado ?? 0, kcal: valores.kcal, proteina_g: valores.proteina_g, carbo_g: valores.carbo_g, gordura_g: valores.gordura_g, fibra_g: valores.fibra_g }
      if (acucares !== undefined) alimento.acucares_g = acucares
      else delete alimento.acucares_g
      if (sodio !== undefined) alimento.sodio_mg = sodio
      else delete alimento.sodio_mg
      await salvarAlimentoPessoal(alimento, alimentoEmEdicao ?? undefined)
      setAlimentoEmEdicao(null); setNomeNovo(''); setMarcaNova(''); setPainel(retornoEditor ? null : 'alimentos'); setRetornoEditor(false);
    } catch { setErro('Não foi possível salvar o alimento. Se ele mudou em outro aparelho, reabra a edição.') } finally { setSalvando(false) }
  }

  async function confirmarExclusao() {
    if (!paraExcluir || salvando) return
    setSalvando(true); setErro('')
    try {
      if ('user_id' in paraExcluir) await excluirAlimentoPessoal(paraExcluir.id)
      else await alterarVisibilidadeAlimentosComuns(paraExcluir.id)
      setParaExcluir(null)
    } catch { setErro('Não foi possível excluir o alimento. Tente novamente.') }
    finally { setSalvando(false) }
  }

  return <section className="tela-comida">
    <div className="comida-cabecalho"><div><span className="etiqueta">ALIMENTAÇÃO</span><h2>Seu diário alimentar</h2><p>Registre o que comeu e acompanhe os nutrientes do dia.</p></div><Utensils aria-hidden="true" /></div>
    <label className="comida-data">Dia do registro<input aria-label="Dia do registro" type="date" max={hoje} value={data} onChange={e => { if (e.target.value) setData(e.target.value) }} /></label>
<div className="comida-acoes"><button className="botao-principal" onClick={() => abrirRefeicao()}><Plus size={17} />Registrar refeição</button><button className="botao-secundario" onClick={() => { setErro(''); setPainel('alimentos') }}>Meu catálogo</button></div>

    <ResumoEnergia registrarPeso={registrarPeso} />
    <div className="comida-titulo-lista"><h3>Refeições</h3><span>{formatarDataMedida(data)}</span></div>
    {doDia.length === 0 ? <div className="painel comida-vazio"><Utensils aria-hidden="true" /><strong>Nenhum alimento registrado</strong><p>Adicione os alimentos e as quantidades para ver o cálculo do seu dia.</p></div> : [...new Set([...refeicoes, ...doDia.map(r => r.refeicao)])].map(grupo => {
      const lista = doDia.filter(r => r.refeicao === grupo)
      if (!lista.length) return null
      const kcal = lista.reduce((s, r) => s + r.kcal, 0)
      return <details className="painel comida-refeicao" key={grupo} onToggle={enquadrarDetalhes}><summary onClick={recolherDetalhesSuavemente}><h3>{grupo}</h3><span>{lista.length} {lista.length === 1 ? 'alimento' : 'alimentos'}</span><strong>{formatar(kcal)} kcal</strong><ChevronDown size={18} aria-hidden="true" /></summary>{lista.map(registro => <article className="comida-item" key={registro.id}><div><strong>{registro.alimento_nome ?? registro.descricao}</strong><span>{registro.horario} · {registro.quantidade_g !== undefined ? `${formatar(registro.quantidade_g, 1)} g` : 'porção registrada'}</span><small>{formatar(registro.kcal)} kcal · P {formatar(registro.proteina_g ?? 0, 1)} g · C {formatar(registro.carbo_g ?? 0, 1)} g · Fibra {formatar(registro.fibra_g ?? 0, 1)} g · Açúcares {registro.acucares_g !== undefined ? `${formatar(registro.acucares_g, 1)} g` : '—'} · Sódio {registro.sodio_mg !== undefined ? `${formatar(registro.sodio_mg, 1)} mg` : "—"}</small></div></article>)}<div className="comida-acoes-alimento"><button type="button" className="botao-secundario" onClick={() => abrirRefeicao(grupo, lista)}>Editar refeição</button><button type="button" className="botao-secundario" onClick={() => abrirRefeicao(grupo)}>Adicionar alimento</button></div></details>
    })}
    <section className="painel comida-resumo" aria-label="Resumo nutricional do dia">
      <div className="comida-resumo-topo"><div><span>Total do dia</span><strong>{formatar(totais.kcal)} <small>kcal</small></strong></div><span>{doDia.length} {doDia.length === 1 ? 'item' : 'itens'}</span></div>
      <div className="comida-meta-diaria" aria-live="polite">{metaDia > 0 ? <><span>{referencia.origem === 'manutencao' ? 'Referência estimada de manutenção' : 'Meta'}: <strong>{formatar(metaDia)} kcal</strong></span><strong>{Math.round(totais.kcal) === Math.round(metaDia) ? (referencia.origem === 'manutencao' ? 'Referência atingida' : 'Meta atingida') : totais.kcal < metaDia ? 'Restam ' + formatar(metaDia - totais.kcal) + ' kcal' : formatar(totais.kcal - metaDia) + (referencia.origem === 'manutencao' ? ' kcal acima da referência' : ' kcal acima da meta')}</strong><progress aria-label="Consumo em relação à referência alimentar" max={metaDia} value={Math.min(totais.kcal, metaDia)} /></> : <><span>{data === hoje ? 'Complete seu perfil e rotina para estimar a manutenção, ou defina uma meta.' : 'Sem referência alimentar registrada para este dia.'}</span><button type="button" className="botao-secundario" onClick={() => setMetaAberta(true)}>Definir meta</button></>}</div>
      <div className="comida-macros"><span>Proteína<strong>{formatar(totais.proteina_g, 1)} g</strong></span><span>Carboidratos<strong>{formatar(totais.carbo_g, 1)} g</strong></span><span>Fibras<strong>{formatar(totais.fibra_g, 1)} g</strong></span><span>Gorduras totais<strong>{formatar(totais.gordura_g, 1)} g</strong></span><span>Açúcares totais<strong>{comAcucares.length > 0 && comAcucares.length === doDia.length ? `${formatar(acucaresDia, 1)} g` : '—'}</strong></span><span>Sódio<strong>{comSodio.length > 0 && comSodio.length === doDia.length ? `${formatar(sodioDia, 1)} mg` : "—"}</strong></span></div>
    </section>
    {medidaAberta && <EditorMedida medida={medidaAberta} fechar={() => setMedidaAberta(undefined)} />}
    {metaAberta && <PainelEnergia registrarPeso={registrarPeso} fechar={() => setMetaAberta(false)} />}
    {erro && !painel && <p role="alert" className="erro">{erro}</p>}
    <p className="comida-nota"><BookOpen size={15} /> Valores do catálogo comum são referências por 100 g. Produtos de marca podem variar; cadastre os dados do rótulo para calcular a sua porção.</p>

    {editorRefeicao && <EditorRefeicao suspenso={painel === 'cadastro'} data={editorRefeicao.data} grupo={editorRefeicao.grupo} anteriores={editorRefeicao.anteriores} fechar={() => setEditorRefeicao(undefined)} cadastrar={() => { abrirCadastro(); setRetornoEditor(true) }} />}
    {painel === 'cadastro' && <Painel titulo={alimentoEmEdicao ? 'Editar meu alimento' : copiandoAlimento ? 'Criar cópia pessoal' : 'Cadastrar meu alimento'} fechar={() => { if (!salvando) { setErro(''); setPainel(retornoEditor ? null : 'alimentos'); setRetornoEditor(false) } }} acao={<button className="botao-principal salvar-cabecalho" type="submit" form={formularioAlimento} aria-label="Salvar alimento" disabled={salvando}>{salvando ? 'Salvando…' : 'Salvar'}</button>}><form id={formularioAlimento} className="formulario comida-formulario" onSubmit={cadastrarAlimento}>
      <p>Este alimento fica salvo só no seu perfil. Copie os valores do rótulo e informe a porção a que eles correspondem.</p>
      {alimentoEmEdicao && <p className="comida-base">As mudanças valem para os próximos registros. As refeições já salvas mantêm seus valores.</p>}
      <label>Nome do alimento<input required maxLength={100} value={nomeNovo} onChange={e => setNomeNovo(e.target.value)} placeholder="Ex.: Pão integral" /></label>
      <label>Tipo do alimento<select value={tipoNovo} onChange={e => setTipoNovo(e.target.value)}>{tiposAlimentos.map(t => <option key={t}>{t}</option>)}</select></label>
      <label>Marca (opcional)<input maxLength={100} value={marcaNova} onChange={e => setMarcaNova(e.target.value)} placeholder="Ex.: marca da embalagem" /></label>
      <label>Porção de referência (g)<input required inputMode="decimal" type="text" value={baseNova} onChange={e => setBaseNova(e.target.value)} placeholder="50" /></label>
      <div className="comida-grade-nutrientes">
        {([['kcal', 'Calorias (kcal)'], ['proteina_g', 'Proteína (g)'], ['carbo_g', 'Carboidratos (g)'], ['fibra_g', 'Fibras (g, opcional)'], ['gordura_g', 'Gorduras totais (g)'], ['sodio_mg', 'Sódio (mg, opcional)'], ['acucares_g', 'Açúcares totais (g, opcional)']] as const).map(([campo, rotulo]) => <label key={campo}>{rotulo}<input required={campo !== 'sodio_mg' && campo !== 'fibra_g' && campo !== 'acucares_g'} inputMode="decimal" type="text" value={nutrientesNovos[campo]} onChange={e => setNutrientesNovos(atual => ({ ...atual, [campo]: e.target.value }))} placeholder="0" /></label>)}
      </div>
      <p className="comida-nota-form">Informe os valores para a porção de referência indicada acima. Sem fibras? Deixe o campo vazio para registrar 0 g. Sódio e açúcares vazios continuam como não informados. Açúcares já fazem parte dos carboidratos e não somam calorias novamente.</p>
      {erro && <p className="erro" role="alert">{erro}</p>}
    </form></Painel>}

    {painel === 'alimentos' && <Painel titulo="Meu catálogo" fechar={() => setPainel(null)}><div className="comida-biblioteca"><button type="button" className="botao-principal" onClick={() => abrirCadastro()}><Plus size={17} />Cadastrar alimento</button>
      <FiltrosAlimentos filtro={listaAlimentos} definirFiltro={setListaAlimentos} tipo={tipoCadastro} definirTipo={setTipoCadastro} />
      <label className="comida-data">Buscar no catálogo<input value={buscaCadastro} onChange={e => setBuscaCadastro(e.target.value)} placeholder="Nome ou marca" /></label>
      <p className="comida-base">{listaAlimentos === 'meus' ? 'Edite ou exclua seus alimentos. As refeições antigas ficam preservadas.' : 'Crie uma cópia para ajustar os valores ou exclua a referência do seu catálogo pessoal.'}</p>
      {(listaAlimentos === 'meus' ? pessoais : [...pessoais, ...comunsVisiveis]).filter(a => (listaAlimentos !== 'tipo' || !tipoCadastro || tipoAlimento(a) === tipoCadastro) && textoBusca(nomeAlimento(a)).includes(textoBusca(buscaCadastro.trim()))).map(a => <article className="comida-item" key={a.id}><div><strong>{nomeAlimento(a)}</strong><span>{formatar(a.kcal)} kcal por {a.base_quantidade_g !== undefined ? `${formatar(a.base_quantidade_g, 1)} g` : 'porção sem peso definido'}</span></div><div className="comida-acoes-alimento"><button className="botao-secundario" onClick={() => abrirCadastro(a)}>{'user_id' in a ? 'Editar' : 'Criar cópia pessoal'}</button><button type="button" className="botao-secundario excluir-historico" aria-label={`Excluir ${nomeAlimento(a)}`} onClick={() => { setErro(''); setParaExcluir(a) }}><Trash2 size={17} />Excluir</button></div></article>)}
      {listaAlimentos === 'meus' && !pessoais.length && <p className="comida-base">Você ainda não cadastrou alimentos. Cadastre o seu ou copie uma referência do catálogo comum.</p>}
      {listaAlimentos !== 'meus' && !!config?.alimentos_comuns_ocultos?.length && <button className="botao-secundario" disabled={salvando} onClick={async () => { setSalvando(true); setErro(''); try { await alterarVisibilidadeAlimentosComuns() } catch { setErro('Não foi possível restaurar os alimentos.') } finally { setSalvando(false) } }}>Restaurar pré-cadastrados excluídos</button>}
      {erro && !paraExcluir && <p role="alert" className="erro">{erro}</p>}
    </div></Painel>}
    {paraExcluir && <Painel centralizado titulo="Excluir alimento" fechar={() => { if (!salvando) { setErro(''); setParaExcluir(null) } }}><div className="formulario">
      <p>Excluir “{nomeAlimento(paraExcluir)}” do seu catálogo? As refeições já registradas mantêm seus nomes e nutrientes.</p>
      {!('user_id' in paraExcluir) && <p className="comida-base">A exclusão vale só para o seu perfil. Você pode restaurar os pré-cadastrados depois.</p>}
      {erro && <p role="alert" className="erro">{erro}</p>}
      <button type="button" className="botao-secundario" disabled={salvando} onClick={() => { setParaExcluir(null); setErro('') }}>Voltar</button>
      <button type="button" className="botao-secundario excluir-historico" disabled={salvando} onClick={() => void confirmarExclusao()}>{salvando ? 'Excluindo…' : 'Excluir alimento'}</button>
    </div></Painel>}
  </section>
}
