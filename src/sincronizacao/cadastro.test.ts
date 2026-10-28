import { beforeEach, expect, test, vi } from 'vitest'
const auth = vi.hoisted(() => ({ signUp: vi.fn(), verifyOtp: vi.fn(), resend: vi.fn() }))
vi.mock('./cliente', () => ({ supabase: { auth } }))
import { cadastrarConta, confirmarCadastro, reenviarCadastro } from './cadastro'

beforeEach(() => { vi.resetAllMocks() })

test('cadastro solicita somente autenticação e aguarda confirmação sem sessão', async () => {
  auth.signUp.mockResolvedValue({ data: { session: null }, error: null })
  await expect(cadastrarConta(' teste@example.com ', 'senhaForte123', 'senhaForte123')).resolves.toBe('confirmar')
  expect(auth.signUp).toHaveBeenCalledExactlyOnceWith({ email: 'teste@example.com', password: 'senhaForte123' })
  expect(auth.verifyOtp).not.toHaveBeenCalled()
})

test('configuração sem confirmação trata sessão imediata sem pedir vínculo', async () => {
  auth.signUp.mockResolvedValue({ data: { session: { user: { id: 'teste' } } }, error: null })
  await expect(cadastrarConta('teste@example.com', 'senhaForte123', 'senhaForte123')).resolves.toBe('conectada')
})

test.each([
  ['inválido', 'senhaForte123', 'senhaForte123', 'e-mail válido'],
  ['teste@example.com', 'curta', 'curta', '8 caracteres'],
  ['teste@example.com', 'senhaForte123', 'senhaDiferente', 'não coincidem'],
])('rejeita dados inválidos antes de chamar autenticação', async (email, senha, confirmacao, erro) => {
  await expect(cadastrarConta(email, senha, confirmacao)).rejects.toThrow(erro)
  expect(auth.signUp).not.toHaveBeenCalled()
})

test('apresenta falhas de serviço e limite de envio sem exibir mensagem interna', async () => {
  auth.signUp.mockResolvedValue({ data: {}, error: { code: 'signup_disabled' } })
  await expect(cadastrarConta('teste@example.com', 'senhaForte123', 'senhaForte123')).rejects.toThrow('não está disponível')
  auth.signUp.mockResolvedValue({ data: {}, error: { status: 429, message: 'detalhe interno' } })
  await expect(cadastrarConta('teste@example.com', 'senhaForte123', 'senhaForte123')).rejects.toThrow('Muitas solicitações')
})

test('confirma código como email e rejeita códigos inválidos ou expirados', async () => {
  await expect(confirmarCadastro('teste@example.com', '')).rejects.toThrow('código recebido')
  expect(auth.verifyOtp).not.toHaveBeenCalled()
  auth.verifyOtp.mockResolvedValue({ error: null })
  await confirmarCadastro('teste@example.com', '123456')
  expect(auth.verifyOtp).toHaveBeenCalledExactlyOnceWith({ email: 'teste@example.com', token: '123456', type: 'email' })
  auth.verifyOtp.mockResolvedValue({ error: { message: 'expired' } })
  await expect(confirmarCadastro('teste@example.com', '123456')).rejects.toThrow('expirado')
})

test('reenvia somente confirmação de cadastro', async () => {
  auth.resend.mockResolvedValue({ error: null })
  await reenviarCadastro(' teste@example.com ')
  expect(auth.resend).toHaveBeenCalledExactlyOnceWith({ type: 'signup', email: 'teste@example.com' })
})

test('reenvio distingue limite e falha do serviço sem anunciar sucesso', async () => {
  auth.resend.mockResolvedValue({ error: { status: 429 } })
  await expect(reenviarCadastro('teste@example.com')).rejects.toThrow('Limite de envio')
  auth.resend.mockResolvedValue({ error: { status: 500, message: 'segredo interno' } })
  await expect(reenviarCadastro('teste@example.com')).rejects.toThrow('envio de e-mails precisa ser verificado')
})

test('envia apenas nome ao Auth; altura e medidas não viram metadados', async () => {
  auth.signUp.mockResolvedValue({ data: { session: null }, error: null })
  await cadastrarConta('teste@example.com', 'senhaForte123', 'senhaForte123', { nome: ' Breno ', altura_cm: 175 })
  expect(auth.signUp).toHaveBeenCalledExactlyOnceWith({ email: 'teste@example.com', password: 'senhaForte123', options: { data: { nome: 'Breno' } } })
})

test('recusa perfil inválido antes de enviar cadastro', async () => {
  await expect(cadastrarConta('teste@example.com', 'senhaForte123', 'senhaForte123', { nome: '', altura_cm: 175 })).rejects.toThrow('nome')
  await expect(cadastrarConta('teste@example.com', 'senhaForte123', 'senhaForte123', { nome: 'Breno', altura_cm: -1 })).rejects.toThrow('altura')
  expect(auth.signUp).not.toHaveBeenCalled()
})
