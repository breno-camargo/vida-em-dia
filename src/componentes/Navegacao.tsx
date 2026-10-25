import { House, Dumbbell, Utensils, Ruler, ChartNoAxesCombined } from 'lucide-react'
import { sequenciaAbas, type Aba } from '../utilitarios/gestoAbas'
const icones = { Hoje: House, Treino: Dumbbell, Comida: Utensils, Medidas: Ruler, Evolução: ChartNoAxesCombined }
export type { Aba } from '../utilitarios/gestoAbas'
export function Navegacao({ atual, selecionar, preparar }: { atual: Aba; selecionar: (aba: Aba) => void; preparar?: (aba: Aba) => void }) {
  return <nav className="navegacao" aria-label="Navegação principal">{sequenciaAbas.map(nome => { const Icone = icones[nome]; return (
    <button key={nome} aria-current={atual === nome ? 'page' : undefined} onPointerEnter={() => preparar?.(nome)} onFocus={() => preparar?.(nome)} onPointerDown={() => preparar?.(nome)} onClick={() => selecionar(nome)}>
      <Icone size={22} aria-hidden="true" /><span>{nome}</span>
    </button>)}
  )}</nav>
}
