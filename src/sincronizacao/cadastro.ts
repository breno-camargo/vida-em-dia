import { supabase } from './cliente'
import { validarPerfilCadastro, type PerfilCadastro } from '../dados/perfilCadastro'

export async function cadastrarConta(email: string, senha: string, confirmacao: string, perfil?: PerfilCadastro) {
  if (!supabase) throw new Error('A conexão com a conta ainda não foi configurada.')
  const endereco = email.trim()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(endereco)) throw new Error('Informe um e-mail válido.')
  if (senha.length < 8) throw new Error('Use uma senha com pelo menos 8 caracteres.')
  if (senha !== confirmacao) throw new Error('As senhas não coincidem.')
  if (perfil) validarPerfilCadastro(perfil)
  const { data, error } = await supabase.auth.signUp({ email: endereco, password: senha, ...(perfil ? { options: { data: { nome: perfil.nome.trim() } } } : {}) })
  if (error) {
    if (error.code === 'signup_disabled') throw new Error('O cadastro de novas contas ainda não está disponível. Tente novamente mais tarde.')
    if (error.status === 429 || error.code === 'over_email_send_rate_limit') throw new Error('Muitas solicitações. Aguarde antes de tentar novamente.')
    if (error.code === 'weak_password') throw new Error('Escolha uma senha mais forte, com letras, números e símbolos.')
    throw new Error('Não foi possível criar a conta. Confira os dados e a conexão. Se já tem conta, use Entrar ou Esqueci minha senha.')
  }
  // Autenticação não vincula o aparelho, não escreve registros nem executa sync.
  return data.session ? 'conectada' as const : 'confirmar' as const
}

export async function confirmarCadastro(email: string, codigo: string) {
  if (!supabase) throw new Error('A conexão com a conta ainda não foi configurada.')
  if (!/^\d{6,10}$/.test(codigo.trim())) throw new Error('Informe o código recebido por e-mail.')
  const { error } = await supabase.auth.verifyOtp({ email: email.trim(), token: codigo.trim(), type: 'email' })
  if (error) throw new Error('Código inválido ou expirado. Confira o e-mail ou solicite outro código.')
}

export async function reenviarCadastro(email: string) {
  if (!supabase) throw new Error('A conexão com a conta ainda não foi configurada.')
  const { error } = await supabase.auth.resend({ type: 'signup', email: email.trim() })
  if (error) throw new Error('Não foi possível reenviar. Aguarde um pouco e tente novamente.')
}
