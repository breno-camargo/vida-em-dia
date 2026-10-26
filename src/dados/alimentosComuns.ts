import type { Nutrientes } from './modelos'

export interface AlimentoComum extends Nutrientes {
  id: string
  nome: string
  base_quantidade_g: number
  fonte: string
}

// Valores por 100 g da Tabela Brasileira de Composição de Alimentos (TACO).
// A preparação e a marca podem alterar os valores; alimentos embalados devem ser cadastrados pelo rótulo.
export const alimentosComuns: AlimentoComum[] = [
  { id: 'taco-arroz-tipo-1-cozido', nome: 'Arroz tipo 1 cozido', base_quantidade_g: 100, kcal: 128, proteina_g: 2.5, carbo_g: 28.1, gordura_g: 0.2, fibra_g: 1.6, fonte: 'TACO, 4ª edição' },
  { id: 'taco-pao-frances', nome: 'Pão de trigo francês', base_quantidade_g: 100, kcal: 300, proteina_g: 8, carbo_g: 58.6, gordura_g: 3.1, fibra_g: 2.3, fonte: 'TACO, 4ª edição' },
  { id: 'taco-banana-prata', nome: 'Banana prata crua', base_quantidade_g: 100, kcal: 98, proteina_g: 1.3, carbo_g: 26, gordura_g: 0.1, fibra_g: 2, fonte: 'TACO, 4ª edição' },
  { id: 'taco-pao-integral', nome: 'Pão de trigo integral de forma', base_quantidade_g: 100, kcal: 253, proteina_g: 9.4, carbo_g: 49.9, gordura_g: 3.7, fibra_g: 6.9, fonte: 'TACO, 4ª edição' },
  { id: 'taco-milho-enlatado', nome: 'Milho verde enlatado drenado', base_quantidade_g: 100, kcal: 98, proteina_g: 3.2, carbo_g: 17.1, gordura_g: 2.4, fibra_g: 4.6, fonte: 'TACO, 4ª edição' },
  { id: 'taco-macarrao-cru', nome: 'Macarrão de trigo cru (peso antes de cozinhar)', base_quantidade_g: 100, kcal: 371, proteina_g: 10, carbo_g: 77.9, gordura_g: 1.3, fibra_g: 2.9, fonte: 'TACO, 4ª edição' },
]
