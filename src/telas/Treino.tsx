import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { banco, tabela } from '../dados/banco'
import { criarRegistro, repositorio } from '../dados/repositorio'
import { apagarFicha, duplicarFicha } from '../dados/fichas'
import type { Exercicio, Ficha, FichaExercicio } from '../dados/modelos'
import { EditorExercicio } from '../componentes/EditorExercicio'
import { EditorFicha } from '../componentes/EditorFicha'
import { AjudaExercicio } from '../componentes/AjudaExercicio'

const normalizar = (texto: string) => texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR')
export function Treino({ online }: { online: boolean }) {
  const exercicios = useLiveQuery(() => repositorio('exercicios').listar().then(itens => itens.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))))
  const fichas = useLiveQuery(() => repositorio('fichas').listar().then(itens => itens.sort((a, b) => a.ordem - b.ordem)))
  const [secao, definirSecao] = useState<'fichas' | 'biblioteca'>('fichas')
  const [busca, definirBusca] = useState('')
  const [grupo, definirGrupo] = useState('')
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
  return <>
    <div className="abas-treino"><button aria-pressed={secao === 'fichas'} onClick={() => definirSecao('fichas')}>Minhas fichas</button><button aria-pressed={secao === 'biblioteca'} onClick={() => definirSecao('biblioteca')}>Exercícios ({exercicios.length})</button></div>
    {erro && <p role="alert" className="erro">{erro}</p>}
    {desfazer && <div className="desfazer" role="status">{desfazer.texto}<button disabled={ocupado} onClick={() => void executar(async () => { await desfazer.executar(); definirDesfazer(null) })}>Desfazer</button></div>}
    {secao === 'fichas' ? <>
      <button className="botao-principal largura-total" onClick={() => definirFicha({ dados: { ...criarRegistro(), nome: '', ordem: Date.now() }, itens: [] })}>Criar ficha</button>
      {!fichas.length && <section className="painel"><h2>Sua primeira ficha</h2><p>Organize os exercícios, as séries planejadas e o descanso. A execução do treino chega na etapa 3.</p></section>}
      {fichas.map((item, indice) => <section className="painel ficha-cartao" key={item.id}><button className="abrir-ficha" disabled={ocupado} onClick={() => void executar(() => editarFicha(item))}>{item.nome}<small>Editar exercícios e planejamento</small></button><div className="acoes">
        <button disabled={ocupado || indice === 0} onClick={() => void executar(() => moverFicha(indice, -1))}>Subir</button>
        <button disabled={ocupado || indice === fichas.length - 1} onClick={() => void executar(() => moverFicha(indice, 1))}>Descer</button>
        <button disabled={ocupado} onClick={() => void executar(() => duplicarFicha(item))}>Duplicar</button>
        <button disabled={ocupado} onClick={() => void executar(() => removerFicha(item))}>Excluir</button>
      </div></section>)}
    </> : <>
      <div className="formulario"><label>Buscar exercício<input type="search" value={busca} onChange={e => definirBusca(e.target.value)} placeholder="Nome ou equipamento" /></label>
        <label>Grupo muscular<select value={grupo} onChange={e => definirGrupo(e.target.value)}><option value="">Todos os grupos</option>{[...new Set(exercicios.map(ex => ex.grupo_muscular))].filter(Boolean).map(g => <option key={g}>{g}</option>)}</select></label></div>
      <button className="botao-principal largura-total" onClick={() => definirEdicao({ ...criarRegistro(), nome: '', tipo: 'forca', grupo_muscular: '', equipamento: '', descanso_padrao_segundos: 90, modo_carga: 'total', peso_barra: 20, nota_fixa: '', como_fazer: '', musculos: '', origem: 'manual' })}>Adicionar exercício</button>
      {exercicios.filter(ex => (!grupo || ex.grupo_muscular === grupo) && normalizar(`${ex.nome} ${ex.equipamento}`).includes(normalizar(busca))).map(ex => <section className="painel exercicio-cartao" key={ex.id}>
        <h2>{ex.nome}</h2><p>{ex.grupo_muscular || 'Sem grupo'} · {ex.tipo === 'forca' ? 'Força' : 'Cardio'}</p>
        <div className="acoes"><button aria-label={`Ajuda de ${ex.nome}`} onClick={() => definirAjuda(ex)}>Como fazer ?</button><button onClick={() => definirEdicao(ex)}>Editar</button><button disabled={ocupado} onClick={() => void executar(async () => {
          const vinculos = await tabela('ficha_exercicios').where('exercicio_id').equals(ex.id).filter(item => !item.apagado_em).count()
          if (vinculos) throw new Error('Retire este exercício das fichas antes de excluí-lo.')
          await repositorio('exercicios').apagar(ex.id)
          definirDesfazer({ texto: 'Exercício removido.', executar: () => repositorio('exercicios').salvar({ ...ex, apagado_em: null }).then(() => undefined) })
        })}>Excluir</button></div>
      </section>)}
      {!exercicios.some(ex => (!grupo || ex.grupo_muscular === grupo) && normalizar(`${ex.nome} ${ex.equipamento}`).includes(normalizar(busca))) && <p className="nota">Nenhum exercício encontrado. Tente outro nome ou adicione o seu.</p>}
    </>}
    {edicao && <EditorExercicio exercicio={edicao} fechar={() => definirEdicao(null)} />}
    {ficha && <EditorFicha ficha={ficha.dados} iniciais={ficha.itens} exercicios={exercicios} fechar={() => definirFicha(null)} />}
    {ajuda && <AjudaExercicio exercicio={ajuda} online={online} fechar={() => definirAjuda(null)} editar={() => { definirEdicao(ajuda); definirAjuda(null) }} />}
  </>
}
