import { banco, tabela } from './banco'
import { criarRegistro } from './repositorio'

export async function iniciarBanco() {
  await banco.transaction('rw', tabela('configuracoes'), async () => {
    if (await tabela('configuracoes').where('chave').equals('principal').first()) return
    await tabela('configuracoes').add({
      ...criarRegistro(), chave: 'principal', tema: 'escuro', unidade: 'kg',
      meta_passos_util: 8000, meta_passos_fds_feriado: 4000,
      meta_calorias_gastas_util: 0, meta_calorias_gastas_fds_feriado: 0,
      meta_kcal_util: 0, meta_kcal_fds_feriado: 0, meta_agua_ml: 2000,
      meta_treinos_semana: 3, fator_calorias_cardio: 100, modo_calorias_gastas: 'soma',
      prompt_ia_modelo: '', dia_lembrete_medidas: 6, dias_lembrete_backup: 14, sync_automatico: false,
    })
  })
}
