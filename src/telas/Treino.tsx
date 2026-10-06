import { MiniaturaExercicio } from '../componentes/MiniaturaExercicio'
import { useId, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { banco, tabela } from '../dados/banco'
import { criarRegistro, repositorio } from '../dados/repositorio'
import { apagarFicha, duplicarFicha } from '../dados/fichas'
import type { Exercicio, Ficha, FichaExercicio } from '../dados/modelos'
import { EditorExercicio } from '../componentes/EditorExercicio'
import { EditorFicha } from '../componentes/EditorFicha'
import { AjudaExercicio } from '../componentes/AjudaExercicio'
import { iniciarTreino, treinoAtivo } from '../dados/treinos'
import { ModoTreino } from './ModoTreino'
import { Ellipsis, Play, Plus, ArrowRight, Dumbbell, ChevronDown } from 'lucide-react'
import { Painel } from '../componentes/Painel'
import { CompartilharUltimo } from '../componentes/CompartilharUltimo'

const normalizar = (texto: string) => texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR')
export function Treino({ online }: { online: boolean }) {
  const exercicios = useLiveQuery(() => repositorio('exercicios').listar().then(itens => itens.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))))
  const fichas = useLiveQuery(() => repositorio('fichas').listar().then(itens => itens.sort((a, b) => a.ordem - b.ordem)))
  const ativo = useLiveQuery(treinoAtivo)
  const ultimoFinalizado = useLiveQuery(() => tabela('treinos').filter(t => !!t.fim && !t.apagado_em).sortBy('fim').then(t => t.at(-1)))
  const [cardFinalizado, definirCardFinalizado] = useState(false)
  const planejamento = useLiveQuery(() => repositorio('ficha_exercicios').listar())
  const [sessao, definirSessao] = useState<string | null>(null)
  const [abrirResumo, definirAbrirResumo] = useState(false)
  const [novoPedido, definirNovoPedido] = useState<{ fichaId?: string } | null>(null)
  const [secao, definirSecao] = useState<'fichas' | 'biblioteca'>('fichas')
  const [busca, definirBusca] = useState('')
  const acordeaoBiblioteca = useId()
  const [edicao, definirEdicao] = useState<Exercicio | null>(null)
  const [ajuda, definirAjuda] = useState<Exercicio | null>(null)
  const [ficha, definirFicha] = useState<{ dados: Ficha; itens: FichaExercicio[] } | null>(null)
  const [erro, definirErro] = useState('')
  const [ocupado, definirOcupado] = useState(false)
  const [desfazer, definirDesfazer] = useState<{ texto: string; executar: () => Promise<void> } | null>(null)
  const executar = async (acao: () => Promise<void>) => {
    definirErro(''); definirOcupado(true)
    try { await acao() } catch (error) { definirErro(error instanceof Error ? error.message : 'Não foi possível concluir. Confira o armazenamento do aparelho.') }
    finally { definirOcupado(false) }
  }
  const iniciar = async (fichaId?: string) => {
    const atual = await treinoAtivo()
    if (atual && atual.ficha_id !== fichaId) { definirNovoPedido({ fichaId }); return }
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
  if (!exercicios || !fichas) return <p role="status">Carregando seu espaço…</p>
  const filtrados = exercicios.filter(ex => normalizar(`${ex.nome} ${ex.equipamento}`).includes(normalizar(busca)))
  const gruposBiblioteca = [...new Set(filtrados.map(ex => ex.grupo_muscular.trim() || 'Outros'))].sort((a, b) => a.localeCompare(b, 'pt-BR'))
  if (sessao) return <ModoTreino id={sessao} online={online} abrirResumo={abrirResumo} fechar={() => { definirSessao(null); definirAbrirResumo(false) }} />
  return <>
    {ativo && <section className="retomar-treino"><span className="etiqueta">SEU TREINO ESTÁ SALVO</span><h2>{ativo.titulo ?? 'Treino livre'}</h2><button onClick={() => definirSessao(ativo.id)}>Continuar treino <ArrowRight size={20} /></button></section>}
    <div className="abas-treino"><button aria-pressed={secao === 'fichas'} onClick={() => definirSecao('fichas')}>Minhas fichas</button><button aria-pressed={secao === 'biblioteca'} onClick={() => definirSecao('biblioteca')}>Exercícios ({exercicios.length})</button></div>
    {secao === 'fichas' && ultimoFinalizado && <section className="ultimo-concluido"><span>Último treino concluído</span><strong>{ultimoFinalizado.titulo ?? 'Treino livre'}</strong><button className="botao-secundario" onClick={() => definirCardFinalizado(true)}>Gerar card para compartilhar</button></section>}
    {erro && <p role="alert" className="erro">{erro}</p>}
    {desfazer && <div className="desfazer" role="status">{desfazer.texto}<button disabled={ocupado} onClick={() => void executar(async () => { await desfazer.executar(); definirDesfazer(null) })}>Desfazer</button></div>}
    {secao === 'fichas' ? <>
      <div className="barra-fichas"><span>{fichas.length} {fichas.length === 1 ? 'ficha' : 'fichas'} de treino</span><button onClick={() => definirFicha({ dados: { ...criarRegistro(), nome: '', ordem: Date.now() }, itens: [] })}><Plus size={18} />Nova ficha</button></div>
      {!fichas.length && <section className="painel"><h2>Sua primeira ficha</h2><p>Organize os exercícios, as séries planejadas e o descanso ou inicie um treino livre.</p></section>}
      {fichas.map((item, indice) => <section className="painel ficha-cartao ficha-nova" key={item.id}><div className="topo-ficha"><span className="icone-ficha"><Dumbbell size={24} /></span><button className="abrir-ficha" disabled={ocupado} onClick={() => void executar(() => editarFicha(item))}>{item.nome}<small>{planejamento?.filter(p => p.ficha_id === item.id).length ?? 0} exercícios · seu planejamento</small></button><details className="menu-ficha"><summary aria-label={`Opções da ficha ${item.nome}`}><Ellipsis size={22} /></summary><div className="acoes">
        <button disabled={ocupado || indice === 0} onClick={() => void executar(() => moverFicha(indice, -1))}>Subir</button>
        <button disabled={ocupado || indice === fichas.length - 1} onClick={() => void executar(() => moverFicha(indice, 1))}>Descer</button>
        <button disabled={ocupado} onClick={() => void executar(() => duplicarFicha(item))}>Duplicar</button>
        <button disabled={ocupado} onClick={() => void executar(() => removerFicha(item))}>Excluir</button>
      </div></details></div><button className="iniciar-ficha" disabled={ocupado} onClick={() => void executar(async () => { await iniciar(item.id) })}><Play size={16} />Iniciar treino <ArrowRight size={18} /></button></section>)}
      <button className="treino-livre" disabled={ocupado} onClick={() => void executar(async () => { await iniciar() })}><Plus size={20} /><span>Treino livre<small>Monte seu treino do dia</small></span><ArrowRight size={18} /></button>
    </> : <>
      <div className="formulario"><label>Buscar exercício<input type="search" value={busca} onChange={e => definirBusca(e.target.value)} placeholder="Nome ou equipamento" /></label>
      </div>
      <button className="botao-principal largura-total" onClick={() => definirEdicao({ ...criarRegistro(), nome: '', tipo: 'forca', grupo_muscular: '', equipamento: '', descanso_padrao_segundos: 90, modo_carga: 'total', peso_barra: 20, nota_fixa: '', como_fazer: '', musculos: '', origem: 'manual' })}>Adicionar exercício</button>
      <div className="biblioteca-grupos">{gruposBiblioteca.map((grupo, indice) => <details name={acordeaoBiblioteca} className="grupo-exercicios" key={`${grupo}-${busca.trim() ? 'busca' : 'lista'}`} open={busca.trim() && indice === 0 ? true : undefined}><summary><span>{grupo}</span><small>{filtrados.filter(ex => (ex.grupo_muscular.trim() || 'Outros') === grupo).length}</small><ChevronDown size={18} aria-hidden="true" /></summary><div className="conteudo-grupo-biblioteca">
      {filtrados.filter(ex => (ex.grupo_muscular.trim() || 'Outros') === grupo).map(ex => <section className="painel exercicio-cartao biblioteca-cartao" key={ex.id}>
        <div className="biblioteca-cabecalho"><MiniaturaExercicio id={ex.id} nome={ex.nome} abrir={() => definirAjuda(ex)} /><div><h2>{ex.nome}</h2><p>{ex.grupo_muscular || 'Sem grupo'} · {ex.tipo === 'forca' ? 'Força' : 'Cardio'}</p></div></div>
        <div className="acoes"><button aria-label={`Ajuda de ${ex.nome}`} onClick={() => definirAjuda(ex)}>Instruções</button><button onClick={() => definirEdicao(ex)}>Editar</button><button disabled={ocupado} onClick={() => void executar(async () => {
          const vinculos = await tabela('ficha_exercicios').where('exercicio_id').equals(ex.id).filter(item => !item.apagado_em).count()
          if (vinculos) throw new Error('Retire este exercício das fichas antes de excluí-lo.')
          await repositorio('exercicios').apagar(ex.id)
          definirDesfazer({ texto: 'Exercício removido.', executar: () => repositorio('exercicios').salvar({ ...ex, apagado_em: null }).then(() => undefined) })
        })}>Excluir</button></div>
      </section>)}</div></details>)}</div>
      {filtrados.length === 0 && <p className="nota">Nenhum exercício encontrado. Tente outro nome ou adicione o seu.</p>}
    </>}
    {novoPedido && <Painel centralizado titulo="Já existe um treino em andamento" fechar={() => definirNovoPedido(null)}><p className="subtitulo-seletor">Você pode concluir o atual ou salvar seu andamento e iniciar o treino escolhido. Séries pendentes não serão marcadas como feitas.</p><button type="button" className="botao-principal largura-total" disabled={ocupado} onClick={() => void executar(async () => { const atual = await treinoAtivo(); definirNovoPedido(null); if (atual) { definirAbrirResumo(true); definirSessao(atual.id) } })}>Concluir treino atual</button><button type="button" className="botao-secundario" disabled={ocupado} onClick={() => void executar(async () => { const id = await iniciarTreino(novoPedido.fichaId, true); definirNovoPedido(null); definirAbrirResumo(false); definirSessao(id) })}>Salvar atual e iniciar outro</button>{erro && <p className="erro" role="alert">{erro}</p>}</Painel>}
    {edicao && <EditorExercicio exercicio={edicao} fechar={() => definirEdicao(null)} />}
    {cardFinalizado && ultimoFinalizado && <CompartilharUltimo id={ultimoFinalizado.id} fechar={() => definirCardFinalizado(false)} />}
    {ficha && <EditorFicha ficha={ficha.dados} iniciais={ficha.itens} exercicios={exercicios} fechar={() => definirFicha(null)} />}
    {ajuda && <AjudaExercicio exercicio={ajuda} online={online} fechar={() => definirAjuda(null)} editar={() => { definirEdicao(ajuda); definirAjuda(null) }} />}
  </>
}



