export type Tema = 'claro' | 'escuro'
const chave = 'vida-em-dia:tema-manual'
export function temaDoAparelho(): Tema {
  return typeof matchMedia === 'function' && matchMedia('(prefers-color-scheme: dark)').matches ? 'escuro' : 'claro'
}
export function temaManual(): Tema | undefined {
  try { const tema = localStorage.getItem(chave); return tema === 'claro' || tema === 'escuro' ? tema : undefined } catch { return undefined }
}
export function registrarTemaManual(tema: Tema) {
  localStorage.setItem(chave, tema)
  window.dispatchEvent(new Event('preferencia-tema-alterada'))
}

export function usarTemaAutomatico() {
  localStorage.removeItem(chave)
  window.dispatchEvent(new Event('preferencia-tema-alterada'))
}
