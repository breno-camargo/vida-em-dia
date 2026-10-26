import { supabase } from './cliente'

export function requisitosSenha(senha: string) {
  return [
    { texto: 'Pelo menos 8 caracteres', atendido: Array.from(senha).length >= 8 },
    { texto: 'Uma letra maiúscula', atendido: /\p{Lu}/u.test(senha) },
    { texto: 'Um caractere especial (ex.: !, @, #)', atendido: /[\p{P}\p{S}]/u.test(senha) },
  ]
}

export async function alterarSenha(senha: string, confirmacao: string) {
  if (requisitosSenha(senha).some(r => !r.atendido)) throw new Error('Use pelo menos 8 caracteres, uma letra maiúscula e um caractere especial.')
  if (senha !== confirmacao) throw new Error('As senhas não coincidem. Confira a confirmação.')
  if (!supabase) throw new Error('A conexão com a conta não está disponível.')
  const { error } = await supabase.auth.updateUser({ password: senha })
  if (error) throw new Error('Não foi possível alterar a senha. Solicite um novo código se a sessão expirou e tente novamente.')
}
