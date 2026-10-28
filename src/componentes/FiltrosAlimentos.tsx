import { tiposAlimentos } from '../dados/tiposAlimentos'

export type FiltroAlimentos = 'todos' | 'tipo' | 'meus'
export function FiltrosAlimentos({ filtro, definirFiltro, tipo, definirTipo }: {
  filtro: FiltroAlimentos; definirFiltro: (valor: FiltroAlimentos) => void; tipo: string; definirTipo: (valor: string) => void
}) {
  return <div className="filtros-catalogo">
    <div className="abas-catalogo" aria-label="Filtrar alimentos">{([['todos', 'Todos'], ['tipo', 'Por tipo'], ['meus', 'Meus alimentos']] as const).map(([valor, texto]) => <button type="button" key={valor} aria-pressed={filtro === valor} onClick={() => definirFiltro(valor)}>{texto}</button>)}</div>
    {filtro === 'tipo' && <div className="musculos-catalogo" aria-label="Tipos de alimentos"><button type="button" aria-pressed={!tipo} onClick={() => definirTipo('')}>Todos os tipos</button>{tiposAlimentos.map(t => <button type="button" key={t} aria-pressed={tipo === t} onClick={() => definirTipo(t)}>{t}</button>)}</div>}
  </div>
}
