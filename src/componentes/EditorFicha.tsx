import { useState } from 'react'
import { Painel } from './Painel'
import { ListaExercicios } from './ListaExercicios'
import type { Exercicio, Ficha, FichaExercicio } from '../dados/modelos'
import { criarRegistro } from '../dados/repositorio'
import { salvarFicha } from '../dados/fichas'
import { MiniaturaExercicio } from './MiniaturaExercicio'
import { ChevronDown } from 'lucide-react'
import { AjudaExercicio } from './AjudaExercicio'
import { EditorExercicio } from './EditorExercicio'
import { SelecionarDescanso } from './SelecionarDescanso'
export function EditorFicha({ ficha, iniciais, exercicios, fechar }: { ficha: Ficha; iniciais: FichaExercicio[]; exercicios: Exercicio[]; fechar: () => void }) {
  const [nome, definirNome] = useState(ficha.nome)
  const [itens, definirItens] = useState(iniciais)
  const [busca, definirBusca] = useState('')
  const [erro, definirErro] = useState('')
  const [salvando, definirSalvando] = useState(false)
  const [ajuda, definirAjuda] = useState<Exercicio | null>(null)
  const [edicao, definirEdicao] = useState<Exercicio | null>(null)
  const alterar = (id: string, dados: Partial<FichaExercicio>) => definirItens(itens.map(item => item.id === id ? { ...item, ...dados } : item))
  const mover = (indice: number, direcao: number) => { const novos = [...itens]; [novos[indice], novos[indice + direcao]] = [novos[indice + direcao], novos[indice]]; definirItens(novos) }
  return <Painel titulo={ficha.nome ? 'Editar ficha' : 'Nova ficha'} fechar={fechar}><form className="formulario" onSubmit={async e => {
    e.preventDefault(); definirSalvando(true); definirErro('')
    try { await salvarFicha({ ...ficha, nome }, itens); fechar() }
    catch (error) { definirErro(error instanceof Error ? error.message : 'Não foi possível salvar a ficha.') }
    finally { definirSalvando(false) }
  }}>
    <label>Nome da ficha<input required value={nome} onChange={e => definirNome(e.target.value)} placeholder="A · Peito e tríceps" /></label>
    {itens.map((item, indice) => <details className="item-ficha exercicio-recolhivel" key={item.id}><summary className="cabecalho-exercicio"><MiniaturaExercicio id={item.exercicio_id} nome={exercicios.find(ex => ex.id === item.exercicio_id)?.nome} abrir={() => definirAjuda(exercicios.find(ex => ex.id === item.exercicio_id) ?? null)} /><span className="resumo-exercicio"><strong>{indice + 1}. {exercicios.find(ex => ex.id === item.exercicio_id)?.nome ?? 'Exercício removido'}</strong><small>{item.series_planejadas} séries · {item.descanso_segundos ?? 90} s de descanso</small></span><ChevronDown className="seta-exercicio" size={20} aria-hidden="true" /></summary><div className="conteudo-exercicio">
      <label>Séries planejadas<select value={item.series_planejadas} onChange={e => alterar(item.id, { series_planejadas: Number(e.target.value) })}>{Array.from({ length: 20 }, (_, i) => <option key={i} value={i + 1}>{i + 1} séries</option>)}</select></label>
      <SelecionarDescanso valor={item.descanso_segundos ?? 90} confirmar={async descanso_segundos => { alterar(item.id, { descanso_segundos }) }} />
      <div className="acoes"><button type="button" disabled={indice === 0} onClick={() => mover(indice, -1)} aria-label="Mover exercício para cima">Subir</button><button type="button" disabled={indice === itens.length - 1} onClick={() => mover(indice, 1)} aria-label="Mover exercício para baixo">Descer</button><button type="button" onClick={() => definirItens(itens.filter(i => i.id !== item.id))}>Retirar</button></div>
    </div></details>)}
    <label>Buscar para adicionar<input value={busca} onChange={e => definirBusca(e.target.value)} placeholder="Nome do exercício" /></label>
    <ListaExercicios exercicios={exercicios.filter(ex => !itens.some(item => item.exercicio_id === ex.id))} busca={busca} adicionar={ex => definirItens([...itens, { ...criarRegistro(ficha.user_id), ficha_id: ficha.id, exercicio_id: ex.id, ordem: itens.length, series_planejadas: 3, descanso_segundos: ex.descanso_padrao_segundos }])} />
    {erro && <p className="erro" role="alert">{erro}</p>}<button disabled={salvando} className="botao-principal">{salvando ? 'Salvando…' : 'Salvar ficha'}</button>
    <small>Durante o treino, você poderá alterar o planejamento só daquele dia.</small>
  </form>
    {ajuda && <AjudaExercicio exercicio={ajuda} online={navigator.onLine} fechar={() => definirAjuda(null)} editar={() => { definirEdicao(ajuda); definirAjuda(null) }} />}
    {edicao && <EditorExercicio exercicio={edicao} fechar={() => definirEdicao(null)} />}
  </Painel>
}

