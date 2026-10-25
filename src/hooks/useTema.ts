import { useEffect, useState, useSyncExternalStore } from 'react'
import { temaDoAparelho, temaManual } from '../utilitarios/tema'
export function useTema() {
  const [tema, definirTema] = useState(() => temaManual() ?? temaDoAparelho())
  useEffect(() => {
    const consulta = matchMedia('(prefers-color-scheme: dark)')
    const atualizar = () => definirTema(temaManual() ?? temaDoAparelho())
    consulta.addEventListener('change', atualizar)
    window.addEventListener('preferencia-tema-alterada', atualizar)
    window.addEventListener('storage', atualizar)
    window.addEventListener('pageshow', atualizar)
    document.addEventListener('visibilitychange', atualizar)
    return () => { consulta.removeEventListener('change', atualizar); window.removeEventListener('preferencia-tema-alterada', atualizar); window.removeEventListener('storage', atualizar); window.removeEventListener('pageshow', atualizar); document.removeEventListener('visibilitychange', atualizar) }
  }, [])
  return tema
}

const assinar = (atualizar: () => void) => {
  window.addEventListener('preferencia-tema-alterada', atualizar)
  window.addEventListener('storage', atualizar)
  return () => { window.removeEventListener('preferencia-tema-alterada', atualizar); window.removeEventListener('storage', atualizar) }
}
const lerModo = () => temaManual() ?? 'automatico'
export function useModoTema() { return useSyncExternalStore(assinar, lerModo, () => 'automatico') }
