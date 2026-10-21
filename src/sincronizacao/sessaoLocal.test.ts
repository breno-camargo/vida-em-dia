import 'fake-indexeddb/auto'
import { expect, test } from 'vitest'
import { interpretarSessaoLocal } from './cliente'
import { abrirIdentidade, banco, tabela } from '../dados/banco'
import { criarRegistro } from '../dados/repositorio'

test('sessão local expirada mantém banco da conta offline sem refresh ou rebaixamento',async()=>{
 const usuario='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
 const sessao=interpretarSessaoLocal(JSON.stringify({expires_at:1,user:{id:usuario}}))
 expect(sessao?.user.id).toBe(usuario)
 await abrirIdentidade(sessao!.user.id)
 await tabela('fichas').put({...criarRegistro(),id:'offline',nome:'Offline',ordem:0})
 expect(banco.name).toBe('vida-em-dia:'+usuario)
 expect((await tabela('fichas').get('offline'))?.user_id).toBe(usuario)
 expect(interpretarSessaoLocal('{invalido')).toBeNull()
})
