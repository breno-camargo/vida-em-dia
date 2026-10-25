import 'fake-indexeddb/auto'
import { expect, test, vi } from 'vitest'
import { abrirIdentidade } from '../dados/banco'
const dados=vi.hoisted(()=>({id:'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',rpc:vi.fn()}))
vi.mock('./cliente',()=>({supabase:{rpc:dados.rpc},sessaoLocal:()=>({user:{id:dados.id}})}))
import { transporteSupabase } from './transporte'
test('cada push aborta antes da rede quando sessão e banco divergem',async()=>{
 await abrirIdentidade('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa')
 await expect(transporteSupabase.enviar('fichas',[])).rejects.toThrow('Nenhum registro foi enviado')
 expect(dados.rpc).not.toHaveBeenCalled()
})
