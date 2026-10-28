export type GrupoMuscularVisual = 'Peito' | 'Costas' | 'Ombros' | 'Bíceps' | 'Tríceps' | 'Antebraços' | 'Abdômen' | 'Quadríceps' | 'Posteriores' | 'Glúteos' | 'Adutores' | 'Abdutores' | 'Panturrilhas' | 'Pernas' | 'Lombar' | 'Trapézio'
const normalizar = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()

// Representa o grupo principal do cadastro, não todos os músculos recrutados.
export function grupoMuscularVisual(grupo = '', nome = '', tipo = 'forca'): GrupoMuscularVisual | undefined {
  const g = normalizar(grupo), n = normalizar(nome)
  if (tipo === 'cardio' || ['cardio', 'mobilidade', 'funcional'].includes(g)) return undefined
  if (/adutora|aducao de quadril/.test(n)) return 'Adutores'
  if (/abdutora|abducao de quadril/.test(n)) return 'Abdutores'
  if (n.includes('panturrilha')) return 'Panturrilhas'
  if (g === 'pernas') {
    if (/mesa flexora|cadeira flexora|flexao de joelho|flexao de perna/.test(n)) return 'Posteriores'
    if (/cadeira extensora|extensao de joelho/.test(n)) return 'Quadríceps'
  }
  const grupos: Record<string, GrupoMuscularVisual> = { peito: 'Peito', costas: 'Costas', dorsal: 'Costas', ombros: 'Ombros', biceps: 'Bíceps', triceps: 'Tríceps', antebracos: 'Antebraços', antebraco: 'Antebraços', abdomen: 'Abdômen', quadriceps: 'Quadríceps', posterior: 'Posteriores', posteriores: 'Posteriores', gluteos: 'Glúteos', gluteo: 'Glúteos', adutores: 'Adutores', abdutores: 'Abdutores', panturrilhas: 'Panturrilhas', pernas: 'Pernas', lombar: 'Lombar', trapezio: 'Trapézio' }
  return grupos[g]
}
