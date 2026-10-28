import { banco, tabela } from './banco'
import { criarRegistro } from './repositorio'
import { validarDataAtividade } from './cardio'

export async function configurarAgua(campo: 'garrafa_ml' | 'meta_agua_ml', ml: number) {
  if (!Number.isSafeInteger(ml) || ml < 50 || ml > (campo === 'garrafa_ml' ? 5000 : 20000)) throw new Error('Informe um volume válido em ml.')
  await banco.transaction('rw', tabela('configuracoes'), async () => {
    const c = await tabela('configuracoes').where('chave').equals('principal').first()
    if (!c) throw new Error('Reabra o app para carregar seu perfil.')
    const agora = new Date().toISOString()
    await tabela('configuracoes').update(c.id, { ...(campo === 'garrafa_ml' ? { garrafa_ml: ml, garrafa_atualizada_em: agora } : { meta_agua_ml: ml, meta_agua_atualizada_em: agora }), atualizado_em: agora })
  })
}
export async function registrarGarrafa(data: string, desfazer = false) {
  validarDataAtividade(data)
  await banco.transaction('rw', tabela('agua_dia'), tabela('configuracoes'), async () => {
    const ativos = await tabela('agua_dia').where('data').equals(data).filter(r => !r.apagado_em).toArray()
    if (ativos.length > 1) throw new Error('Sincronize e revise os registros duplicados deste dia.')
    const registro = ativos[0]
    const volumes = [...(registro?.garrafas_ml ?? [])]
    let ml = registro?.ml ?? 0
    if (desfazer) {
      if (!volumes.length) return
      ml -= volumes.pop()!
    } else {
      const config = await tabela('configuracoes').where('chave').equals('principal').first()
      const capacidade = config?.garrafa_ml
      if (!capacidade) throw new Error('Configure o tamanho da sua garrafa primeiro.')
      if (!Number.isSafeInteger(capacidade) || capacidade < 50 || capacidade > 5000 || ml + capacidade > 20000) throw new Error('Confira o volume registrado para este dia.')
      ml += capacidade; volumes.push(capacidade)
    }
    await tabela('agua_dia').put({ ...(registro ?? criarRegistro()), data, ml, garrafas_ml: volumes, atualizado_em: new Date().toISOString() })
  })
}
