import { createElement } from 'react'
import { Activity, Bike, BicepsFlexed, Dumbbell, Footprints, Mountain, PersonStanding, Waves } from 'lucide-react'
function escolherIcone(grupo = '', nome = '', tipo = 'forca') {
  const normalizar = (texto: string) => texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
  const g = normalizar(grupo), n = normalizar(nome)
  if (tipo === 'cardio' || g === 'cardio') {
    if (n.includes('bicicleta')) return Bike
    if (n.includes('escada')) return Mountain
    if (n.includes('remo')) return Waves
    if (n.includes('esteira') || n.includes('caminhada') || n.includes('corrida')) return Footprints
    return Activity
  }
  if (g === 'biceps' || g === 'triceps' || n.includes('rosca')) return BicepsFlexed
  if (g === 'pernas' || g === 'panturrilhas') return Footprints
  if (g === 'abdomen' || g === 'costas' || g === 'gluteos') return PersonStanding
  return Dumbbell
}

export function iconeExercicio(grupo = '', nome = '', tipo = 'forca') {
  return createElement(escolherIcone(grupo, nome, tipo), { size: 28, 'aria-hidden': true })
}
