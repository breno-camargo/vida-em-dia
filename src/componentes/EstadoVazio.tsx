import type { LucideIcon } from 'lucide-react'
export function EstadoVazio({ icone: Icone, titulo, texto, etapa }: {
  icone: LucideIcon; titulo: string; texto: string; etapa: number
}) {
  return <section className="vazio"><div className="icone-vazio"><Icone size={34} aria-hidden="true" /></div>
    <span className="etiqueta">UM PASSO DE CADA VEZ</span><h2>{titulo}</h2><p>{texto}</p>
    <span className="selo">Disponível na etapa {etapa}</span>
  </section>
}
