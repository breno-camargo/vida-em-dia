import type { Configuracao, MedidaCorporal } from './modelos'
import { dataMedida } from './medidas'
import { banco, tabela } from './banco'
import { repositorio } from './repositorio'

// Aproximações centrais dos intervalos PAL da FAO/WHO/UNU (2004).
// Aplicação ao REE estimado é uma aproximação de planejamento, não medição.
export const niveisEnergia = [
  { valor: 'sedentaria', nome: 'Sedentária', fator: 1.2, descricao: 'Maior parte do dia sentada, com pouco movimento e pouco ou nenhum exercício. Estimativa aproximada de manutenção.' },
  { valor: 'leve', nome: 'Pouco ativa', fator: 1.55, descricao: 'Movimento regular ao longo do dia, além do tempo sentada. Se passa quase todo o dia sentada e se exercita pouco, prefira Sedentária.' },
  { valor: 'moderada', nome: 'Moderadamente ativa', fator: 1.85, descricao: 'Rotina com movimento e atividade física frequente.' },
  { valor: 'intensa', nome: 'Muito ativa', fator: 2.2, descricao: 'Rotina fisicamente exigente e atividade intensa.' },
] as const

export function idadeEnergia(nascimento: string, data = dataMedida()) {
  for (const valor of [nascimento, data]) if (!/^\d{4}-\d{2}-\d{2}$/.test(valor) || dataMedida(new Date(`${valor}T12:00:00`)) !== valor) return undefined
  if (nascimento > data) return undefined
  const anos = Number(data.slice(0, 4)) - Number(nascimento.slice(0, 4))
  return anos - (data.slice(5) < nascimento.slice(5) ? 1 : 0)
}

export function pesoParaEnergia(medidas: MedidaCorporal[], data = dataMedida()) {
  return medidas.filter(m => !m.apagado_em && !m.eliminado_em && m.data <= data && m.peso !== undefined && Number.isFinite(m.peso) && m.peso > 0 && m.peso <= 400)
    .sort((a, b) => b.data.localeCompare(a.data) || b.atualizado_em.localeCompare(a.atualizado_em))[0]
}

export function estimarEnergia(config: Pick<Configuracao, 'data_nascimento' | 'sexo_calculo_energia' | 'altura_cm' | 'nivel_atividade_energia'>, peso: number | undefined, data = dataMedida()) {
  const idade = config.data_nascimento ? idadeEnergia(config.data_nascimento, data) : undefined
  if (idade === undefined || idade < 19 || idade > 78 || !peso || !Number.isFinite(peso) || peso > 400 || peso <= 0 || !config.altura_cm || !Number.isFinite(config.altura_cm) || config.altura_cm <= 0 || config.altura_cm > 300 || !['masculino', 'feminino'].includes(config.sexo_calculo_energia ?? '')) return null
  // Mifflin–St Jeor (1990), equação simplificada de gasto em repouso.
  const repouso = 10 * peso + 6.25 * config.altura_cm - 5 * idade + (config.sexo_calculo_energia === 'masculino' ? 5 : -161)
  if (repouso <= 0) return null
  const nivel = niveisEnergia.find(n => n.valor === config.nivel_atividade_energia)
  return { repouso: Math.round(repouso), diario: nivel ? Math.round(repouso * nivel.fator) : undefined, idade, peso, altura: config.altura_cm, fator: nivel?.fator }
}

export type PerfilEnergia = Pick<Configuracao, 'data_nascimento' | 'sexo_calculo_energia' | 'altura_cm' | 'nivel_atividade_energia' | 'meta_kcal_util' | 'meta_kcal_fds_feriado'>
export async function salvarPerfilEnergia(perfil: PerfilEnergia) {
  const idade = perfil.data_nascimento ? idadeEnergia(perfil.data_nascimento) : undefined
  if (idade === undefined || idade < 19 || idade > 78) throw new Error('Informe uma data de nascimento válida. Esta estimativa atende adultos de 19 a 78 anos.')
  if (!['masculino', 'feminino'].includes(perfil.sexo_calculo_energia ?? '')) throw new Error('Selecione o sexo usado pela equação.')
  if (!perfil.altura_cm || !Number.isFinite(perfil.altura_cm) || perfil.altura_cm <= 0 || perfil.altura_cm > 300) throw new Error('Informe a altura em cm, maior que zero e até 300.')
  if (perfil.nivel_atividade_energia !== undefined && !niveisEnergia.some(n => n.valor === perfil.nivel_atividade_energia)) throw new Error('Escolha um nível de atividade válido.')
  for (const meta of [perfil.meta_kcal_util, perfil.meta_kcal_fds_feriado]) if (!Number.isFinite(meta) || meta < 0 || meta > 20000) throw new Error('Confira as metas alimentares: de 0 a 20.000 kcal. Zero significa sem meta.')
  const repo = repositorio('configuracoes')
  await banco.transaction('rw', tabela('configuracoes'), async () => {
    const atual = (await repo.listar()).find(c => c.chave === 'principal')
    if (!atual) throw new Error('Reabra o app para carregar o perfil.')
    const proximo = { ...atual, ...perfil }
    proximo.nivel_atividade_energia_definido = true
    if (!perfil.nivel_atividade_energia) delete proximo.nivel_atividade_energia
    await repo.salvar(proximo)
  })
}

export async function salvarCampoEnergia<K extends keyof PerfilEnergia>(campo: K, valor: PerfilEnergia[K]) {
  if (campo === 'data_nascimento') { const idade = idadeEnergia(String(valor)); if (idade === undefined || idade < 19 || idade > 78) throw new Error('Escolha uma data válida para adultos de 19 a 78 anos.') }
  if (campo === 'sexo_calculo_energia' && valor !== 'masculino' && valor !== 'feminino') throw new Error('Selecione o sexo usado pela equação.')
  if (campo === 'altura_cm' && (typeof valor !== 'number' || !Number.isFinite(valor) || valor <= 0 || valor > 300)) throw new Error('Informe uma altura válida até 300 cm.')
  if (campo === 'nivel_atividade_energia' && valor !== undefined && !niveisEnergia.some(n => n.valor === valor)) throw new Error('Escolha uma rotina válida.')
  if ((campo === 'meta_kcal_util' || campo === 'meta_kcal_fds_feriado') && (typeof valor !== 'number' || !Number.isFinite(valor) || valor < 0 || valor > 20000)) throw new Error('Informe uma meta entre 0 e 20.000 kcal.')
  const repo = repositorio('configuracoes')
  await banco.transaction('rw', tabela('configuracoes'), async () => {
    const atual = (await repo.listar()).find(c => c.chave === 'principal')
    if (!atual) throw new Error('Reabra o app para carregar o perfil.')
    const proximo = { ...atual, [campo]: valor }
    if (campo === 'nivel_atividade_energia') proximo.nivel_atividade_energia_definido = true
    if (valor === undefined) delete proximo[campo]
    await repo.salvar(proximo)
  })
}
