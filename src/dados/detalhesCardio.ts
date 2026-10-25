import type { TipoCardio } from './tiposCardio'

export const limitesDetalhesCardio = { cadencia_rpm: 300, potencia_watts: 3000, comprimentos_piscina: 10000, piscina_metros: 100 }
export function validarDetalhesCardio(dados: Record<string, unknown>) {
 for (const [campo, maximo] of Object.entries(limitesDetalhesCardio)) {
  const valor = dados[campo]
  if (valor !== undefined && (typeof valor !== 'number' || !Number.isFinite(valor) || valor <= 0 || valor > maximo || (campo === 'comprimentos_piscina' && !Number.isInteger(valor)))) throw new Error('Confira os detalhes da modalidade.')
 }
}
export function camposDaModalidade(tipo: TipoCardio): string[] {
 const bicicleta = ['bicicleta','ciclismo','spinning','airbike'].includes(tipo)
 const deslocamento = ['esteira','caminhada','corrida','caminhada_esteira','corrida_esteira','eliptico','remo','ski','natacao'].includes(tipo) || bicicleta
 return [
  ...(deslocamento ? ['distancia_km','velocidade_media_kmh'] : []),
  ...(['esteira','caminhada_esteira','corrida_esteira'].includes(tipo) ? ['inclinacao_pct'] : []),
  ...(['esteira','caminhada','corrida','caminhada_esteira','corrida_esteira','escada'].includes(tipo) ? ['passos'] : []),
  ...(bicicleta ? ['cadencia_rpm','potencia_watts'] : []),
  ...(tipo === 'natacao' ? ['comprimentos_piscina','piscina_metros'] : []),
 ]
}
