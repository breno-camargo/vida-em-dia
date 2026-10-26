import { useEffect, useId, useMemo, useRef, useState, type FormEvent } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Plus, Utensils, Trash2, BookOpen, Check, ChevronDown } from 'lucide-react'
import { enquadrarDetalhes, recolherDetalhesSuavemente } from '../utilitarios/enquadrarDetalhes'
import { EditorMedida } from '../componentes/EditorMedida'
import { Painel } from '../componentes/Painel'
import { PainelEnergia, ResumoEnergia } from '../componentes/PerfilEnergia'
import { criarRegistro, repositorio } from '../dados/repositorio'
import { tipoDia } from '../dados/atividade'
import { alimentosComuns } from '../dados/alimentosComuns'
import { calcularPorcao, lerGramas, nomeAlimento, salvarAlimentoPessoal, salvarRefeicaoCompleta, excluirAlimentoPessoal, alterarVisibilidadeAlimentosComuns } from '../dados/alimentacao'
import { novaMedida, dataMedida, formatarDataMedida } from '../dados/medidas'
import type { MedidaCorporal, AlimentoFavorito, Nutrientes, RefeicaoDia } from '../dados/modelos'

const refeicoes = ['Café da manhã', 'Almoço', 'Jantar', 'Lanche']
const nenhumAlimento: AlimentoFavorito[] = []
type OpcaoAlimento = Nutrientes & { id: string; nome: string; base_quantidade_g: number; alimento_id?: string; fonte?: string }
type ItemRascunho = { chave: string; alimento: OpcaoAlimento; quantidade: string }
const formatar = (valor: number, casas = 0) => valor.toLocaleString('pt-BR', { maximumFractionDigits: casas, minimumFractionDigits: casas })
const decimal = lerGramas
const textoBusca = (valor: string) => valor.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR')

