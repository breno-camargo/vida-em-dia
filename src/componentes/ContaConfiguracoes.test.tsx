import { beforeEach, expect, test, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
const estado = vi.hoisted(() => ({ usuario: null as { email: string } | null, carregando: false, vinculado: false, recuperando: false }))
const signUp = vi.hoisted(() => vi.fn())
vi.mock('../sincronizacao/cliente', () => ({ supabase: { auth: { signUp } } }))
vi.mock('../sincronizacao/estado', () => ({ useConta: () => estado, confirmarVinculo: vi.fn(), definirRecuperacao: vi.fn(), sairConta: vi.fn(), sincronizar: vi.fn() }))
vi.mock('dexie-react-hooks', () => ({ useLiveQuery: () => undefined }))
vi.mock('./RevisaoSincronizacao', () => ({ RevisaoSincronizacao: () => null }))
import { ContaConfiguracoes } from './ContaConfiguracoes'

beforeEach(() => { estado.usuario = null; estado.recuperando=false; signUp.mockClear() })

test('entrada oferece cadastro sem disparar chamada ao montar', () => {
  const html = renderToStaticMarkup(<ContaConfiguracoes entrada />)
  expect(html).toContain('Criar conta')
  expect(html).toContain('Esqueci minha senha')
  expect(html).not.toContain('criada pelo administrador')
  expect(signUp).not.toHaveBeenCalled()
})

test('conta autenticada mantém conexão dos dados explícita em vez de novo cadastro', () => {
  estado.usuario = { email: 'teste@example.com' }
  const html = renderToStaticMarkup(<ContaConfiguracoes />)
  expect(html).toContain('Conectar meus dados')
  expect(html).not.toContain('Criar conta')
  expect(signUp).not.toHaveBeenCalled()
})
test('sessão de recuperação restaurada abre nova senha, sem liberar conexão dos dados', () => {
  estado.usuario={email:'teste@example.com'};estado.recuperando=true
  const html=renderToStaticMarkup(<ContaConfiguracoes entrada />)
  expect(html).toContain('Nova senha')
  expect(html).toContain('Salvar nova senha')
  expect(html).not.toContain('Conectar meus dados')
})

test('nome pode ser informado mesmo antes de conectar os dados, na conta resumida', () => {
 estado.usuario = { email: 'teste@example.com' }
 const html = renderToStaticMarkup(<ContaConfiguracoes resumida />)
 expect(html).toContain('Nome completo')
 expect(html).toContain('Informar nome')
 expect(html).toContain('Conectar meus dados')
})
