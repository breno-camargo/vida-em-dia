import type { Exercicio } from '../dados/modelos'
import { Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { MiniaturaExercicio } from './MiniaturaExercicio'
import { useFiltroExercicios } from './FiltrosExercicios'

export function ListaExercicios({ exercicios, busca, adicionar, adicionarVarios, ocupado = false }: { exercicios: Exercicio[]; busca: string; adicionar: (exercicio: Exercicio) => void; adicionarVarios?: (exercicios: Exercicio[]) => void; ocupado?: boolean }) {
  const { filtrados, visiveis, filtros, mais } = useFiltroExercicios(exercicios, busca)
  const [selecionados, definirSelecionados] = useState<string[]>([])
  const porId = useMemo(() => new Map(exercicios.map(e => [e.id, e])), [exercicios])
  const escolhidos = useMemo(() => selecionados.flatMap(id => { const ex = porId.get(id); return ex ? [ex] : [] }), [selecionados, porId])
  const ordemSelecao = useMemo(() => new Map(escolhidos.map((ex, indice) => [ex.id, indice + 1])), [escolhidos])
  return <div className="selecao-catalogo">
    {filtros}
    <div className="contagem-catalogo"><span>{filtrados.length} exercícios</span><span>Ordem alfabética</span></div>
    <div className="lista-catalogo">{visiveis.map(ex => <button type="button" className="selecionar-exercicio" disabled={ocupado} key={ex.id} aria-pressed={adicionarVarios ? ordemSelecao.has(ex.id) : undefined} onClick={() => adicionarVarios ? definirSelecionados(ids => ids.includes(ex.id) ? ids.filter(id => id !== ex.id) : [...ids, ex.id]) : adicionar(ex)}><MiniaturaExercicio id={ex.id} nome={ex.nome} dados={ex} /><span className="nome-catalogo"><strong>{ex.nome}</strong><small>{ex.grupo_muscular}{ex.equipamento ? ` · ${ex.equipamento}` : ''}</small></span><span className="marcador-catalogo" aria-hidden="true">{adicionarVarios ? ordemSelecao.get(ex.id) : <Plus size={18} />}</span><span className="sr-only">{adicionarVarios ? ordemSelecao.has(ex.id) ? 'Remover da seleção' : 'Selecionar exercício' : 'Adicionar exercício'}</span></button>)}</div>
    {mais}
    {filtrados.length === 0 && <p className="vazio-catalogo">Nenhum exercício encontrado. Tente outro nome ou grupo.</p>}
    {adicionarVarios && <div className="confirmar-catalogo"><span>{escolhidos.length ? `${escolhidos.length} selecionado${escolhidos.length > 1 ? 's' : ''} · na ordem dos toques` : 'Selecione os exercícios da ficha'}</span><button type="button" className="botao-principal" disabled={ocupado || !escolhidos.length} onClick={() => { adicionarVarios(escolhidos); definirSelecionados([]) }}>Adicionar{escolhidos.length ? ` (${escolhidos.length})` : ''}</button></div>}
  </div>
}
