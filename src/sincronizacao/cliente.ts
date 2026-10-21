import { createClient } from '@supabase/supabase-js'
import type { User } from '@supabase/supabase-js'
const url = import.meta.env.VITE_SUPABASE_URL?.trim()
const chave = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim() || import.meta.env.VITE_SUPABASE_ANON_KEY?.trim()
export const supabase = url && chave ? createClient(url, chave, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
}) : null

// Mesma chave padrão do SDK. Leitura local: não pede refresh nem validação de rede.
export function sessaoLocal(): { user: User } | null {
 if (!url || typeof localStorage === 'undefined') return null
 try {
  const chaveSessao = `sb-${new URL(url).hostname.split('.')[0]}-auth-token`
  return interpretarSessaoLocal(localStorage.getItem(chaveSessao))
 } catch { return null }
}

export function interpretarSessaoLocal(serializada: string | null): { user: User } | null {
 try {
  const sessao=JSON.parse(serializada ?? 'null')
  // Expiração não elimina acesso aos dados offline; o servidor decide a autorização de rede.
  return sessao?.user && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(sessao.user.id) ? {user:sessao.user} : null
 }catch{return null}
}
