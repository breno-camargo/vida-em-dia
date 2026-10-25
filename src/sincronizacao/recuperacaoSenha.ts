const chave = 'vida-em-dia:recuperacao-senha'

// Somente o identificador da sessão verificada; nunca código ou senha.
export function marcarRecuperacaoSenha(usuario: string) {
  localStorage.setItem(chave, usuario)
  const tema = typeof document !== 'undefined' ? document.documentElement.dataset.tema : undefined
  if (tema === 'claro' || tema === 'escuro') localStorage.setItem(chave + ':tema', tema)
}
export function recuperacaoSenhaPendente(usuario?: string | null) {
  if (!usuario || typeof localStorage === 'undefined') return false
  try { return localStorage.getItem(chave) === usuario } catch { return false }
}
export function limparRecuperacaoSenha() {
  if (typeof localStorage !== 'undefined') { localStorage.removeItem(chave); localStorage.removeItem(chave + ':tema') }
}

export function temaRecuperacaoSenha() {
  try { const tema = localStorage.getItem(chave + ':tema'); return tema === 'claro' || tema === 'escuro' ? tema : undefined } catch { return undefined }
}
