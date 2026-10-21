import 'fake-indexeddb/auto'
import Dexie from 'dexie'
import { beforeEach, expect, test } from 'vitest'
import { abrirIdentidade, banco, tabela } from './banco'
import { iniciarBanco } from './configuracoes'
import { criarRegistro } from './repositorio'
import { apagarBancoAtual, apagarLegado, excluirContaConfirmada } from './limpezaAparelho'
const usuario='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
beforeEach(async()=>{await abrirIdentidade(usuario);await banco.delete();await banco.open();await iniciarBanco();await tabela('fichas').put({...criarRegistro(),id:'ficha',nome:'Preservar',ordem:1})})
test('fila pendente exige confirmação e limpeza não atinge visitante ou legado',async()=>{
 const visitante=new Dexie('vida-em-dia:visitante-teste-app03');visitante.version(1).stores({itens:'id'});await visitante.open();await visitante.table('itens').put({id:'visitante'})
 const legado=new Dexie('vida-em-dia');legado.version(1).stores({itens:'id'});await legado.open();await legado.table('itens').put({id:'legado'})
 await banco.table('pendencias').put({chave:'envio',usuario})
 await expect(apagarBancoAtual(false,true)).rejects.toThrow('Confirme')
 await expect(apagarBancoAtual(true,false)).rejects.toThrow('pendentes')
 expect((await tabela('fichas').get('ficha'))?.nome).toBe('Preservar')
 const nome=banco.name;await apagarBancoAtual(true,true)
 expect((await indexedDB.databases()).some(d=>d.name===nome)).toBe(false)
 expect(await visitante.table('itens').count()).toBe(1);expect(await legado.table('itens').count()).toBe(1)
 await expect(apagarLegado('')).rejects.toThrow('separadamente')
 legado.close();await apagarLegado('APAGAR LEGADO');expect((await indexedDB.databases()).some(d=>d.name==='vida-em-dia')).toBe(false)
 await visitante.delete()
})
test('falha parcial/rede preserva banco local; somente sucesso confirmado o remove',async()=>{
 await expect(excluirContaConfirmada(async()=>({concluido:false,etapa:'auth'}))).rejects.toThrow('incompleta')
 expect(await tabela('fichas').count()).toBe(1)
 await expect(excluirContaConfirmada(async()=>{throw new Error('rede')})).rejects.toThrow('rede')
 expect(await tabela('fichas').count()).toBe(1)
 const nome=banco.name;await excluirContaConfirmada(async()=>({concluido:true}))
 expect((await indexedDB.databases()).some(d=>d.name===nome)).toBe(false)
})
test('sucesso tardio de A não apaga o banco de B após troca de identidade',async()=>{
 const outra='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
 await expect(excluirContaConfirmada(async()=>{await abrirIdentidade(outra);await iniciarBanco();await tabela('fichas').put({...criarRegistro(),id:'B',nome:'Somente B',ordem:1});return{concluido:true}})).rejects.toThrow('identidade mudou')
 expect((await tabela('fichas').get('B'))?.nome).toBe('Somente B')
})