export function Comida() {
  const [medidaAberta, setMedidaAberta] = useState<MedidaCorporal>()
  async function registrarPeso() {
    try { setMedidaAberta(await novaMedida()) }
    catch { setErro('Não foi possível abrir o registro de medidas.') }
  }
  const hoje = dataMedida()
  const [data, setData] = useState(hoje)
  const [metaAberta, setMetaAberta] = useState(false)
  const [painel, setPainel] = useState<'registro' | 'cadastro' | 'alimentos' | null>(null)
  const [refeicao, setRefeicao] = useState(refeicoes[0])
  const [refeicaoEditando, setRefeicaoEditando] = useState(refeicoes[0])
  const [alimentoId, setAlimentoId] = useState('')
  const [quantidade, setQuantidade] = useState('100')
  const [busca, setBusca] = useState('')
  const buscaRef = useRef<HTMLInputElement>(null)
  const formularioRefeicao = useId()
  const formularioAlimento = useId()
  const quantidadeRef = useRef<HTMLInputElement>(null)
  useEffect(() => {
    let quadro = 0
    const acompanhar = () => {
      cancelAnimationFrame(quadro)
      quadro = requestAnimationFrame(() => {
        const campo = quantidadeRef.current
        if (!campo || document.activeElement !== campo) return
        const area = campo.closest<HTMLElement>('.conteudo-modal')
        if (!area) return
        const viewport = window.visualViewport
        const caixa = campo.getBoundingClientRect(), painel = area.getBoundingClientRect()
        const topo = Math.max(painel.top, viewport?.offsetTop ?? 0) + 16
        const fundo = Math.min(painel.bottom, (viewport?.offsetTop ?? 0) + (viewport?.height ?? window.innerHeight)) - 24
        if (caixa.bottom > fundo || caixa.top < topo) area.scrollTo({ top: area.scrollTop + caixa.top - topo - Math.max(0, (fundo - topo - caixa.height) / 2), behavior: 'instant' })
      })
    }
    document.addEventListener('focusin', acompanhar)
    window.visualViewport?.addEventListener('resize', acompanhar)
    window.visualViewport?.addEventListener('scroll', acompanhar)
    return () => {
      cancelAnimationFrame(quadro)
      document.removeEventListener('focusin', acompanhar)
      window.visualViewport?.removeEventListener('resize', acompanhar)
      window.visualViewport?.removeEventListener('scroll', acompanhar)
    }
  }, [])
  const [erro, setErro] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [editando, setEditando] = useState<RefeicaoDia | null>(null)
  const [rascunho, setRascunho] = useState<ItemRascunho[]>([])
  const [dataRascunho, setDataRascunho] = useState(data)
  const travaSalvar = useRef(false)
  const [nomeNovo, setNomeNovo] = useState('')
  const [marcaNova, setMarcaNova] = useState('')
  const [alimentoEmEdicao, setAlimentoEmEdicao] = useState<AlimentoFavorito | null>(null)
  const [voltarParaAlimentos, setVoltarParaAlimentos] = useState(false)
  const [listaAlimentos, setListaAlimentos] = useState<'meus' | 'comuns'>('meus')
  const [buscaCadastro, setBuscaCadastro] = useState('')
  const [paraExcluir, setParaExcluir] = useState<AlimentoFavorito | typeof alimentosComuns[number] | null>(null)
  const [baseNova, setBaseNova] = useState('50')
  const [nutrientesNovos, setNutrientesNovos] = useState({ kcal: '', proteina_g: '', carbo_g: '', gordura_g: '', fibra_g: '', sodio_mg: '', acucares_g: '' })
  const registros = useLiveQuery(() => repositorio('refeicoes_dia').listar(), [], []) ?? []
  const pessoais = useLiveQuery(() => repositorio('alimentos_favoritos').listar(), [], nenhumAlimento)
  const config = useLiveQuery(async () => (await repositorio('configuracoes').listar()).find(c => c.chave === 'principal'))
  const feriados = useLiveQuery(() => repositorio('feriados').listar(), [], [])
  const tipoMeta = tipoDia(data, feriados, config?.descanso_por_data?.[data] === true)
  const metaDia = (tipoMeta === 'util' ? config?.meta_kcal_util : config?.meta_kcal_fds_feriado) ?? 0
  const comunsVisiveis = alimentosComuns.filter(a => !config?.alimentos_comuns_ocultos?.includes(a.id))
  const itens = useMemo<OpcaoAlimento[]>(() => [
    ...pessoais.filter(a => a.base_quantidade_g !== undefined).map(a => ({ ...a, id: `pessoal:${a.id}`, alimento_id: a.id, nome: nomeAlimento(a), base_quantidade_g: a.base_quantidade_g!, fonte: 'Meu alimento' })),
    ...alimentosComuns.filter(a => !config?.alimentos_comuns_ocultos?.includes(a.id)).map(a => ({ ...a })),
  ].filter(a => !rascunho.some(item => item.alimento.id === a.id) && textoBusca(a.nome).includes(textoBusca(busca.trim()))), [pessoais, busca, config, rascunho])
  const selecionado: OpcaoAlimento | undefined = editando && editando.quantidade_g ? { ...editando, nome: editando.alimento_nome ?? editando.descricao, base_quantidade_g: editando.quantidade_g } : itens.find(a => a.id === alimentoId)
  const doDia = registros.filter(r => r.data === data).sort((a, b) => b.horario.localeCompare(a.horario))
  const totais = doDia.reduce((s, r) => ({ kcal: s.kcal + r.kcal, proteina_g: s.proteina_g + (r.proteina_g ?? 0), carbo_g: s.carbo_g + (r.carbo_g ?? 0), gordura_g: s.gordura_g + (r.gordura_g ?? 0), fibra_g: s.fibra_g + (r.fibra_g ?? 0) }), { kcal: 0, proteina_g: 0, carbo_g: 0, gordura_g: 0, fibra_g: 0 })
  const comSodio = doDia.filter(r => r.sodio_mg !== undefined)
  const comAcucares = doDia.filter(r => r.acucares_g !== undefined)
  const acucaresDia = comAcucares.reduce((s,r) => s + (r.acucares_g ?? 0), 0)
  const sodioDia = comSodio.reduce((s, r) => s + (r.sodio_mg ?? 0), 0)
  const gramas = decimal(quantidade)
  const nutrientesCalculados = selecionado && Number.isFinite(gramas) && gramas > 0 && gramas <= 20000
    ? calcularPorcao(selecionado, selecionado.base_quantidade_g, gramas)
    : null
  const rascunhoCalculado = rascunho.map(item => {
    const quantidade = decimal(item.quantidade)
    return { ...item, nutrientes: Number.isFinite(quantidade) && quantidade > 0 && quantidade <= 20000 ? calcularPorcao(item.alimento, item.alimento.base_quantidade_g, quantidade) : null }
  })
  const itensDaRefeicao = [...rascunhoCalculado, ...(selecionado ? [{ chave: 'selecionado', alimento: selecionado, quantidade, nutrientes: nutrientesCalculados }] : [])]
  const totalRascunho = itensDaRefeicao.reduce((s, item) => ({ kcal: s.kcal + (item.nutrientes?.kcal ?? 0), proteina_g: s.proteina_g + (item.nutrientes?.proteina_g ?? 0), carbo_g: s.carbo_g + (item.nutrientes?.carbo_g ?? 0), gordura_g: s.gordura_g + (item.nutrientes?.gordura_g ?? 0), fibra_g: s.fibra_g + (item.nutrientes?.fibra_g ?? 0), acucares_g: s.acucares_g + (item.nutrientes?.acucares_g ?? 0), sodio_mg: s.sodio_mg + (item.nutrientes?.sodio_mg ?? 0) }), { kcal: 0, proteina_g: 0, carbo_g: 0, gordura_g: 0, fibra_g: 0, sodio_mg: 0, acucares_g: 0 })

  function abrirRefeicao(grupo?: string) {
    if (!rascunho.length) setDataRascunho(data)
    if (grupo) setRefeicao(grupo)
    setEditando(null); setAlimentoId(''); setBusca(''); setErro(''); setPainel('registro')
  }

  function selecionarAlimento(alimento: OpcaoAlimento) {
    setAlimentoId(alimento.id); setBusca(alimento.nome); setErro('')
    quantidadeRef.current?.focus()
    quantidadeRef.current?.select()
  }

  function adicionarAoRascunho() {
    if (!selecionado || !nutrientesCalculados) { setErro('Escolha um alimento e informe uma quantidade válida.'); return }
    setRascunho(atual => [...atual, { chave: criarRegistro().id, alimento: { ...selecionado }, quantidade }])
    setAlimentoId(''); setBusca(''); setQuantidade('100'); setErro('')
    quantidadeRef.current?.blur()
    requestAnimationFrame(() => {
      const busca = buscaRef.current
      const area = busca?.closest<HTMLElement>('.conteudo-modal')
      if (!busca || !area) return
      const label = busca.closest('label') ?? busca
      area.scrollTo({ top: area.scrollTop + label.getBoundingClientRect().top - area.getBoundingClientRect().top - 16, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' })
    })
  }

  async function salvarRefeicao() {
    if (travaSalvar.current) return
    if (!itensDaRefeicao.length) { setErro('Escolha pelo menos um alimento para salvar a refeição.'); return }
    if ((alimentoId && !nutrientesCalculados) || itensDaRefeicao.some(item => !item.nutrientes)) { setErro('Confira a quantidade de cada alimento antes de salvar.'); return }
    travaSalvar.current = true; setSalvando(true); setErro('')
    try {
      const horario = new Date().toTimeString().slice(0, 5)
      const registros: RefeicaoDia[] = itensDaRefeicao.map(item => ({ ...criarRegistro(), data: dataRascunho, refeicao, horario, descricao: item.alimento.nome, alimento_nome: item.alimento.nome, quantidade_g: decimal(item.quantidade), precisao: item.alimento.alimento_id ? 'exato' : 'estimado', ...item.nutrientes!, ...(item.alimento.alimento_id ? { alimento_id: item.alimento.alimento_id } : {}) }))
      await salvarRefeicaoCompleta(registros)
      setRascunho([]); setPainel(null); setAlimentoId(''); setBusca(''); setQuantidade('100')
    } catch { setErro('Não foi possível salvar a refeição. Nenhum item foi gravado; sua lista continua aqui para tentar novamente.') }
    finally { travaSalvar.current = false; setSalvando(false) }
  }

  function abrirCadastro(alimento?: AlimentoFavorito | typeof alimentosComuns[number], retornar = false) {
    setAlimentoEmEdicao(alimento && 'user_id' in alimento ? alimento : null)
    setNomeNovo(alimento?.nome ?? '')
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
    setVoltarParaAlimentos(retornar); setErro(''); setPainel('cadastro')
  }

  async function salvarConsumo(evento: FormEvent) {
    evento.preventDefault(); if (salvando) return; setErro('')
    const gramas = decimal(quantidade)
    if (!selecionado || !Number.isFinite(gramas) || gramas <= 0 || gramas > 20000 || !nutrientesCalculados) { setErro('Escolha um alimento e informe uma quantidade válida em gramas.'); return }
    if (!data || data > hoje || dataMedida(new Date(`${data}T12:00:00`)) !== data) { setErro('Escolha uma data válida, até hoje.'); return }
    setSalvando(true)
    try {
      if (editando) {
        const atual = await repositorio('refeicoes_dia').obter(editando.id)
        if (!atual || atual.apagado_em || atual.atualizado_em !== editando.atualizado_em) throw new Error('Registro alterado. Reabra a edição.')
      }
      const horario = editando?.horario ?? new Date().toTimeString().slice(0, 5)
      const registro: RefeicaoDia = { ...(editando ?? criarRegistro()), data, refeicao: refeicaoEditando, horario, descricao: selecionado.nome, alimento_nome: selecionado.nome, quantidade_g: gramas, precisao: editando?.precisao ?? (selecionado.alimento_id ? 'exato' : 'estimado'), ...nutrientesCalculados, ...(selecionado.alimento_id ? { alimento_id: selecionado.alimento_id } : {}) }
      await repositorio('refeicoes_dia').salvar(registro)
      setPainel(null); setEditando(null); setAlimentoId(''); setQuantidade('100'); setBusca('')
    } catch { setErro('Não foi possível salvar. Se o registro mudou em outro aparelho, reabra a edição.') } finally { setSalvando(false) }
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
      const alimento: AlimentoFavorito = { ...(alimentoEmEdicao ?? criarRegistro()), nome: nomeNovo.trim(), marca: marcaNova.trim(), porcao: `${formatar(base, 1)} g`, base_quantidade_g: base, fonte: 'pessoal', vezes_usado: alimentoEmEdicao?.vezes_usado ?? 0, kcal: valores.kcal, proteina_g: valores.proteina_g, carbo_g: valores.carbo_g, gordura_g: valores.gordura_g, fibra_g: valores.fibra_g }
      if (acucares !== undefined) alimento.acucares_g = acucares
      else delete alimento.acucares_g
      if (sodio !== undefined) alimento.sodio_mg = sodio
      else delete alimento.sodio_mg
      await salvarAlimentoPessoal(alimento, alimentoEmEdicao ?? undefined)
      if (!rascunho.length) setDataRascunho(data)
      setAlimentoEmEdicao(null); setNomeNovo(''); setMarcaNova(''); setEditando(null); setBusca(''); setPainel(voltarParaAlimentos ? 'alimentos' : 'registro'); setAlimentoId(`pessoal:${alimento.id}`); setQuantidade(String(base))
    } catch { setErro('Não foi possível salvar o alimento. Se ele mudou em outro aparelho, reabra a edição.') } finally { setSalvando(false) }
  }

  async function removerRegistro(registro: RefeicaoDia) {
    try { await repositorio('refeicoes_dia').apagar(registro.id) } catch { setErro('Não foi possível remover o registro.') }
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
<div className="comida-acoes"><button className="botao-principal" onClick={() => abrirRefeicao()}><Plus size={17} />{rascunho.length ? 'Continuar refeição' : 'Registrar refeição'}</button><button className="botao-secundario" onClick={() => abrirCadastro()}>Cadastrar meu alimento</button><button className="botao-secundario" onClick={() => { setErro(''); setPainel('alimentos') }}>Meus alimentos e catálogo</button></div>

    <ResumoEnergia registrarPeso={registrarPeso} />
    <div className="comida-titulo-lista"><h3>Refeições</h3><span>{formatarDataMedida(data)}</span></div>
    {doDia.length === 0 ? <div className="painel comida-vazio"><Utensils aria-hidden="true" /><strong>Nenhum alimento registrado</strong><p>Adicione os alimentos e as quantidades para ver o cálculo do seu dia.</p></div> : [...new Set([...refeicoes, ...doDia.map(r => r.refeicao)])].map(grupo => {
      const lista = doDia.filter(r => r.refeicao === grupo)
      if (!lista.length) return null
      const kcal = lista.reduce((s, r) => s + r.kcal, 0)
      return <details className="painel comida-refeicao" key={grupo} onToggle={enquadrarDetalhes}><summary onClick={recolherDetalhesSuavemente}><h3>{grupo}</h3><strong>{formatar(kcal)} kcal</strong><ChevronDown size={18} aria-hidden="true" /></summary>{lista.map(registro => <article className="comida-item" key={registro.id}><div><strong>{registro.alimento_nome ?? registro.descricao}</strong><span>{registro.horario} · {registro.quantidade_g !== undefined ? `${formatar(registro.quantidade_g, 1)} g` : 'porção registrada'}</span><small>{formatar(registro.kcal)} kcal · P {formatar(registro.proteina_g ?? 0, 1)} g · C {formatar(registro.carbo_g ?? 0, 1)} g · Fibra {formatar(registro.fibra_g ?? 0, 1)} g · Açúcares {registro.acucares_g !== undefined ? `${formatar(registro.acucares_g, 1)} g` : 'não informado'} · Sódio {registro.sodio_mg !== undefined ? `${formatar(registro.sodio_mg, 1)} mg` : "não informado"}</small></div><div className="comida-acoes-alimento">{registro.quantidade_g && <button className="botao-secundario" onClick={() => { setEditando(registro); setQuantidade(String(registro.quantidade_g)); setRefeicaoEditando(registro.refeicao); setErro(''); setPainel('registro') }}>Editar</button>}<button type="button" className="botao-secundario excluir-historico" aria-label={`Remover ${registro.alimento_nome ?? registro.descricao}`} onClick={() => void removerRegistro(registro)}><Trash2 size={17} />Excluir</button></div></article>)}<button type="button" className="botao-secundario" onClick={() => abrirRefeicao(grupo)}>Adicionar alimentos</button></details>
    })}
    <section className="painel comida-resumo" aria-label="Resumo nutricional do dia">
      <div className="comida-resumo-topo"><div><span>Total do dia</span><strong>{formatar(totais.kcal)} <small>kcal</small></strong></div><span>{doDia.length} {doDia.length === 1 ? 'item' : 'itens'}</span></div>
      <div className="comida-meta-diaria" aria-live="polite">{metaDia > 0 ? <><span>Meta: <strong>{formatar(metaDia)} kcal</strong></span><strong>{Math.round(totais.kcal) === Math.round(metaDia) ? 'Meta atingida' : totais.kcal < metaDia ? 'Restam ' + formatar(metaDia - totais.kcal) + ' kcal' : formatar(totais.kcal - metaDia) + ' kcal acima da meta'}</strong><progress aria-label="Consumo em relação à meta alimentar" max={metaDia} value={Math.min(totais.kcal, metaDia)} /></> : <><span>Meta alimentar não definida</span><button type="button" className="botao-secundario" onClick={() => setMetaAberta(true)}>Definir meta</button></>}</div>
      <div className="comida-macros"><span>Proteína<strong>{formatar(totais.proteina_g, 1)} g</strong></span><span>Carboidratos<strong>{formatar(totais.carbo_g, 1)} g</strong></span><span>Fibras<strong>{formatar(totais.fibra_g, 1)} g</strong></span><span>Gorduras totais<strong>{formatar(totais.gordura_g, 1)} g</strong></span><span>Açúcares totais<strong>{comAcucares.length ? `${formatar(acucaresDia, 1)} g${comAcucares.length < doDia.length ? ' (parcial)' : ''}` : 'Não informado'}</strong></span><span>Sódio<strong>{comSodio.length ? `${formatar(sodioDia, 1)} mg` : "—"}</strong></span></div>{comSodio.length < doDia.length && <p className="comida-base">Sódio parcial: há alimentos sem esse valor informado.</p>}
    </section>
    {medidaAberta && <EditorMedida medida={medidaAberta} fechar={() => setMedidaAberta(undefined)} />}
    {metaAberta && <PainelEnergia registrarPeso={registrarPeso} fechar={() => setMetaAberta(false)} />}
    {erro && !painel && <p role="alert" className="erro">{erro}</p>}
    <p className="comida-nota"><BookOpen size={15} /> Valores do catálogo comum são referências por 100 g. Produtos de marca podem variar; cadastre os dados do rótulo para calcular a sua porção.</p>

    {painel === 'registro' && <Painel titulo={editando ? 'Editar alimento do diário' : 'Montar refeição'} fechar={() => { if (!salvando) setPainel(null) }} acao={<button className="botao-principal salvar-cabecalho" type="submit" form={formularioRefeicao} aria-label={editando ? 'Salvar alteração' : 'Salvar refeição'} disabled={salvando || (!!editando && !nutrientesCalculados)}>{salvando ? 'Salvando…' : 'Salvar'}</button>}><form id={formularioRefeicao} className="formulario comida-formulario" onSubmit={evento => { if (editando) void salvarConsumo(evento); else { evento.preventDefault(); void salvarRefeicao() } }}>
      {!editando && <p className="comida-base">{formatarDataMedida(dataRascunho)} · Adicione os alimentos, confira a lista e salve a refeição completa.</p>}
      <label>Refeição<select value={editando ? refeicaoEditando : refeicao} onChange={e => editando ? setRefeicaoEditando(e.target.value) : setRefeicao(e.target.value)}>{refeicoes.map(r => <option key={r}>{r}</option>)}</select></label>
      {!editando && <section className="comida-escolher" aria-label="Escolher alimento">
        <label className="comida-data">Buscar alimento<input ref={buscaRef} type="search" autoComplete="off" value={busca} onChange={e => { setBusca(e.target.value); setAlimentoId('') }} placeholder="Digite o nome ou a marca" aria-controls={selecionado ? undefined : 'resultados-alimentos'} onKeyDown={e => { if (e.key === 'Enter' && !e.nativeEvent.isComposing) { e.preventDefault(); if (!selecionado && itens[0]) selecionarAlimento(itens[0]); else if (selecionado) quantidadeRef.current?.focus() } }} /></label>
        {selecionado ? <div className="comida-alimento-selecionado"><Check size={19} aria-hidden="true" /><div><small>Alimento selecionado</small><strong>{selecionado.nome}</strong></div><button className="botao-secundario" type="button" onClick={() => { setAlimentoId(''); setBusca(''); buscaRef.current?.focus() }}>Trocar</button></div> : <>
          <div className="comida-resultados" id="resultados-alimentos" aria-label="Resultados da busca">
            {itens.slice(0, 8).map(a => <button key={a.id} type="button" className="botao-secundario comida-resultado" aria-label={`Selecionar ${a.nome}`} onClick={() => selecionarAlimento(a)}><span><strong>{a.nome}</strong><small>{a.fonte} · {formatar(a.kcal)} kcal por {formatar(a.base_quantidade_g, 1)} g</small></span><Plus size={17} aria-hidden="true" /></button>)}
          </div>
          <p className="comida-base" role="status">{!itens.length ? 'Nenhum alimento encontrado. Cadastre o seu para continuar.' : itens.length > 8 ? `Mostrando 8 de ${itens.length} alimentos. Digite para refinar a busca.` : 'Toque no alimento para escolher.'}</p>
          {!itens.length && <button type="button" className="botao-secundario" onClick={() => abrirCadastro()}>Cadastrar meu alimento</button>}
        </>}
      </section>}
      {selecionado && <p className="comida-base">Referência: {formatar(selecionado.kcal)} kcal, P {formatar(selecionado.proteina_g ?? 0, 1)} g, C {formatar(selecionado.carbo_g ?? 0, 1)} g e fibra {formatar(selecionado.fibra_g ?? 0, 1)} g por {formatar(selecionado.base_quantidade_g, 1)} g.</p>}
      <label>Quantidade consumida (g)<input ref={quantidadeRef} inputMode="decimal" type="text" value={quantidade} onChange={e => setQuantidade(e.target.value)} placeholder="Ex.: 63" /></label>
      {nutrientesCalculados && <div className="comida-calculada"><strong>{formatar(nutrientesCalculados.kcal)} kcal</strong><span>Proteína {formatar(nutrientesCalculados.proteina_g ?? 0, 1)} g · Carboidratos {formatar(nutrientesCalculados.carbo_g ?? 0, 1)} g</span><span>Fibras {formatar(nutrientesCalculados.fibra_g ?? 0, 1)} g · Gorduras {formatar(nutrientesCalculados.gordura_g ?? 0, 1)} g</span><span>Açúcares totais {nutrientesCalculados.acucares_g !== undefined ? `${formatar(nutrientesCalculados.acucares_g, 1)} g` : 'não informado'}</span><span>Sódio {nutrientesCalculados.sodio_mg !== undefined ? `${formatar(nutrientesCalculados.sodio_mg, 1)} mg` : "não informado"}</span></div>}
      {!editando && <>
        <button className="botao-secundario" type="button" disabled={salvando || !nutrientesCalculados} onClick={adicionarAoRascunho}><Plus size={17} /> Adicionar à refeição</button>
        {selecionado && <p className="comida-base">O alimento selecionado será incluído ao salvar. Para escolher outro também, toque em “Adicionar à refeição”.</p>}
        <section className="comida-rascunho" aria-label="Alimentos da refeição"><h3>{refeicao} · {itensDaRefeicao.length} {itensDaRefeicao.length === 1 ? 'alimento' : 'alimentos'}</h3>
          {!rascunho.length && <p className="comida-base">{selecionado ? 'O alimento selecionado acima será salvo nesta refeição.' : 'Escolha os alimentos para montar sua refeição.'}</p>}
          {rascunhoCalculado.map(item => <details className="comida-item-recolhido" key={item.chave} onToggle={enquadrarDetalhes}><summary onClick={recolherDetalhesSuavemente}><span><strong>{item.alimento.nome}</strong><small>{item.quantidade || '0'} g · {item.nutrientes ? formatar(item.nutrientes.kcal) + ' kcal' : 'Quantidade inválida'}</small></span><ChevronDown size={18} aria-hidden="true" /></summary><div className="comida-item-edicao"><label className="comida-data">Quantidade (g)<input aria-label={`Quantidade de ${item.alimento.nome} (g)`} inputMode="decimal" value={item.quantidade} disabled={salvando} onChange={e => setRascunho(atual => atual.map(a => a.chave === item.chave ? { ...a, quantidade: e.target.value } : a))} /></label><button type="button" className="comida-remover" disabled={salvando} aria-label={`Retirar ${item.alimento.nome} da refeição`} onClick={() => setRascunho(atual => atual.filter(a => a.chave !== item.chave))}><Trash2 size={17} /></button></div></details>)}
        </section>
        {!!itensDaRefeicao.length && <div className="comida-calculada" aria-live="polite"><span>Total da refeição</span><strong>{formatar(totalRascunho.kcal)} kcal</strong><span>Proteína {formatar(totalRascunho.proteina_g, 1)} g · Carboidratos {formatar(totalRascunho.carbo_g, 1)} g</span><span>Fibras {formatar(totalRascunho.fibra_g, 1)} g · Gorduras totais {formatar(totalRascunho.gordura_g, 1)} g</span><span>Açúcares totais: {itensDaRefeicao.some(a => a.nutrientes?.acucares_g !== undefined) ? `${formatar(totalRascunho.acucares_g, 1)} g${itensDaRefeicao.some(a => a.nutrientes?.acucares_g === undefined) ? ' (parcial)' : ''}` : 'não informado'}</span><span>Sódio: {itensDaRefeicao.some(a => a.nutrientes?.sodio_mg !== undefined) ? `${formatar(totalRascunho.sodio_mg, 1)} mg` : 'não informado'}{itensDaRefeicao.some(a => a.nutrientes?.sodio_mg !== undefined) && itensDaRefeicao.some(a => a.nutrientes?.sodio_mg === undefined) ? ' (parcial)' : ''}</span></div>}
      </>}
      {erro && <p className="erro" role="alert">{erro}</p>}
    </form></Painel>}

    {painel === 'cadastro' && <Painel titulo={alimentoEmEdicao ? 'Editar meu alimento' : voltarParaAlimentos ? 'Criar cópia pessoal' : 'Cadastrar meu alimento'} fechar={() => { if (!salvando) { setErro(''); setPainel(voltarParaAlimentos ? 'alimentos' : null) } }} acao={<button className="botao-principal salvar-cabecalho" type="submit" form={formularioAlimento} aria-label={voltarParaAlimentos ? 'Salvar alimento' : 'Salvar alimento e registrar'} disabled={salvando}>{salvando ? 'Salvando…' : 'Salvar'}</button>}><form id={formularioAlimento} className="formulario comida-formulario" onSubmit={cadastrarAlimento}>
      <p>Este alimento fica salvo só no seu perfil. Copie os valores do rótulo e informe a porção a que eles correspondem.</p>
      {alimentoEmEdicao && <p className="comida-base">As mudanças valem para os próximos registros. As refeições já salvas mantêm seus valores.</p>}
      <label>Nome do alimento<input required maxLength={100} value={nomeNovo} onChange={e => setNomeNovo(e.target.value)} placeholder="Ex.: Pão integral" /></label>
      <label>Marca (opcional)<input maxLength={100} value={marcaNova} onChange={e => setMarcaNova(e.target.value)} placeholder="Ex.: marca da embalagem" /></label>
      <label>Porção de referência (g)<input required inputMode="decimal" type="text" value={baseNova} onChange={e => setBaseNova(e.target.value)} placeholder="50" /></label>
      <div className="comida-grade-nutrientes">
        {([['kcal', 'Calorias (kcal)'], ['proteina_g', 'Proteína (g)'], ['carbo_g', 'Carboidratos (g)'], ['fibra_g', 'Fibras (g, opcional)'], ['gordura_g', 'Gorduras totais (g)'], ['sodio_mg', 'Sódio (mg, opcional)'], ['acucares_g', 'Açúcares totais (g, opcional)']] as const).map(([campo, rotulo]) => <label key={campo}>{rotulo}<input required={campo !== 'sodio_mg' && campo !== 'fibra_g' && campo !== 'acucares_g'} inputMode="decimal" type="text" value={nutrientesNovos[campo]} onChange={e => setNutrientesNovos(atual => ({ ...atual, [campo]: e.target.value }))} placeholder="0" /></label>)}
      </div>
      <p className="comida-nota-form">Informe os valores para a porção de referência indicada acima. Sem fibras? Deixe o campo vazio para registrar 0 g. Sódio e açúcares vazios continuam como não informados. Açúcares já fazem parte dos carboidratos e não somam calorias novamente.</p>
      {erro && <p className="erro" role="alert">{erro}</p>}
    </form></Painel>}

    {painel === 'alimentos' && <Painel titulo="Alimentos" fechar={() => setPainel(null)}><div className="comida-biblioteca">
      <div className="abas-catalogo" aria-label="Origem dos alimentos"><button aria-pressed={listaAlimentos === 'meus'} onClick={() => setListaAlimentos('meus')}>Meus alimentos</button><button aria-pressed={listaAlimentos === 'comuns'} onClick={() => setListaAlimentos('comuns')}>Catálogo comum</button></div>
      <label className="comida-data">Buscar no catálogo<input value={buscaCadastro} onChange={e => setBuscaCadastro(e.target.value)} placeholder="Nome ou marca" /></label>
      <p className="comida-base">{listaAlimentos === 'meus' ? 'Edite ou exclua seus alimentos. As refeições antigas ficam preservadas.' : 'Crie uma cópia para ajustar os valores ou exclua a referência do seu catálogo pessoal.'}</p>
      {(listaAlimentos === 'meus' ? pessoais : comunsVisiveis).filter(a => nomeAlimento(a).toLocaleLowerCase('pt-BR').includes(buscaCadastro.trim().toLocaleLowerCase('pt-BR'))).map(a => <article className="comida-item" key={a.id}><div><strong>{nomeAlimento(a)}</strong><span>{formatar(a.kcal)} kcal por {a.base_quantidade_g !== undefined ? `${formatar(a.base_quantidade_g, 1)} g` : 'porção sem peso definido'}</span></div><div className="comida-acoes-alimento"><button className="botao-secundario" onClick={() => abrirCadastro(a, true)}>{listaAlimentos === 'meus' ? 'Editar' : 'Criar cópia pessoal'}</button><button type="button" className="botao-secundario excluir-historico" aria-label={`Excluir ${nomeAlimento(a)}`} onClick={() => { setErro(''); setParaExcluir(a) }}><Trash2 size={17} />Excluir</button></div></article>)}
      {listaAlimentos === 'meus' && !pessoais.length && <p className="comida-base">Você ainda não cadastrou alimentos. Cadastre o seu ou copie uma referência do catálogo comum.</p>}
      {listaAlimentos === 'comuns' && !!config?.alimentos_comuns_ocultos?.length && <button className="botao-secundario" disabled={salvando} onClick={async () => { setSalvando(true); setErro(''); try { await alterarVisibilidadeAlimentosComuns() } catch { setErro('Não foi possível restaurar os alimentos.') } finally { setSalvando(false) } }}>Restaurar pré-cadastrados excluídos</button>}
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
