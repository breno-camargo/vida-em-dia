import { ListaExercicios } from '../componentes/ListaExercicios'
import { useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { banco, tabela } from '../dados/banco'
import { criarRegistro, repositorio } from '../dados/repositorio'
import { adicionarExercicio, concluirSerie, ultimasSeries, aplicarValoresProximas } from '../dados/treinos'
import { salvarFicha } from '../dados/fichas'
import type { Exercicio, SerieTreino } from '../dados/modelos'
import { cargaTotal, validarSerie, volumeSeries } from '../utilitarios/treino'
import { Descanso } from '../componentes/Descanso'
import { Serie } from '../componentes/Serie'
import { ResumoTreino } from '../componentes/ResumoTreino'
import { AjudaExercicio } from '../componentes/AjudaExercicio'
import { EditorExercicio } from '../componentes/EditorExercicio'
import { useTelaLigada } from '../hooks/useTelaLigada'
import { MiniaturaExercicio } from '../componentes/MiniaturaExercicio'
import { ChevronDown, Plus, ClipboardPlus } from 'lucide-react'
import { SelecionarDescanso } from '../componentes/SelecionarDescanso'
import { Painel } from '../componentes/Painel'

export function ModoTreino({ id, online, fechar }: { id: string; online: boolean; fechar: () => void }) {
  const cards = useRef(new Map<string, HTMLDetailsElement>())
  const treino = useLiveQuery(() => tabela('treinos').get(id), [id])
  const itens = useLiveQuery(() => tabela('treino_exercicios').where('treino_id').equals(id).filter(e => !e.apagado_em).sortBy('ordem'), [id])
  const series = useLiveQuery(() => tabela('series_treino').where('treino_id').equals(id).filter(s => !s.apagado_em).sortBy('numero_serie'), [id])
  const exercicios = useLiveQuery(() => repositorio('exercicios').listar())
  const peso = useLiveQuery(() => tabela('medidas_corporais').filter(m => !m.apagado_em && Boolean(m.peso)).sortBy('data').then(m => m.at(-1)?.peso))
  const comparacao = useLiveQuery(async () => {
    if (!treino?.ficha_id) return undefined
    const anteriores = await tabela('treinos').where('ficha_id').equals(treino.ficha_id).filter(t => Boolean(t.fim) && !t.apagado_em && t.id !== id).sortBy('inicio')
    const ultimo = anteriores.at(-1)
    return ultimo ? { volume: volumeSeries(await tabela('series_treino').where('treino_id').equals(ultimo.id).toArray()) } : undefined
  }, [treino?.ficha_id, id])
  const [resumo, definirResumo] = useState(false)
  const [perguntarFinalizacao, definirPerguntarFinalizacao] = useState(false)
  const [ajuda, definirAjuda] = useState<Exercicio | null>(null)
  const [edicao, definirEdicao] = useState<Exercicio | null>(null)
  const [busca, definirBusca] = useState('')
  const [erro, definirErro] = useState('')
  const [ocupado, definirOcupado] = useState(false)
  const [removido, definirRemovido] = useState<{ desfazer: () => Promise<void> } | null>(null)
  const [nomeFicha, definirNomeFicha] = useState('')
  const tela = useTelaLigada()
  const executar = async (acao: () => Promise<void>) => {
    definirErro(''); definirOcupado(true)
    try { await acao() } catch (error) { definirErro(error instanceof Error ? error.message : 'Não foi possível salvar. Tente novamente.') }
    finally { definirOcupado(false) }
  }
  const salvarSerie = async (dados: SerieTreino) => {
    if (dados.concluida_em) validarSerie(dados)
    await banco.transaction('rw', tabela('series_treino'), tabela('treinos'), async () => {
      const atual = await tabela('series_treino').get(dados.id)
      const sessao = await tabela('treinos').get(id)
      if (!atual || atual.apagado_em || sessao?.fim || (atual.concluida_em && !dados.concluida_em)) return
      await repositorio('series_treino').salvar({ ...dados, peso_total: cargaTotal(dados.peso_digitado, dados.modo_carga, dados.peso_barra) })
    })
  }
  if (!treino || !itens || !series || !exercicios) return <p role="status">Carregando treino salvo…</p>
  const proxima = itens.flatMap(item => series.filter(s => s.exercicio_id === item.exercicio_id)).find(s => !s.concluida_em)
  const atualizarDescanso = async (fim: string | null) => { await tabela('treinos').update(id, { descanso_fim: fim, atualizado_em: new Date().toISOString() }) }
  if (resumo || treino.fim) return <ResumoTreino treino={treino} series={series} anterior={comparacao} pesoInicial={peso} fechar={fechar} voltar={() => definirResumo(false)} finalizar={async (peso_corporal, calorias) => {
    if (proxima && !window.confirm('Ainda existem séries pendentes. Finalizar somente com as séries concluídas?')) return
    const fim = new Date().toISOString()
    await tabela('treinos').update(id, { fim, duracao_minutos: Math.round((Date.parse(fim) - Date.parse(treino.inicio)) / 60000), calorias, peso_corporal, descanso_fim: null, atualizado_em: fim })
    tela.parar()
    fechar()
    window.scrollTo({ top: 0 })
  }} />
  return <>
    <div className="painel"><h2>{treino.titulo ?? 'Treino livre'}</h2><p>{series.filter(s => s.concluida_em).length} de {series.length} séries concluídas</p><button className="botao-secundario" onClick={() => void tela.manter()}>{tela.estado}</button><small>Salvo neste aparelho. Você pode sair e continuar depois.</small></div>
    {erro && <p role="alert" className="erro">{erro}</p>}
    {removido && <button className="botao-secundario" disabled={ocupado} onClick={() => void executar(async () => { await removido.desfazer(); definirRemovido(null) })}>Desfazer remoção</button>}
    <Descanso fim={treino.descanso_fim} alterar={fim => void executar(() => atualizarDescanso(fim))} />
    {itens.map((item, indice) => {
      const ex = exercicios.find(e => e.id === item.exercicio_id)
      const grupo = series.filter(s => s.exercicio_id === item.exercicio_id)
      const feitas = grupo.filter(s => s.concluida_em).length
      const resumoReps = [...new Set(grupo.map(s => s.repeticoes))]
      const resumoCargas = [...new Set(grupo.map(s => s.peso_total))]
      return <details className="exercicio-treino exercicio-recolhivel" key={item.id} ref={elemento => { if (elemento) cards.current.set(item.id, elemento); else cards.current.delete(item.id) }}>
        <summary className="cabecalho-exercicio"><MiniaturaExercicio id={item.exercicio_id} nome={item.nome} abrir={ex ? () => definirAjuda(ex) : undefined} /><span className="resumo-exercicio"><strong>{item.nome}</strong><small>{grupo.length} séries · {resumoReps.length === 1 ? resumoReps[0] : 'várias'} reps · {resumoCargas.length === 1 ? `${resumoCargas[0]} kg` : 'cargas variadas'}</small><small>{feitas}/{grupo.length} concluídas{proxima?.exercicio_id === item.exercicio_id ? ' · Próximo exercício' : ''}</small></span><ChevronDown className="seta-exercicio" size={20} aria-hidden="true" /></summary>
        <div className="conteudo-exercicio"><Desempenho exercicioId={item.exercicio_id} />
        {ex && <><p className="nota-fixa">{ex.nota_fixa || 'Adicione uma nota fixa na ajuda do exercício.'}</p><button className="botao-secundario" onClick={() => definirAjuda(ex)}>Como fazer ? · editar nota</button></>}
        <SelecionarDescanso valor={item.descanso_segundos} confirmar={async descanso_segundos => { await tabela('treino_exercicios').update(item.id, { descanso_segundos, atualizado_em: new Date().toISOString() }) }} />
        <div className="cabecalho-series" aria-hidden="true"><span>SÉRIE</span><span>REPS</span><span>KG</span><span>FEITO</span></div>
        {grupo.map((s, i) => <Serie key={`${s.id}-${s.concluida_em ?? 'pendente'}`} serie={s} destaque={s.id === proxima?.id} anterior={grupo[i - 1]} salvar={salvarSerie} concluir={async dados => {
          void tela.manter(); await concluirSerie(dados)
          const pendentes = await tabela('series_treino').where('[treino_id+exercicio_id]').equals([id, item.exercicio_id]).filter(serie => !serie.apagado_em && !serie.concluida_em).count()
          const card = cards.current.get(item.id)
          if (pendentes === 0 && card) card.open = false
          const pendentesTreino = await tabela('series_treino').where('treino_id').equals(id).filter(serie => !serie.apagado_em && !serie.concluida_em).toArray()
          if (pendentesTreino.length === 0) definirPerguntarFinalizacao(true)
          else if (pendentes === 0) {
            const ordem = [...itens.slice(indice + 1), ...itens.slice(0, indice)]
            const seguinte = ordem.find(exercicio => pendentesTreino.some(serie => serie.exercicio_id === exercicio.exercicio_id))
            const proximoCard = seguinte && cards.current.get(seguinte.id)
            if (proximoCard) {
              proximoCard.open = true
              proximoCard.scrollIntoView({ block: 'start', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })
            }
          }
        }} desfazer={async () => {
          await banco.transaction('rw', tabela('series_treino'), tabela('treinos'), async () => { await tabela('series_treino').update(s.id, { concluida_em: undefined, atualizado_em: new Date().toISOString() }); await atualizarDescanso(null) })
        }} aplicarProximas={aplicarValoresProximas} remover={async () => {
          await banco.transaction('rw', tabela('series_treino'), tabela('treinos'), async () => { await repositorio('series_treino').apagar(s.id); await atualizarDescanso(null) })
          definirRemovido({ desfazer: async () => { await repositorio('series_treino').salvar(s) } })
        }} />)}
        {grupo.length > 0 && grupo.every(s => s.concluida_em) && <p className="nota">Exercício concluído. {itens[indice + 1] ? `Próximo: ${itens[indice + 1].nome}` : 'Você pode finalizar o treino.'}</p>}
        <div className="acoes"><button disabled={ocupado} onClick={() => void executar(async () => {
          const ultima = grupo.at(-1) ?? { ...criarRegistro(treino.user_id), treino_id: id, exercicio_id: item.exercicio_id, numero_serie: 0, tipo: 'normal' as const, peso_digitado: 0, peso_total: 0, repeticoes: 10, recorde: false, modo_carga: ex?.modo_carga ?? 'total', peso_barra: ex?.peso_barra ?? 20 }
          const anteriores = await tabela('series_treino').where('[treino_id+exercicio_id]').equals([id, item.exercicio_id]).toArray()
          await tabela('series_treino').add({ ...ultima, ...criarRegistro(treino.user_id), concluida_em: undefined, recorde: false, numero_serie: Math.max(0, ...anteriores.map(s => s.numero_serie)) + 1 })
        })}>Série extra</button><button disabled={ocupado || indice === 0} onClick={() => void executar(async () => {
          const outro = itens[indice - 1]
          await banco.transaction('rw', tabela('treino_exercicios'), async () => {
            await tabela('treino_exercicios').update(item.id, { ordem: outro.ordem, atualizado_em: new Date().toISOString() })
            await tabela('treino_exercicios').update(outro.id, { ordem: item.ordem, atualizado_em: new Date().toISOString() })
          })
        })}>Subir exercício</button><button disabled={ocupado} onClick={() => void executar(async () => {
          const agora = new Date().toISOString()
          await banco.transaction('rw', tabela('treino_exercicios'), tabela('series_treino'), tabela('treinos'), async () => {
            await tabela('treino_exercicios').update(item.id, { apagado_em: agora, atualizado_em: agora })
            await tabela('series_treino').bulkPut(grupo.map(s => ({ ...s, apagado_em: agora, atualizado_em: agora })))
            await atualizarDescanso(null)
          })
          definirRemovido({ desfazer: async () => { await banco.transaction('rw', tabela('treino_exercicios'), tabela('series_treino'), async () => {
            const repetido = await tabela('treino_exercicios').where('treino_id').equals(id).filter(e => !e.apagado_em && e.exercicio_id === item.exercicio_id).first()
            if (repetido) throw new Error('Retire o exercício adicionado novamente antes de desfazer a remoção.')
            await tabela('treino_exercicios').put({ ...item, atualizado_em: new Date().toISOString() }); await tabela('series_treino').bulkPut(grupo.map(s => ({ ...s, atualizado_em: new Date().toISOString() })))
          }) } })
        })}>Remover do dia</button></div>
        </div>
      </details>
    })}
    <details className="acao-treino"><summary><span className="icone-acao"><Plus size={20} /></span><span>Adicionar exercício<small>Somente neste treino</small></span><ChevronDown size={18} className="seta-acao" /></summary><div className="formulario"><label>Buscar<input type="search" value={busca} onChange={e => definirBusca(e.target.value)} /></label><ListaExercicios exercicios={exercicios.filter(ex => ex.tipo === 'forca' && !itens.some(i => i.exercicio_id === ex.id))} busca={busca} ocupado={ocupado} adicionar={ex => void executar(() => adicionarExercicio(treino, ex))} /></div></details>
    <div className="observacao-treino formulario"><label>Observação do treino <span className="opcional">Opcional</span><textarea placeholder="Como foi seu treino?" value={treino.observacao} onChange={e => { const observacao = e.target.value; void executar(async () => { await tabela('treinos').update(id, { observacao, atualizado_em: new Date().toISOString() }) }) }} /></label></div>
    {!treino.ficha_id && <details className="acao-treino"><summary><span className="icone-acao"><ClipboardPlus size={20} /></span><span>Salvar como ficha<small>Reutilize este planejamento</small></span><ChevronDown size={18} className="seta-acao" /></summary><div className="formulario"><label>Nome<input value={nomeFicha} onChange={e => definirNomeFicha(e.target.value)} /></label><button className="botao-secundario" disabled={ocupado} onClick={() => void executar(async () => {
      const nova = { ...criarRegistro(treino.user_id), nome: nomeFicha, ordem: Date.now() }
      await salvarFicha(nova, itens.map((item, ordem) => ({ ...criarRegistro(treino.user_id), ficha_id: nova.id, exercicio_id: item.exercicio_id, ordem, series_planejadas: series.filter(s => s.exercicio_id === item.exercicio_id).length, descanso_segundos: item.descanso_segundos })))
      await tabela('treinos').update(id, { ficha_id: nova.id, atualizado_em: new Date().toISOString() })
    })}>Salvar ficha</button></div></details>}
    <div className="finalizar-acoes"><button className="botao-principal" onClick={() => definirResumo(true)}>Ver resumo e finalizar</button><button className="botao-secundario" onClick={fechar}>Voltar · continuar depois</button></div>
    {perguntarFinalizacao && <Painel centralizado titulo="Todas as séries concluídas!" fechar={() => definirPerguntarFinalizacao(false)}><p className="subtitulo-seletor">Você concluiu todos os exercícios. Quer finalizar o treino?</p><button type="button" className="botao-principal largura-total" onClick={() => { definirPerguntarFinalizacao(false); definirResumo(true) }}>Ver resumo e finalizar</button><button type="button" className="botao-secundario" onClick={() => definirPerguntarFinalizacao(false)}>Continuar treino</button></Painel>}
    {ajuda && <AjudaExercicio exercicio={ajuda} online={online} fechar={() => definirAjuda(null)} editar={() => { definirEdicao(ajuda); definirAjuda(null) }} />}
    {edicao && <EditorExercicio exercicio={edicao} fechar={() => definirEdicao(null)} />}
  </>
}
function Desempenho({ exercicioId }: { exercicioId: string }) {
  const dados = useLiveQuery(async () => {
    const ultimas = await ultimasSeries(exercicioId)
    const todas = await tabela('series_treino').where('exercicio_id').equals(exercicioId).filter(s => Boolean(s.concluida_em) && !s.apagado_em && s.tipo !== 'aquecimento').toArray()
    return { ultimas, melhor: Math.max(0, ...todas.map(s => s.peso_total)) }
  }, [exercicioId])
  return <small className="ultimo-desempenho">{dados?.ultimas.length ? `Último: ${dados.ultimas.map(s => `${s.repeticoes} reps @ ${s.peso_total} kg`).join(' · ')} | Melhor carga: ${dados.melhor} kg` : 'Primeira sessão · preencha peso e repetições'}</small>
}



