import type { Configuracao, TipoDia } from './modelos'
import { estimarEnergia, pesoParaEnergia } from './energia'
import { tipoDia } from './atividade'
import { dataMedida } from './medidas'
import { banco, tabela } from './banco'
import { criarRegistro, repositorio } from './repositorio'

export function referenciaAlimentar(config: Configuracao | undefined, peso: number | undefined, tipo: TipoDia, data: string) {
  const manual = tipo === 'util' ? config?.meta_kcal_util : config?.meta_kcal_fds_feriado
  if (manual && manual > 0) return { kcal: manual, origem: 'manual' as const }
  const estimativa = config ? estimarEnergia(config, peso, data)?.diario : undefined
  return estimativa ? { kcal: estimativa, origem: 'manutencao' as const } : { kcal: 0, origem: 'nenhuma' as const }
}

// Registra somente o dia atual. Nunca reconstrói um dia antigo com o perfil de hoje.
export async function registrarReferenciaHoje() {
  return banco.transaction('rw', tabela('configuracoes'), tabela('medidas_corporais'), tabela('feriados'), tabela('consumo_diario_meta'), async () => {
    const data = dataMedida()
    const config = (await repositorio('configuracoes').listar()).find(c => c.chave === 'principal')
    if (!config) return
    const feriados = await repositorio('feriados').listar()
    const tipo = tipoDia(data, feriados, config.descanso_por_data?.[data] === true)
    const peso = pesoParaEnergia(await repositorio('medidas_corporais').listar(), data)?.peso
    const referencia = referenciaAlimentar(config, peso, tipo, data)
    const repo = repositorio('consumo_diario_meta')
    const atual = (await repo.listar()).find(r => r.data === data)
    if (atual?.meta_kcal_aplicada === referencia.kcal && atual.origem_meta === referencia.origem && atual.tipo_dia === tipo) return
    await repo.salvar({ ...(atual ?? criarRegistro()), data, tipo_dia: tipo, meta_kcal_aplicada: referencia.kcal, origem_meta: referencia.origem })
  })
}
