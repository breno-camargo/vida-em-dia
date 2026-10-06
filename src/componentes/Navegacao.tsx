import { House, Dumbbell, Utensils, Ruler, ChartNoAxesCombined } from 'lucide-react'
const abas = [
  { nome: 'Hoje', icone: House }, { nome: 'Treino', icone: Dumbbell },
  { nome: 'Comida', icone: Utensils }, { nome: 'Medidas', icone: Ruler },
  { nome: 'Evolução', icone: ChartNoAxesCombined },
] as const
export type Aba = typeof abas[number]['nome']
export function Navegacao({ atual, selecionar }: { atual: Aba; selecionar: (aba: Aba) => void }) {
  return <nav className="navegacao" aria-label="Navegação principal">{abas.map(({ nome, icone: Icone }) =>
    <button key={nome} aria-current={atual === nome ? 'page' : undefined} onClick={() => selecionar(nome)}>
      <Icone size={22} aria-hidden="true" /><span>{nome}</span>
    </button>,
  )}</nav>
}
