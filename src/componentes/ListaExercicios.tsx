import type { Exercicio } from '../dados/modelos'
import { ChevronDown, Plus } from 'lucide-react'

export function ListaExercicios({ exercicios, busca, adicionar, ocupado = false }: { exercicios: Exercicio[]; busca: string; adicionar: (exercicio: Exercicio) => void; ocupado?: boolean }) {
  const normalizar = (texto: string) => texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR')
  const filtrados = exercicios.filter(ex => normalizar(ex.nome).includes(normalizar(busca.trim())))
  const grupos = [...new Set(filtrados.map(ex => ex.grupo_muscular.trim() || 'Outros'))].sort((a, b) => a.localeCompare(b, 'pt-BR'))
  return <div className="lista-grupos-exercicios">
    {grupos.map(grupo => <details className="grupo-exercicios" key={`${grupo}-${busca.trim() ? 'busca' : 'lista'}`} open={busca.trim() ? true : undefined}>
      <summary><span>{grupo}</span><small>{filtrados.filter(ex => (ex.grupo_muscular.trim() || 'Outros') === grupo).length}</small><ChevronDown size={18} aria-hidden="true" /></summary>
      <div className="seletor-exercicios">{filtrados.filter(ex => (ex.grupo_muscular.trim() || 'Outros') === grupo).sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')).map(ex => <button type="button" disabled={ocupado} key={ex.id} onClick={() => adicionar(ex)}><span>{ex.nome}</span><Plus size={18} aria-hidden="true" /><span className="sr-only">Adicionar exercício</span></button>)}</div>
    </details>)}
    {filtrados.length === 0 && <p className="nota">Nenhum exercício disponível para esta busca.</p>}
  </div>
}
