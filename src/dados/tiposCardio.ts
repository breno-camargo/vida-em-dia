export const tiposCardio = [
  ['esteira', 'Esteira'], ['caminhada', 'Caminhada'], ['corrida', 'Corrida'], ['bicicleta', 'Bicicleta'],
  ['eliptico', 'Elíptico'], ['escada', 'Escada'], ['remo', 'Remo'],
  ['caminhada_esteira', 'Caminhada na esteira'], ['corrida_esteira', 'Corrida na esteira'],
  ['ciclismo', 'Ciclismo de rua'], ['circuito', 'Circuito funcional'], ['natacao', 'Natação'],
  ['ski', 'Ski erg'], ['boxe', 'Boxe / Kickboxing cardio'], ['airbike', 'Air bike'],
  ['basquete', 'Basquete'], ['danca', 'Dança'], ['futebol', 'Futebol'], ['hidro', 'Hidroginástica'],
  ['spinning', 'Spinning'], ['tenis', 'Tênis'], ['padel', 'Padel'], ['beach_tennis', 'Beach tennis'],
  ['raquetes', 'Tênis / Padel / Beach tennis'], ['volei', 'Vôlei'], ['corda', 'Pular corda'], ['outro', 'Outro'],
] as const
export type TipoCardio = typeof tiposCardio[number][0]

const normalizar = (nome: string) => nome.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()
export function tipoCardioDoExercicio(nome: string): TipoCardio {
  const n = normalizar(nome)
  if (n.includes('tenis') && n.includes('padel')) return 'raquetes'
  if (n.includes('beach')) return 'beach_tennis'
  if (n.includes('padel')) return 'padel'
  if (n.includes('tenis')) return 'tenis'
  if (n.includes('esteira') && n.includes('corrida')) return 'corrida_esteira'
  if (n.includes('esteira') && n.includes('caminhada')) return 'caminhada_esteira'
  const correspondencias: [string, TipoCardio][] = [
    ['esteira', 'esteira'], ['spinning', 'spinning'], ['air bike', 'airbike'], ['assault', 'airbike'],
    ['ciclismo', 'ciclismo'], ['bicicleta', 'bicicleta'], ['caminhada', 'caminhada'], ['corrida', 'corrida'],
    ['eliptico', 'eliptico'], ['escada', 'escada'], ['remo', 'remo'], ['remador', 'remo'],
    ['circuito', 'circuito'], ['funcional', 'circuito'], ['natacao', 'natacao'], ['ski', 'ski'],
    ['boxe', 'boxe'], ['kickboxing', 'boxe'], ['basquete', 'basquete'], ['danca', 'danca'],
    ['futebol', 'futebol'], ['hidro', 'hidro'], ['volei', 'volei'], ['corda', 'corda'],
  ]
  return correspondencias.find(([trecho]) => n.includes(trecho))?.[1] ?? 'outro'
}
