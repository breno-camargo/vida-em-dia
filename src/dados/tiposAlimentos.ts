export const tiposAlimentos = ['Carnes e ovos', 'Pães, cereais e massas', 'Leites e derivados', 'Frutas', 'Verduras e legumes', 'Feijões e leguminosas', 'Óleos e gorduras', 'Suplementos', 'Outros'] as const
export type TipoAlimento = typeof tiposAlimentos[number]
export function tipoAlimento(alimento: { tipo_alimento?: string }): TipoAlimento {
  return tiposAlimentos.find(tipo => tipo === alimento.tipo_alimento) ?? 'Outros'
}
