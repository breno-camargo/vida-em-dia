import 'fake-indexeddb/auto'
import { afterEach, expect, test, vi } from 'vitest'

const mocks=vi.hoisted(()=>({preparar:vi.fn().mockResolvedValue(undefined),contar:vi.fn().mockResolvedValue(0)}))
vi.mock('./cliente',()=>({supabase:{auth:{onAuthStateChange:vi.fn()}},sessaoLocal:()=>({user:{id:'11111111-1111-4111-8111-111111111111'}}),removerSessaoLocal:vi.fn()}))
vi.mock('./motor',async original=>({...await original<typeof import('./motor')>(),prepararFila:mocks.preparar,contarPendencias:mocks.contar}))

afterEach(()=>vi.unstubAllGlobals())

test('iniciarConta agenda a fila, acompanha edições e desliga o observador ao trocar de identidade',async()=>{
  vi.stubGlobal('window',{isSecureContext:true,addEventListener:vi.fn()})
  vi.stubGlobal('document',{visibilityState:'visible',addEventListener:vi.fn()})
  vi.stubGlobal('navigator',{onLine:true,locks:{request:async(_nome:string,acao:()=>unknown)=>acao()}})
  const dados=await import('../dados/banco')
  const {abrirIdentidade,tabela}=dados
  await abrirIdentidade('11111111-1111-4111-8111-111111111111')
  const banco=dados.banco
  await banco.table('controle').put({chave:'usuario',valor:'11111111-1111-4111-8111-111111111111'})
  const {iniciarConta}=await import('./estado')
  try {
    await iniciarConta()
    await vi.waitFor(()=>expect(mocks.preparar).toHaveBeenCalledTimes(1),{timeout:2000})
    mocks.preparar.mockClear()
    await banco.table('series_treino').put({id:'serie-observacao',user_id:'11111111-1111-4111-8111-111111111111',repeticoes:10})
    await vi.waitFor(()=>expect(mocks.preparar).toHaveBeenCalledTimes(1),{timeout:2000})
    mocks.preparar.mockClear()
    banco.close();await banco.open()
    await tabela('series_treino').update('serie-observacao',{repeticoes:12})
    await vi.waitFor(()=>expect(mocks.preparar).toHaveBeenCalledTimes(1),{timeout:2000})
    mocks.preparar.mockClear()
    await abrirIdentidade('22222222-2222-4222-8222-222222222222')
    const {banco:outro}=await import('../dados/banco')
    await outro.table('series_treino').put({id:'outra-serie'})
    await new Promise(resolve=>setTimeout(resolve,650))
    expect(mocks.preparar).not.toHaveBeenCalled()
    await outro.delete()
  } finally {await banco.delete()}
})
