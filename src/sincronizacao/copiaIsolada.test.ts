import { describe, expect, it } from 'vitest'
import { supabase, sessaoLocal } from './cliente'

describe('cópia local para novo visual', () => {
  it('mantém o backend e a sessão Supabase desabilitados', () => {
    expect(import.meta.env.VITE_SUPABASE_URL).toBe('')
    expect(import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY).toBe('')
    expect(import.meta.env.VITE_SUPABASE_ANON_KEY).toBe('')
    expect(supabase).toBeNull()
    expect(sessaoLocal()).toBeNull()
  })
})
