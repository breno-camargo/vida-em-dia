import { expect, test } from 'vitest'
import { atualizarCampos } from './atualizarCampos'

test('checagens repetidas das mesmas pendências mantêm o snapshot da interface', () => {
  const antes = { pendentes: 0, ocupado: false, mensagem: '', usuario: { id: 'teste' } }
  expect(atualizarCampos(antes, { pendentes: 0 })).toBe(antes)
  expect(atualizarCampos(antes, { ocupado: false, mensagem: '' })).toBe(antes)
})
test('uma atualização real preserva os demais campos e avisa com um novo snapshot', () => {
  const antes = { pendentes: 1, ocupado: false, erro: 'anterior' }
  const depois = atualizarCampos(antes, { pendentes: 2, erro: '' })
  expect(depois).not.toBe(antes)
  expect(depois).toEqual({ pendentes: 2, ocupado: false, erro: '' })
  expect(antes.erro).toBe('anterior')
})
