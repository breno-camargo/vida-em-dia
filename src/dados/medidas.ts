import { banco, tabela } from './banco'
import { criarRegistro } from './repositorio'
import type { MedidaCorporal } from './modelos'
export const camposMedidas = [
  ['peso', 'Peso', 'kg'], ['cintura', 'Cintura', 'cm'], ['abdomen', 'Abdômen', 'cm'], ['quadril', 'Quadril', 'cm'],
  ['biceps_d', 'Bíceps direito', 'cm'], ['biceps_e', 'Bíceps esquerdo', 'cm'], ['coxa_d', 'Coxa direita', 'cm'], ['coxa_e', 'Coxa esquerda', 'cm'], ['panturrilha_d', 'Panturrilha direita', 'cm'], ['panturrilha_e', 'Panturrilha esquerda', 'cm'],
] as const
export type CampoMedida = typeof camposMedidas[number][0]
export function dataMedida(agora = new Date()) { return `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, '0')}-${String(agora.getDate()).padStart(2, '0')}` }
export function formatarDataMedida(data: string) { return new Date(`${data}T12:00:00`).toLocaleDateString('pt-BR') }
export function validarMedida(medida: MedidaCorporal) {
  const data = new Date(`${medida.data}T12:00:00`)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(medida.data) || !Number.isFinite(data.getTime()) || dataMedida(data) !== medida.data || medida.data > dataMedida()) throw new Error('Escolha uma data válida, até hoje.')
  if (!camposMedidas.some(([campo]) => medida[campo] !== undefined)) throw new Error('Preencha pelo menos o peso ou uma medida.')
  for (const [campo, nome] of camposMedidas) { const valor = medida[campo]; if (valor !== undefined && (!Number.isFinite(valor) || valor <= 0 || valor > (campo === 'peso' ? 400 : 300))) throw new Error(`Confira o valor de ${nome.toLowerCase()}.`) }
}
export async function salvarMedida(medida: MedidaCorporal) {
  validarMedida(medida)
  return banco.transaction('rw', tabela('medidas_corporais'), async () => {
    const existente = await tabela('medidas_corporais').where('data').equals(medida.data).filter(m => !m.apagado_em && m.id !== medida.id).first()
    if (existente) throw new Error('Já há um registro nessa data. Edite o registro existente.')
    await tabela('medidas_corporais').put({ ...medida, atualizado_em: new Date().toISOString() })
  })
}
export async function novaMedida() { const config = await tabela('configuracoes').where('chave').equals('principal').first(); return { ...criarRegistro(config?.user_id), data: dataMedida() } satisfies MedidaCorporal }
export function lembreteMedidas(medidas: MedidaCorporal[], dia = 6, agora = new Date()) {
  const hoje = dataMedida(agora)
  const inicio = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate(), 12)
  inicio.setDate(inicio.getDate() - (inicio.getDay() + 6) % 7)
  const diaSemana = (agora.getDay() + 6) % 7
  return diaSemana >= (dia + 6) % 7 && !medidas.some(m => !m.apagado_em && m.data >= dataMedida(inicio) && m.data <= hoje)
}
export function diferencaMedida(antes: MedidaCorporal, depois: MedidaCorporal, campo: CampoMedida) { return antes[campo] !== undefined && depois[campo] !== undefined ? Math.round((depois[campo]! - antes[campo]!) * 10) / 10 : null }
