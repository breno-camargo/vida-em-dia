import { useSyncExternalStore } from 'react'
import { banco, tabela } from './banco'
import type { MedidaCorporal } from './modelos'
import { validarMedida, salvarMedida } from './medidas'
import { comExclusaoSync, controle } from '../sincronizacao/armazenamento'

export interface PerfilCadastro { nome: string; altura_cm?: number; medida?: MedidaCorporal }
interface Rascunho extends PerfilCadastro { email: string }
let rascunho: Rascunho | undefined
const ouvintes = new Set<() => void>()
export function validarPerfilCadastro(perfil: PerfilCadastro) {
  if (!perfil.nome.trim() || perfil.nome.trim().length > 80) throw new Error('Informe seu nome, com até 80 caracteres.')
  if (perfil.altura_cm !== undefined && (!Number.isFinite(perfil.altura_cm) || perfil.altura_cm <= 0 || perfil.altura_cm > 300)) throw new Error('Informe uma altura maior que zero e até 300 cm.')
  if (perfil.medida) validarMedida(perfil.medida)
}
export function prepararPerfilCadastro(email: string, perfil: PerfilCadastro) {
  validarPerfilCadastro(perfil)
  rascunho = perfil.altura_cm !== undefined || perfil.medida ? { ...perfil, email: email.trim().toLowerCase() } : undefined
  ouvintes.forEach(f => f())
}
export function descartarPerfilCadastro() { rascunho = undefined; ouvintes.forEach(f => f()) }
export function usePerfilCadastro() {
  return useSyncExternalStore(f => { ouvintes.add(f); return () => { ouvintes.delete(f) } }, () => rascunho, () => undefined)
}
export async function salvarPerfilCadastro(usuario: { id: string; email?: string }, perfil: Rascunho, usuarioAtual: () => string | undefined) {
  validarPerfilCadastro(perfil)
  if (usuario.email?.toLowerCase() !== perfil.email) throw new Error('Este perfil pertence a outro cadastro.')
  return comExclusaoSync(async () => {
    if ((await controle.get('usuario'))?.valor !== usuario.id || usuarioAtual() !== usuario.id) throw new Error('Conecte este aparelho à conta do cadastro antes de salvar o perfil.')
    await banco.transaction('rw', tabela('configuracoes'), tabela('medidas_corporais'), async () => {
      const config = await tabela('configuracoes').where('chave').equals('principal').first()
      if (!config || (config.user_id && config.user_id !== usuario.id) || usuarioAtual() !== usuario.id) throw new Error('A conta deste aparelho mudou. Confira antes de salvar.')
      if (perfil.altura_cm !== undefined) await tabela('configuracoes').update(config.id, { user_id: usuario.id, altura_cm: perfil.altura_cm, atualizado_em: new Date().toISOString() })
      if (perfil.medida) await salvarMedida({ ...perfil.medida, user_id: usuario.id })
      if (usuarioAtual() !== usuario.id) throw new Error('A sessão mudou. Os dados do perfil não foram salvos.')
    })
  })
}
