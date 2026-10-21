import 'fake-indexeddb/auto'
import { expect, test } from 'vitest'
import { abrirIdentidade, banco, criarBancoIdentidade, fecharIdentidade, tabela } from '../dados/banco'
import { observarTrocas, type CanalIdentidade } from './trocaIdentidade'

test('mensagem entre duas abas fecha ambas as conexões A antes de abrir B', async () => {
 const a='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', b='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
 await abrirIdentidade(a)
 await tabela('fichas').put({id:'A',user_id:a,criado_em:'2026-10-21',atualizado_em:'2026-10-21',apagado_em:null,nome:'A',ordem:0})
 const primeira=banco, segunda=criarBancoIdentidade(primeira.name); await segunda.open()
 // Duas pontas do canal; apenas o transporte da mensagem é simulado.
 const canal1:CanalIdentidade={postMessage:()=>{},close:()=>{},onmessage:null}
 const canal2:CanalIdentidade={postMessage:()=>{},close:()=>{},onmessage:null}
 const limpar1=observarTrocas(canal1,()=>fecharIdentidade())
 const limpar2=observarTrocas(canal2,()=>segunda.close())
 canal1.onmessage?.({data:{troca:'B'}} as MessageEvent)
 canal2.onmessage?.({data:{troca:'B'}} as MessageEvent)
 expect(primeira.isOpen()).toBe(false);expect(segunda.isOpen()).toBe(false)
 await abrirIdentidade(b)
 expect(await tabela('fichas').get('A')).toBeUndefined()
 const novaSegunda=criarBancoIdentidade(banco.name); await novaSegunda.open()
 expect(await novaSegunda.table('fichas').get('A')).toBeUndefined()
 novaSegunda.close();limpar1();limpar2();await abrirIdentidade(null)
})
