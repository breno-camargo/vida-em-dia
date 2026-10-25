import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { marcarRecuperacaoSenha, recuperacaoSenhaPendente, limparRecuperacaoSenha } from './recuperacaoSenha'
const dados=new Map<string,string>()
beforeEach(()=>{dados.clear();vi.stubGlobal('localStorage',{setItem:(k:string,v:string)=>dados.set(k,v),getItem:(k:string)=>dados.get(k)??null,removeItem:(k:string)=>dados.delete(k)})})
afterEach(()=>vi.unstubAllGlobals())
test('a etapa verificada sobrevive ao recarregamento e só vale para a conta correta',async()=>{
  marcarRecuperacaoSenha('33333333-3333-4333-8333-333333333333')
  vi.resetModules()
  const reaberto=await import('./recuperacaoSenha')
  expect(reaberto.recuperacaoSenhaPendente('33333333-3333-4333-8333-333333333333')).toBe(true)
  expect(reaberto.recuperacaoSenhaPendente('44444444-4444-4444-8444-444444444444')).toBe(false)
  expect(reaberto.recuperacaoSenhaPendente(null)).toBe(false)
  expect([...dados.values()]).toEqual(['33333333-3333-4333-8333-333333333333'])
})
test('concluir/cancelar limpa somente a etapa, sem remover a sessão da conta',()=>{
  dados.set('sessao-do-sdk','ficticia')
  marcarRecuperacaoSenha('33333333-3333-4333-8333-333333333333');limparRecuperacaoSenha()
  expect(recuperacaoSenhaPendente('33333333-3333-4333-8333-333333333333')).toBe(false)
  expect(dados.get('sessao-do-sdk')).toBe('ficticia')
})
