import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { banco, tabela } from '../dados/banco'
import { criarRegistro, repositorio } from '../dados/repositorio'
import { adicionarExercicio, concluirSerie, ultimasSeries } from '../dados/treinos'
import { salvarFicha } from '../dados/fichas'
import type { Exercicio, SerieTreino } from '../dados/modelos'
import { cargaTotal, validarSerie, volumeSeries } from '../utilitarios/treino'
import { Descanso } from '../componentes/Descanso'
import { Serie } from '../componentes/Serie'
import { ResumoTreino } from '../componentes/ResumoTreino'
import { AjudaExercicio } from '../componentes/AjudaExercicio'
import { EditorExercicio } from '../componentes/EditorExercicio'
import { useTelaLigada } from '../hooks/useTelaLigada'

export function ModoTreino({ id, online, fechar }: { id: string; online: boolean; fechar: () => void }) {
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
  }} />
  return <>
    <div className="painel"><h2>{treino.titulo ?? 'Treino livre'}</h2><p>{series.filter(s => s.concluida_em).length} de {series.length} séries concluídas</p><button className="botao-secundario" onClick={() => void tela.manter()}>{tela.estado}</button><small>Salvo neste aparelho. Você pode sair e continuar depois.</small></div>
    {erro && <p role="alert" className="erro">{erro}</p>}
    {removido && <button className="botao-secundario" disabled={ocupado} onClick={() => void executar(async () => { await removido.desfazer(); definirRemovido(null) })}>Desfazer remoção do exercício</button>}
    <Descanso fim={treino.descanso_fim} alterar={fim => void executar(() => atualizarDescanso(fim))} />
    {itens.map((item, indice) => {
      const ex = exercicios.find(e => e.id === item.exercicio_id)
      const grupo = series.filter(s => s.exercicio_id === item.exercicio_id)
      return <section className="exercicio-treino" key={item.id}><h2>{item.nome}</h2><Desempenho exercicioId={item.exercicio_id} />
        {ex && <><p className="nota-fixa">{ex.nota_fixa || 'Adicione uma nota fixa na ajuda do exercício.'}</p><button className="botao-secundario" onClick={() => definirAjuda(ex)}>Como fazer ? · editar nota</button></>}
        <label className="formulario">Descanso deste exercício (s)<input type="number" inputMode="numeric" min="0" max="1800" value={item.descanso_segundos} onChange={e => { const valor = Number(e.target.value); if (Number.isFinite(valor) && valor >= 0 && valor <= 1800) void executar(async () => { await tabela('treino_exercicios').update(item.id, { descanso_segundos: valor, atualizado_em: new Date().toISOString() }) }) }} /></label>
        {grupo.map((s, i) => <Serie key={`${s.id}-${s.concluida_em ?? 'pendente'}`} serie={s} destaque={s.id === proxima?.id} anterior={grupo[i - 1]} salvar={salvarSerie} concluir={async dados => { void tela.manter(); await concluirSerie(dados) }} desfazer={async () => {
          await banco.transaction('rw', tabela('series_treino'), tabela('treinos'), async () => { await tabela('series_treino').update(s.id, { concluida_em: undefined, atualizado_em: new Date().toISOString() }); await atualizarDescanso(null) })
        }} />)}
        {grupo.length > 0 && grupo.every(s => s.concluida_em) && <p className="nota">Exercício concluído. {itens[indice + 1] ? `Próximo: ${itens[indice + 1].nome}` : 'Você pode finalizar o treino.'}</p>}
        <div className="acoes"><button disabled={ocupado} onClick={() => void executar(async () => {
          const ultima = grupo.at(-1)
          if (ultima) await tabela('series_treino').add({ ...ultima, ...criarRegistro(treino.user_id), concluida_em: undefined, recorde: false, numero_serie: Math.max(0, ...grupo.map(s => s.numero_serie)) + 1 })
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
      </section>
    })}
    <details className="painel"><summary>Adicionar exercício só neste treino</summary><div className="formulario"><label>Buscar<input type="search" value={busca} onChange={e => definirBusca(e.target.value)} /></label><div className="seletor-exercicios">{exercicios.filter(ex => ex.tipo === 'forca' && !itens.some(i => i.exercicio_id === ex.id) && ex.nome.toLocaleLowerCase('pt-BR').includes(busca.toLocaleLowerCase('pt-BR'))).map(ex => <button disabled={ocupado} key={ex.id} onClick={() => void executar(() => adicionarExercicio(treino, ex))}>{ex.nome}</button>)}</div></div></details>
    <label className="formulario">Observação do treino<textarea value={treino.observacao} onChange={e => { const observacao = e.target.value; void executar(async () => { await tabela('treinos').update(id, { observacao, atualizado_em: new Date().toISOString() }) }) }} /></label>
    {!treino.ficha_id && <details className="painel"><summary>Salvar planejamento como ficha</summary><div className="formulario"><label>Nome<input value={nomeFicha} onChange={e => definirNomeFicha(e.target.value)} /></label><button className="botao-secundario" disabled={ocupado} onClick={() => void executar(async () => {
      const nova = { ...criarRegistro(treino.user_id), nome: nomeFicha, ordem: Date.now() }
      await salvarFicha(nova, itens.map((item, ordem) => ({ ...criarRegistro(treino.user_id), ficha_id: nova.id, exercicio_id: item.exercicio_id, ordem, series_planejadas: series.filter(s => s.exercicio_id === item.exercicio_id).length, descanso_segundos: item.descanso_segundos })))
      await tabela('treinos').update(id, { ficha_id: nova.id, atualizado_em: new Date().toISOString() })
    })}>Salvar ficha</button></div></details>}
    <button className="botao-principal largura-total" onClick={() => definirResumo(true)}>Ver resumo e finalizar</button><button className="botao-secundario" onClick={fechar}>Voltar · continuar depois</button>
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
