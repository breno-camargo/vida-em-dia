import type { Exercicio } from '../dados/modelos'
import { Plus } from 'lucide-react'
import { useState } from 'react'
import { MiniaturaExercicio } from './MiniaturaExercicio'
import { useFiltroExercicios } from './FiltrosExercicios'

export function ListaExercicios({ exercicios, busca, adicionar, adicionarVarios, ocupado = false }: { exercicios: Exercicio[]; busca: string; adicionar: (exercicio: Exercicio) => void; adicionarVarios?: (exercicios: Exercicio[]) => void; ocupado?: boolean }) {
  const { filtrados, visiveis, filtros, mais } = useFiltroExercicios(exercicios, busca)
  const [selecionados, definirSelecionados] = useState<string[]>([])
  const escolhidos = selecionados.flatMap(id => { const ex = exercicios.find(e => e.id === id); return ex ? [ex] : [] })
  return <div className="selecao-catalogo">
    {filtros}
    <div className="contagem-catalogo"><span>{filtrados.length} exercícios</span><span>Ordem alfabética</span></div>
    <div className="lista-catalogo">{visiveis.map(ex => <button type="button" className="selecionar-exercicio" disabled={ocupado} key={ex.id} aria-pressed={adicionarVarios ? selecionados.includes(ex.id) : undefined} onClick={() => adicionarVarios ? definirSelecionados(ids => ids.includes(ex.id) ? ids.filter(id => id !== ex.id) : [...ids, ex.id]) : adicionar(ex)}><MiniaturaExercicio id={ex.id} nome={ex.nome} /><span className="nome-catalogo"><strong>{ex.nome}</strong><small>{ex.grupo_muscular}{ex.equipamento ? ` · ${ex.equipamento}` : ''}</small></span><span className="marcador-catalogo" aria-hidden="true">{adicionarVarios ? escolhidos.some(e => e.id === ex.id) && escolhidos.findIndex(e => e.id === ex.id) + 1 : <Plus size={18} />}</span><span className="sr-only">{adicionarVarios ? selecionados.includes(ex.id) ? 'Remover da seleção' : 'Selecionar exercício' : 'Adicionar exercício'}</span></button>)}</div>
    {mais}
    {filtrados.length === 0 && <p className="vazio-catalogo">Nenhum exercício encontrado. Tente outro nome ou grupo.</p>}
    {adicionarVarios && <div className="confirmar-catalogo"><span>{escolhidos.length ? `${escolhidos.length} selecionado${escolhidos.length > 1 ? 's' : ''} · na ordem dos toques` : 'Selecione os exercícios da ficha'}</span><button type="button" className="botao-principal" disabled={ocupado || !escolhidos.length} onClick={() => { adicionarVarios(escolhidos); definirSelecionados([]) }}>Adicionar{escolhidos.length ? ` (${escolhidos.length})` : ''}</button></div>}
  </div>
}
