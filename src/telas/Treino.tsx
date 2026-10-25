import { useConfirmacao } from '../hooks/useConfirmacao'
import { TransicaoConteudo } from '../componentes/TransicaoConteudo'
import { RevisarDuplicatas } from '../componentes/RevisarDuplicatas'
import { useEstadoTemporario } from '../hooks/useEstadoTemporario'
import { exerciciosUnicos } from '../dados/duplicatasExercicios'
import { Cardio } from './Cardio'
import { MiniaturaExercicio } from '../componentes/MiniaturaExercicio'
import { useEffect, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { banco, tabela } from '../dados/banco'
import { criarRegistro, repositorio } from '../dados/repositorio'
import { formatarNomeFicha, apagarFicha, duplicarFicha } from '../dados/fichas'
import type { Exercicio, Ficha, FichaExercicio } from '../dados/modelos'
import { EditorExercicio } from '../componentes/EditorExercicio'
import { EditorFicha } from '../componentes/EditorFicha'
import { AjudaExercicio } from '../componentes/AjudaExercicio'
import { iniciarTreino, treinoAtivo, treinoSemAtividade, descartarTreinoLivreVazio } from '../dados/treinos'
import { ModoTreino } from './ModoTreino'
import { Ellipsis, Play, Plus, ArrowRight, Dumbbell, Image } from 'lucide-react'
import { Painel } from '../componentes/Painel'
import { useFiltroExercicios } from '../componentes/FiltrosExercicios'
import { ampliarBiblioteca } from '../dados/biblioteca'
import { CompartilharUltimo } from '../componentes/CompartilharUltimo'


export function Treino({ online }: { online: boolean }) {
 const { confirmar, dialogo } = useConfirmacao()
  const exercicios = useLiveQuery(() => repositorio('exercicios').listar().then(itens => itens.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))))
  const fichas = useLiveQuery(() => repositorio('fichas').listar().then(itens => itens.sort((a, b) => a.ordem - b.ordem)))
  const ativo = useLiveQuery(treinoAtivo)
  const progressoAtivo = useLiveQuery(async () => {
    if (!ativo) return undefined
    const [series, itens, cardio] = await Promise.all([
      tabela('series_treino').where('treino_id').equals(ativo.id).filter(s => !s.apagado_em).toArray(),
      tabela('treino_exercicios').where('treino_id').equals(ativo.id).filter(i => !i.apagado_em && i.tipo === 'cardio').toArray(),
      tabela('cardio_sessoes').where('treino_id').equals(ativo.id).filter(c => !c.apagado_em).toArray(),
    ])
    return { feitas: series.filter(s => s.concluida_em).length, total: series.length,
      cardioFeito: itens.filter(i => cardio.some(c => c.exercicio_id === i.exercicio_id)).length, cardioTotal: itens.length }
  }, [ativo?.id])
  const ultimoFinalizado = useLiveQuery(() => tabela('treinos').filter(t => !!t.fim && !t.apagado_em).sortBy('fim').then(t => t.at(-1)))
  const [cardFinalizado, definirCardFinalizado] = useState<string | null>(null)
  const planejamento = useLiveQuery(() => repositorio('ficha_exercicios').listar())
  const [sessao, definirSessao] = useState<string | null>(null)
  const [abrirResumo, definirAbrirResumo] = useState(false)
  const [novoPedido, definirNovoPedido] = useState<{ fichaId?: string } | null>(null)
  const [secao, definirSecao] = useState<'fichas' | 'biblioteca' | 'cardio'>('fichas')
  const [busca, definirBusca] = useState('')
  const [paginaFichas, definirPaginaFichas] = useState(0)
  const [avisoCatalogo, definirAvisoCatalogo] = useState('')
  const [carregandoCatalogo, definirCarregandoCatalogo] = useState(true)
  const [edicao, definirEdicao] = useState<Exercicio | null>(null)
  const [ajuda, definirAjuda] = useState<Exercicio | null>(null)
  const [ficha, definirFicha] = useState<{ dados: Ficha; itens: FichaExercicio[] } | null>(null)
  const [erro, definirErro] = useState('')
  const [ocupado, definirOcupado] = useState(false)
  const [desfazer, definirDesfazer] = useEstadoTemporario<{ texto: string; executar: () => Promise<void> } | null>(null)
  useEffect(() => {
    let ativa = true
    void ampliarBiblioteca().catch(() => {
      if (ativa) definirErro('Não foi possível carregar o catálogo completo. Tente novamente em Exercícios → Ampliar catálogo.')
    }).finally(() => { if (ativa) definirCarregandoCatalogo(false) })
    return () => { ativa = false }
  }, [])
  const executar = async (acao: () => Promise<void>) => {
    definirErro(''); definirOcupado(true)
    try { await acao() } catch (error) { definirErro(error instanceof Error ? error.message : 'Não foi possível concluir. Confira o armazenamento do aparelho.') }
    finally { definirOcupado(false) }
  }
  const iniciar = async (fichaId?: string) => {
    const atual = await treinoAtivo()
    if (atual && atual.ficha_id !== fichaId && !await treinoSemAtividade(atual)) { definirNovoPedido({ fichaId }); return }
    definirAbrirResumo(false)
    definirSessao(await iniciarTreino(fichaId))
  }
  const editarFicha = async (dados: Ficha) => {
    const itens = await tabela('ficha_exercicios').where('ficha_id').equals(dados.id).filter(item => !item.apagado_em).sortBy('ordem')
    definirFicha({ dados, itens })
  }
  const removerFicha = async (dados: Ficha) => {
    const itens = await tabela('ficha_exercicios').where('ficha_id').equals(dados.id).filter(item => !item.apagado_em).toArray()
    await apagarFicha(dados.id)
    definirDesfazer({ texto: 'Ficha removida.', executar: async () => {
      await banco.transaction('rw', tabela('fichas'), tabela('ficha_exercicios'), async () => {
        await repositorio('fichas').salvar({ ...dados, apagado_em: null })
        await tabela('ficha_exercicios').bulkPut(itens.map(item => ({ ...item, atualizado_em: new Date().toISOString(), apagado_em: null })))
      })
    } })
  }
  const moverFicha = async (indice: number, direcao: number) => {
    if (!fichas) return
    const ordenadas = [...fichas]; [ordenadas[indice], ordenadas[indice + direcao]] = [ordenadas[indice + direcao], ordenadas[indice]]
    await banco.transaction('rw', tabela('fichas'), () => tabela('fichas').bulkPut(ordenadas.map((item, ordem) => ({ ...item, ordem, atualizado_em: new Date().toISOString() }))))
  }
  const { filtrados, visiveis, filtros, mais } = useFiltroExercicios(exercicios ?? [], busca)
  if (!exercicios || !fichas) return <p role="status">Carregando seu espaço…</p>
  const totalPaginasFichas = Math.max(1, Math.ceil(fichas.length / 5))
  const paginaAtualFichas = Math.min(paginaFichas, totalPaginasFichas - 1)
  if (sessao) return <ModoTreino id={sessao} online={online} abrirResumo={abrirResumo} fechar={() => void executar(async () => { await descartarTreinoLivreVazio(sessao); definirSessao(null); definirAbrirResumo(false) })} concluido={id => { definirSessao(null); definirAbrirResumo(false); definirCardFinalizado(id) }} />
  return <>{dialogo}{carregandoCatalogo && <p className="nota-resumo" role="status">Carregando catálogo completo…</p>}
    {ativo && <section className="retomar-treino retomar-compacto">
      <div className="retomar-identidade"><span className="sinal-treino" aria-hidden="true" /><span>Em andamento</span><small>{ativo.data.split('-').reverse().slice(0, 2).join('/')}</small></div>
      <h2>{formatarNomeFicha(ativo.titulo ?? 'Treino livre')}</h2>
      {progressoAtivo && <div className="retomar-progresso">
        <p>{progressoAtivo.total > 0 ? `${progressoAtivo.feitas} de ${progressoAtivo.total} séries concluídas` : progressoAtivo.cardioTotal ? 'Cardio planejado' : 'Pronto para montar seu treino'}{progressoAtivo.cardioTotal > 0 && <span>{progressoAtivo.cardioFeito} de {progressoAtivo.cardioTotal} cardios registrados</span>}</p>
        {progressoAtivo.total + progressoAtivo.cardioTotal > 0 && <progress className="barra-sessao" aria-label="Progresso do treino em andamento" max={progressoAtivo.total + progressoAtivo.cardioTotal} value={progressoAtivo.feitas + progressoAtivo.cardioFeito} />}
      </div>}
      <button type="button" className="botao-principal" disabled={ocupado} onClick={() => { definirAbrirResumo(false); definirSessao(ativo.id) }}>Continuar treino <ArrowRight size={18} aria-hidden="true" /></button>
    </section>}
    <div className="abas-treino tres-abas"><button aria-pressed={secao === 'fichas'} onClick={() => definirSecao('fichas')}>Minhas fichas</button><button aria-pressed={secao === 'biblioteca'} onClick={() => definirSecao('biblioteca')}>Exercícios ({exerciciosUnicos(exercicios).length})</button><button aria-pressed={secao === 'cardio'} onClick={() => definirSecao('cardio')}>Cardio</button></div>
    <TransicaoConteudo chave={secao}>{secao === 'cardio' && <Cardio />}
    {secao === 'fichas' && ultimoFinalizado && <button type="button" className="ultimo-concluido ultimo-treino-atalho" onClick={() => definirCardFinalizado(ultimoFinalizado.id)} aria-label={`Ver card do último treino: ${formatarNomeFicha(ultimoFinalizado.titulo ?? 'Treino livre')}`}>
      <span className="icone-ultimo-treino"><Image size={19} aria-hidden="true" /></span>
      <span className="texto-ultimo-treino"><small>Último treino · {ultimoFinalizado.data.split('-').reverse().slice(0, 2).join('/')}</small><strong>{formatarNomeFicha(ultimoFinalizado.titulo ?? 'Treino livre')}</strong></span>
      <span className="acao-ultimo-treino">Ver card<ArrowRight size={16} aria-hidden="true" /></span>
    </button>}
    {erro && <p role="alert" className="erro">{erro}</p>}
    {desfazer && <div className="desfazer" role="status">{desfazer.texto}<button disabled={ocupado} onClick={() => void executar(async () => { await desfazer.executar(); definirDesfazer(null) })}>Desfazer</button></div>}
    {secao === 'fichas' ? <>
      <div className="barra-fichas"><span>{fichas.length} {fichas.length === 1 ? 'ficha' : 'fichas'} de treino</span><button className="botao-principal" onClick={() => definirFicha({ dados: { ...criarRegistro(), nome: '', ordem: Date.now() }, itens: [] })}><Plus size={18} />Nova ficha</button></div>
      {!fichas.length && <section className="painel"><h2>Sua primeira ficha</h2><p>Organize os exercícios, as séries planejadas e o descanso ou inicie um treino livre.</p></section>}
      {fichas.slice(paginaAtualFichas*5,paginaAtualFichas*5+5).map((item, indiceDaPagina) => { const indice=paginaAtualFichas*5+indiceDaPagina; return <section className={`painel ficha-cartao ficha-nova${ativo?.ficha_id === item.id ? ' ficha-em-andamento' : ''}`} key={item.id}><div className="topo-ficha"><span className="icone-ficha"><Dumbbell size={24} /></span><button className="abrir-ficha" disabled={ocupado} onClick={() => void executar(() => editarFicha(item))}>{item.nome}<small>{planejamento?.filter(p => p.ficha_id === item.id).length ?? 0} exercícios · {ativo?.ficha_id === item.id ? 'Em andamento' : 'seu planejamento'}</small></button><details className="menu-ficha"><summary aria-label={`Opções da ficha ${item.nome}`}><Ellipsis size={22} /></summary><div className="acoes">
        <button disabled={ocupado || indice === 0} onClick={() => void executar(() => moverFicha(indice, -1))}>Subir</button>
        <button disabled={ocupado || indice === fichas.length - 1} onClick={() => void executar(() => moverFicha(indice, 1))}>Descer</button>
        <button disabled={ocupado} onClick={() => void executar(() => duplicarFicha(item))}>Duplicar</button>
        <button disabled={ocupado} onClick={() => void executar(() => removerFicha(item))}>Excluir</button>
      </div></details></div><button className={`iniciar-ficha ${ativo?.ficha_id === item.id ? 'botao-secundario' : 'botao-principal'}`} disabled={ocupado} onClick={() => void executar(async () => { await iniciar(item.id) })}><Play size={16} aria-hidden="true" />{ativo?.ficha_id === item.id ? 'Continuar treino' : 'Iniciar treino'}<ArrowRight size={18} aria-hidden="true" /></button></section>})}
      {fichas.length>5&&<nav className="paginacao-fichas" aria-label="Páginas de fichas"><button type="button" className="botao-secundario" disabled={paginaAtualFichas===0} onClick={()=>definirPaginaFichas(paginaAtualFichas-1)}>Anterior</button><span role="status">{paginaAtualFichas+1} de {totalPaginasFichas}</span><button type="button" className="botao-secundario" disabled={paginaAtualFichas===totalPaginasFichas-1} onClick={()=>definirPaginaFichas(paginaAtualFichas+1)}>Próxima</button></nav>}
      <button className="treino-livre" disabled={ocupado} onClick={() => void executar(async () => { await iniciar() })}>{ativo && !ativo.ficha_id ? <Play size={20} aria-hidden="true" /> : <Plus size={20} aria-hidden="true" />}<span>{ativo && !ativo.ficha_id ? 'Continuar treino livre' : 'Treino livre'}<small>{ativo && !ativo.ficha_id ? 'Retome de onde parou' : 'Monte seu treino do dia'}</small></span><ArrowRight size={18} aria-hidden="true" /></button>
    </> : secao === 'biblioteca' ? <>
      <RevisarDuplicatas />
      <div className="formulario"><label>Buscar exercício<input type="search" value={busca} onChange={e => definirBusca(e.target.value)} placeholder="Nome ou equipamento" /></label>
      </div>
      <button className="botao-principal largura-total" onClick={() => definirEdicao({ ...criarRegistro(), nome: '', tipo: 'forca', grupo_muscular: '', equipamento: '', descanso_padrao_segundos: 90, modo_carga: 'total', peso_barra: 20, nota_fixa: '', como_fazer: '', musculos: '', origem: 'manual' })}>Adicionar exercício</button>
      <section className="ampliar-catalogo"><div><strong>Mais opções para sua ficha</strong><p>Inclua as variações do catálogo sem substituir seus exercícios.</p></div><button type="button" disabled={ocupado} onClick={() => void executar(async () => { const total = await ampliarBiblioteca(); definirAvisoCatalogo(total ? `${total} exercícios adicionados à biblioteca.` : 'Seu catálogo já está atualizado.') })}>Ampliar catálogo<Plus size={16} aria-hidden="true" /></button>{avisoCatalogo && <p role="status">{avisoCatalogo}</p>}</section>
      {filtros}
      <div className="contagem-catalogo"><span>{filtrados.length} exercícios</span><span>Ordem alfabética</span></div>
      <div className="lista-catalogo">{visiveis.map(ex => <article className="item-catalogo" key={ex.id}>
        <button type="button" className="abrir-exercicio-catalogo" onClick={() => definirAjuda(ex)}><MiniaturaExercicio id={ex.id} nome={ex.nome} dados={ex} /><span className="nome-catalogo"><strong>{ex.nome}</strong><small>{ex.grupo_muscular}{ex.equipamento ? ` · ${ex.equipamento}` : ''}</small></span></button>
        <details className="menu-ficha"><summary aria-label={`Opções de ${ex.nome}`}><Ellipsis size={22} /></summary><div className="acoes"><button type="button" onClick={() => definirEdicao(ex)}>Editar</button><button type="button" disabled={ocupado} onClick={() => void executar(async () => {
          const vinculos = await tabela('ficha_exercicios').where('exercicio_id').equals(ex.id).filter(item => !item.apagado_em).count()
          if (vinculos) throw new Error('Retire este exercício das fichas antes de excluí-lo.')
          await repositorio('exercicios').apagar(ex.id)
          definirDesfazer({ texto: 'Exercício removido.', executar: () => repositorio('exercicios').salvar({ ...ex, apagado_em: null }).then(() => undefined) })
        })}>Excluir</button></div></details>
      </article>)}</div>
      {mais}
      {filtrados.length === 0 && <p className="nota">Nenhum exercício encontrado. Tente outro nome ou adicione o seu.</p>}
    </> : null}
    </TransicaoConteudo>
    {novoPedido && <Painel centralizado titulo="Já existe um treino em andamento" fechar={() => definirNovoPedido(null)}><div className="troca-treino-dialogo"><p className="subtitulo-seletor">Começou a ficha errada? Cancele o atual para ele não entrar no histórico. Se já treinou e quer registrar, finalize o atual.</p><button type="button" className="botao-principal largura-total" disabled={ocupado} onClick={() => void executar(async () => { const atual = await treinoAtivo(); definirNovoPedido(null); if (atual) { definirAbrirResumo(true); definirSessao(atual.id) } })}>Concluir treino atual</button><button type="button" className="botao-secundario" disabled={ocupado} onClick={() => void executar(async () => { const id = await iniciarTreino(novoPedido.fichaId, true); definirNovoPedido(null); definirAbrirResumo(false); definirSessao(id) })}>Finalizar atual e iniciar outro</button><button type="button" className="botao-secundario" disabled={ocupado} onClick={async () => { if (!await confirmar('Cancelar o treino atual e iniciar o escolhido? O atual, suas séries e o cardio vinculado ficarão fora do histórico e das estatísticas.', "Cancelar e iniciar outro")) return; void executar(async () => { const id = await iniciarTreino(novoPedido.fichaId, 'cancelar'); definirNovoPedido(null); definirAbrirResumo(false); definirSessao(id) }) }}>Cancelar atual e iniciar outro</button>{erro && <p className="erro" role="alert">{erro}</p>}</div></Painel>}
    {edicao && <EditorExercicio exercicio={edicao} fechar={() => definirEdicao(null)} />}
    {cardFinalizado && <CompartilharUltimo id={cardFinalizado} fechar={() => definirCardFinalizado(null)} />}
    {ficha && <EditorFicha ficha={ficha.dados} iniciais={ficha.itens} exercicios={exercicios} fechar={() => definirFicha(null)} />}
    {ajuda && <AjudaExercicio exercicio={ajuda} online={online} fechar={() => definirAjuda(null)} editar={() => { definirEdicao(ajuda); definirAjuda(null) }} />}
  </>
}
