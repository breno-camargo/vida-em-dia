import { beforeEach, expect, test, vi } from 'vitest'
const updateUser = vi.hoisted(() => vi.fn())
vi.mock('./cliente', () => ({ supabase: { auth: { updateUser } } }))
import { alterarSenha, requisitosSenha } from './senha'

beforeEach(() => { updateUser.mockReset(); updateUser.mockResolvedValue({ error: null }) })

test('bloqueia senha curta, sem maiúscula ou sem especial antes de enviar', async () => {
  for (const senha of ['Abc!123', 'abcdefgh!', 'Abcdefgh', 'Abcdefg ']) await expect(alterarSenha(senha, senha)).rejects.toThrow('8 caracteres')
  expect(updateUser).not.toHaveBeenCalled()
  expect(requisitosSenha('Árvore!1').map(r => r.atendido)).toEqual([true, true, true])
})

test('exige confirmação idêntica sem remover espaços da senha', async () => {
  await expect(alterarSenha('Abcdefg!', '')).rejects.toThrow('não coincidem')
  await expect(alterarSenha('Abcdefg!', 'Abcdefg! ')).rejects.toThrow('não coincidem')
  expect(updateUser).not.toHaveBeenCalled()
  await alterarSenha('Abcdefg!', 'Abcdefg!')
  expect(updateUser).toHaveBeenCalledExactlyOnceWith({ password: 'Abcdefg!' })
})

test('não apresenta sucesso quando o serviço recusa a troca', async () => {
  updateUser.mockResolvedValue({ error: { message: 'session expired' } })
  await expect(alterarSenha('Abcdefg!', 'Abcdefg!')).rejects.toThrow('Não foi possível alterar')
})
