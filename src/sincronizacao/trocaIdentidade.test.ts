import 'fake-indexeddb/auto'
import { expect, test } from 'vitest'
import { abrirIdentidade, banco, criarBancoIdentidade, fecharIdentidade, tabela } from '../dados/banco'
import { observarTrocas } from './trocaIdentidade'

test('mensagem entre duas abas fecha ambas as conexões A antes de abrir B', async () => {
 const a='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', b='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
 await abrirIdentidade(a)
 await tabela('fichas').put({id:'A',user_id:a,criado_em:'2026-10-21',atualizado_em:'2026-10-21',apagado_em:null,nome:'A',ordem:0})
 const primeira=banco, segunda=criarBancoIdentidade(primeira.name); await segunda.open()
 const nome='teste-identidade-'+crypto.randomUUID()
 const canal1=new BroadcastChannel(nome),canal2=new BroadcastChannel(nome)
 let recebido!:()=>void
 const mensagem=new Promise<void>(resolve=>{recebido=resolve})
 const limpar1=observarTrocas(canal1,()=>fecharIdentidade())
 const limpar2=observarTrocas(canal2,()=>{segunda.close();recebido()})
 // A aba que inicia a troca fecha imediatamente; a outra reage ao canal real.
 fecharIdentidade();canal1.postMessage({troca:'B'});await mensagem
 expect(primeira.isOpen()).toBe(false);expect(segunda.isOpen()).toBe(false)
 await abrirIdentidade(b)
 expect(await tabela('fichas').get('A')).toBeUndefined()
 const novaSegunda=criarBancoIdentidade(banco.name); await novaSegunda.open()
 expect(await novaSegunda.table('fichas').get('A')).toBeUndefined()
 novaSegunda.close();limpar1();limpar2();await abrirIdentidade(null)
})
