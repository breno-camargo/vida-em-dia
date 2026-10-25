const chave = 'vida-em-dia:recuperacao-senha'

// Somente o identificador da sessão verificada; nunca código ou senha.
export function marcarRecuperacaoSenha(usuario: string) {
  localStorage.setItem(chave, usuario)
}
export function recuperacaoSenhaPendente(usuario?: string | null) {
  if (!usuario || typeof localStorage === 'undefined') return false
  try { return localStorage.getItem(chave) === usuario } catch { return false }
}
export function limparRecuperacaoSenha() {
  if (typeof localStorage !== 'undefined') localStorage.removeItem(chave)
}
