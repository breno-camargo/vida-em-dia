import { useId, useMemo, useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Plus, Trash2 } from 'lucide-react'
import { FiltrosAlimentos, type FiltroAlimentos } from './FiltrosAlimentos'
import { tipoAlimento } from '../dados/tiposAlimentos'
import { Painel } from './Painel'
import { calcularPorcao, lerGramas, nomeAlimento, salvarRefeicaoCompleta } from '../dados/alimentacao'
import { alimentosComuns } from '../dados/alimentosComuns'
import { criarRegistro, repositorio } from '../dados/repositorio'
import type { Nutrientes, RefeicaoDia } from '../dados/modelos'

type Alimento = Nutrientes & { tipo_alimento?: string; id: string; nome: string; base_quantidade_g: number; alimento_id?: string }
type Item = { chave: string; alimento: Alimento; quantidade: number; original?: RefeicaoDia }
const grupos = ['Café da manhã', 'Almoço', 'Jantar', 'Lanche']
const numero = (n: number) => n.toLocaleString('pt-BR', { maximumFractionDigits: 1 })
const buscaNormal = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR')
const campos = ['kcal', 'proteina_g', 'carbo_g', 'gordura_g', 'fibra_g', 'sodio_mg', 'acucares_g'] as const

export function EditorRefeicao({ data, grupo, anteriores, fechar, cadastrar, suspenso = false }: {
  data: string; grupo?: string; anteriores?: RefeicaoDia[]; fechar: () => void; cadastrar: () => void; suspenso?: boolean
}) {
  const id = useId()
  const travaSalvar = useRef(false)
  const buscaRef = useRef<HTMLInputElement>(null)
  const [refeicao, setRefeicao] = useState(grupo ?? grupos[0])
  const [itens, setItens] = useState<Item[]>(() => (anteriores ?? []).map(r => ({ chave: r.id, original: r, quantidade: r.quantidade_g ?? 1,
    alimento: { ...r, id: r.alimento_id ? `pessoal:${r.alimento_id}` : alimentosComuns.find(a => a.nome === (r.alimento_nome ?? r.descricao))?.id ?? r.id, nome: r.alimento_nome ?? r.descricao, base_quantidade_g: r.quantidade_g ?? 1 } })))
  const [buscando, setBuscando] = useState(!anteriores?.length)
  const [filtro, setFiltro] = useState<FiltroAlimentos>('todos')
  const [tipo, setTipo] = useState('')
  const [busca, setBusca] = useState('')
  const [escolha, setEscolha] = useState<{ alimento: Alimento; chave?: string }>()
  const [quantidade, setQuantidade] = useState('100')
  const [erro, setErro] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [atualizado, setAtualizado] = useState(false)
  const [confirmarExclusao, setConfirmarExclusao] = useState(false)
  const [confirmarDescarte, setConfirmarDescarte] = useState(false)
  const inicio = useRef(JSON.stringify({ refeicao, itens }))
  const pessoais = useLiveQuery(() => repositorio('alimentos_favoritos').listar(), [], [])
  const config = useLiveQuery(async () => (await repositorio('configuracoes').listar()).find(c => c.chave === 'principal'))
  const opcoes = useMemo<Alimento[]>(() => [
    ...pessoais.filter(a => a.base_quantidade_g).map(a => ({ ...a, id: `pessoal:${a.id}`, alimento_id: a.id, nome: nomeAlimento(a), base_quantidade_g: a.base_quantidade_g! })),
    ...alimentosComuns.filter(a => !config?.alimentos_comuns_ocultos?.includes(a.id)),
  ].map(a => a as Alimento).filter(a => (filtro !== 'meus' || !!a.alimento_id) && (filtro !== 'tipo' || !tipo || tipoAlimento(a) === tipo) && !itens.some(i => i.alimento.id === a.id || (a.alimento_id && i.alimento.alimento_id === a.alimento_id)) && buscaNormal(a.nome).includes(buscaNormal(busca))), [pessoais, config, itens, busca, filtro, tipo])
  const calculados = itens.map(i => ({ ...i, nutrientes: calcularPorcao(i.alimento, i.alimento.base_quantidade_g, i.quantidade) }))
  const kcal = calculados.reduce((s, i) => s + i.nutrientes.kcal, 0)
  const gramas = lerGramas(quantidade)
  const previa = escolha && Number.isFinite(gramas) && gramas > 0 && gramas <= 20000 ? calcularPorcao(escolha.alimento, escolha.alimento.base_quantidade_g, gramas) : null

  function escolher(alimento: Alimento, chave?: string, inicial = alimento.base_quantidade_g) {
    setEscolha({ alimento, chave }); setQuantidade(String(inicial)); setErro(''); setAtualizado(false)
  }
  function solicitarFechamento() {
    if (travaSalvar.current) return
    if (JSON.stringify({ refeicao, itens }) !== inicio.current) setConfirmarDescarte(true)
    else fechar()
  }
  async function salvar() {
    if (travaSalvar.current || (!itens.length && !anteriores?.length)) return
    travaSalvar.current = true
    setSalvando(true); setErro('')
    try {
      const horario = new Date().toTimeString().slice(0, 5)
      const registros = calculados.map(i => {
        const r: RefeicaoDia = { ...(i.original ?? criarRegistro()), data, refeicao, horario: i.original?.horario ?? horario,
          kcal: i.nutrientes.kcal, descricao: i.alimento.nome, alimento_nome: i.alimento.nome, precisao: i.original?.precisao ?? (i.alimento.alimento_id ? 'exato' : 'estimado'), quantidade_g: i.quantidade }
        for (const c of campos) { delete r[c]; if (i.nutrientes[c] !== undefined) r[c] = i.nutrientes[c] }
        r.kcal = i.nutrientes.kcal
        if (i.original && i.original.quantidade_g === undefined) delete r.quantidade_g
        if (i.alimento.alimento_id) r.alimento_id = i.alimento.alimento_id
        return r
      })
      await salvarRefeicaoCompleta(registros, anteriores)
      fechar()
    } catch (e) { setErro(e instanceof Error ? e.message : 'Não foi possível salvar. Sua refeição continua aqui.') }
    finally { travaSalvar.current = false; setSalvando(false) }
  }
  if (suspenso) return null
  return <>
    {!buscando && !escolha && !confirmarExclusao && !confirmarDescarte && <Painel titulo={anteriores ? 'Editar refeição' : 'Montar refeição'} fechar={() => { if (!travaSalvar.current) setBuscando(true) }} acao={<button type="submit" form={id} className="botao-principal salvar-cabecalho" disabled={salvando || (!itens.length && !anteriores?.length)}>{salvando ? 'Salvando…' : 'Salvar'}</button>}>
      <form id={id} className="formulario comida-formulario refeicao-editor" onSubmit={e => { e.preventDefault(); if (!itens.length && anteriores?.length) setConfirmarExclusao(true); else void salvar() }}>
        <label>Refeição<select disabled={salvando} value={refeicao} onChange={e => setRefeicao(e.target.value)}>{[...new Set([...grupos, refeicao])].map(g => <option key={g}>{g}</option>)}</select></label>
        <section className="refeicao-lista" aria-label="Alimentos da refeição">
          {!itens.length && <p className="comida-base">Escolha os alimentos e informe quanto comeu.</p>}
          {calculados.map(i => <div className="refeicao-linha" key={i.chave}><button type="button" disabled={salvando || (i.original !== undefined && i.original.quantidade_g === undefined)} className="refeicao-quantidade" onClick={() => escolher(i.alimento, i.chave, i.quantidade)}><strong>{i.alimento.nome}</strong><span>{i.original && i.original.quantidade_g === undefined ? 'Porção registrada' : `${numero(i.quantidade)} g`} · {numero(i.nutrientes.kcal)} kcal</span></button><button type="button" className="botao-secundario excluir-historico" disabled={salvando} aria-label={`Retirar ${i.alimento.nome}`} onClick={() => setItens(atual => atual.filter(a => a.chave !== i.chave))}><Trash2 size={17} /></button></div>)}
        </section>
        <button type="button" className="botao-secundario" disabled={salvando} onClick={() => { setBusca(''); setBuscando(true) }}><Plus size={17} />{itens.length ? 'Adicionar outro alimento' : 'Escolher alimentos'}</button>
        <div className="refeicao-total" aria-live="polite"><span>Total da refeição · {itens.length} {itens.length === 1 ? 'alimento' : 'alimentos'}</span><strong>{numero(kcal)} kcal</strong></div>
        {erro && <p className="erro" role="alert">{erro}</p>}
      </form>
    </Painel>}
    {confirmarDescarte && <Painel titulo="Descartar alterações?" centralizado fechar={() => setConfirmarDescarte(false)}><div className="formulario"><p>As alterações desta refeição ainda não foram salvas. Deseja sair sem salvar?</p><button type="button" className="botao-principal" onClick={() => setConfirmarDescarte(false)}>Continuar editando</button><button type="button" className="botao-secundario excluir-historico" onClick={fechar}>Descartar alterações</button></div></Painel>}
    {confirmarExclusao && <Painel titulo="Excluir refeição" centralizado fechar={() => { if (!salvando) setConfirmarExclusao(false) }}><div className="formulario"><p>Você retirou todos os alimentos. Excluir esta refeição do diário?</p><button type="button" className="botao-secundario" disabled={salvando} onClick={() => setConfirmarExclusao(false)}>Voltar</button><button type="button" className="botao-secundario excluir-historico" disabled={salvando} onClick={() => void salvar()}>Excluir refeição</button>{erro && <p role="alert" className="erro">{erro}</p>}</div></Painel>}
    {buscando && !escolha && !confirmarDescarte && !confirmarExclusao && <Painel titulo="Adicionar alimento" fechar={solicitarFechamento} acao={<button type="button" className="botao-principal salvar-cabecalho" disabled={salvando || (!itens.length && !anteriores?.length)} onClick={() => { if (!itens.length && anteriores?.length) setConfirmarExclusao(true); else void salvar() }}>{salvando ? 'Salvando…' : 'Salvar'}</button>}><div className="formulario comida-formulario">
      <FiltrosAlimentos filtro={filtro} definirFiltro={setFiltro} tipo={tipo} definirTipo={setTipo} />
      <label>Buscar alimento<input ref={buscaRef} type="search" value={busca} onChange={e => setBusca(e.target.value)} placeholder="Nome ou marca" /></label>
      <div className="comida-resultados">{opcoes.slice(0, 12).map(a => <button type="button" className="botao-secundario comida-resultado" key={a.id} onClick={() => escolher(a)}><span><strong>{a.nome}</strong><small>{numero(a.kcal)} kcal por {numero(a.base_quantidade_g)} g</small></span><Plus size={17} /></button>)}</div>
      {!opcoes.length && <p className="comida-base">Nenhum alimento encontrado. Os que já estão na refeição ficam na lista anterior.</p>}
      {opcoes.length > 12 && <p className="comida-base">Digite para encontrar entre {opcoes.length} alimentos.</p>}
      <button type="button" className="botao-secundario" onClick={cadastrar}><Plus size={17} />Cadastrar um alimento</button>
      {itens.length > 0 && <button type="button" className="botao-secundario" onClick={() => setBuscando(false)}>Ver refeição · {itens.length} {itens.length === 1 ? 'item' : 'itens'} · {numero(kcal)} kcal</button>}
    </div></Painel>}
    {escolha && <Painel titulo={escolha.alimento.nome} fechar={() => { setEscolha(undefined); setErro('') }} acao={<button type="button" className="botao-principal salvar-cabecalho" disabled={!previa} onClick={() => {
      if (!previa) return
      setItens(atual => escolha.chave ? atual.map(i => i.chave === escolha.chave ? { ...i, alimento: escolha.alimento, quantidade: gramas } : i) : [...atual, { chave: criarRegistro().id, alimento: escolha.alimento, quantidade: gramas }])
      setEscolha(undefined); setErro(''); setBusca('')
      requestAnimationFrame(() => buscaRef.current?.closest('.conteudo-modal')?.scrollTo({ top: 0, behavior: 'instant' }))
    }}>{escolha.chave ? 'Salvar' : 'Adicionar'}</button>}><div className="formulario comida-formulario">
      <label>Quantidade consumida (g)<input autoFocus inputMode="decimal" value={quantidade} onFocus={e => e.target.select()} onChange={e => setQuantidade(e.target.value)} /></label>
      {previa ? <div className="comida-calculada"><strong>{numero(previa.kcal)} kcal</strong>{campos.filter(c => c !== 'kcal').map(c => <span key={c}>{({ proteina_g: 'Proteína', carbo_g: 'Carboidratos', gordura_g: 'Gorduras totais', fibra_g: 'Fibras', sodio_mg: 'Sódio', acucares_g: 'Açúcares totais' })[c as Exclude<typeof c, 'kcal'>]}: {previa[c] === undefined ? '—' : `${numero(previa[c]!)} ${c === 'sodio_mg' ? 'mg' : 'g'}`}</span>)}</div> : <p className="erro">Informe uma quantidade maior que zero e até 20.000 g.</p>}
      {escolha.chave && escolha.alimento.alimento_id && <button type="button" className="botao-secundario" onClick={async () => {
        try {
          const a = await repositorio('alimentos_favoritos').obter(escolha.alimento.alimento_id!)
          if (!a || a.apagado_em || a.eliminado_em || !a.base_quantidade_g) throw new Error('Cadastro indisponível. Os valores antigos foram mantidos.')
          setEscolha({ ...escolha, alimento: { ...a, id: `pessoal:${a.id}`, alimento_id: a.id, nome: nomeAlimento(a), base_quantidade_g: a.base_quantidade_g } }); setAtualizado(true); setErro('')
        } catch (e) { setErro(e instanceof Error ? e.message : 'Não foi possível consultar o cadastro.') }
      }}>Atualizar com os dados atuais do alimento</button>}
      {atualizado && <p role="status" className="comida-base">Prévia atualizada. Confirme aqui e salve a refeição para gravar.</p>}
      {erro && <p className="erro" role="alert">{erro}</p>}
    </div></Painel>}
  </>
}
