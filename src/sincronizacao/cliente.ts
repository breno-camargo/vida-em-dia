import { createClient } from '@supabase/supabase-js'
const url = import.meta.env.VITE_SUPABASE_URL?.trim()
const chave = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim() || import.meta.env.VITE_SUPABASE_ANON_KEY?.trim()
export const supabase = url && chave ? createClient(url, chave, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
}) : null
