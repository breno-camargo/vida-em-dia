import 'fake-indexeddb/auto'
import Dexie from 'dexie'
import { beforeEach, expect, test } from 'vitest'
import { abrirIdentidade, banco, criarBancoIdentidade, tabela } from './banco'
import { consultarLegado, importarLegado } from './legado'
import { iniciarBanco } from './configuracoes'
import { criarRegistro } from './repositorio'
import { exportarBackup, importarBackup } from './backup'

const a='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',b='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
beforeEach(async()=>{await Dexie.delete('vida-em-dia');await abrirIdentidade(a);await banco.delete();await banco.open();await iniciarBanco()})
test('detecção não cria legado ausente nem atribui registros automaticamente',async()=>{
 expect(await consultarLegado(a)).toBeNull()
 expect((await indexedDB.databases()).some(d=>d.name==='vida-em-dia')).toBe(false)
})
test('legado só consulta proprietário atual; sem dono requer confirmação e origem fica intacta',async()=>{
 const antigo=criarBancoIdentidade('vida-em-dia');await antigo.open()
 const ficha=(id:string,dono:string|null)=>({...criarRegistro(dono),id,nome:id,ordem:0})
 await antigo.table('fichas').bulkPut([ficha('A',a),ficha('B',b),ficha('V',null)])
 await antigo.table('fotos').bulkPut([
 {...criarRegistro(a),id:'fotoA',tipo:'maquina',data:'2026-10-21',angulo:null,tamanho_bytes:1,imagem_local:new Blob(['A'],{type:'image/png'})},
 {...criarRegistro(b),id:'fotoB',tipo:'maquina',data:'2026-10-21',angulo:null,tamanho_bytes:1,imagem_local:new Blob(['B'],{type:'image/png'})}])
 const versao=antigo.verno;antigo.close()
 expect((await consultarLegado(a))?.fichas.map(r=>r.id)).toEqual(['A'])
 expect((await consultarLegado(a))?.fotos.map(r=>r.id)).toEqual(['fotoA'])
 expect(await tabela('fichas').count()).toBe(0)
 await expect(importarLegado(a,true,false)).rejects.toThrow('Confirme')
 await importarLegado(a,false,true)
 expect((await tabela('fichas').toArray()).map(r=>r.id)).toEqual(['A'])
 await importarLegado(a,true,true)
 expect((await tabela('fichas').get('V'))?.user_id).toBe(a)
 expect(await tabela('fichas').get('B')).toBeUndefined()
 const leitura=new Dexie('vida-em-dia',{autoOpen:false});await leitura.open()
 expect(leitura.verno).toBe(versao)
 expect((await leitura.table('fichas').get('V')).user_id).toBeNull()
 expect(await leitura.table('fichas').count()).toBe(3);leitura.close()
})
test('backup exclui fila e proprietários estranhos; importação força identidade atual',async()=>{
 await tabela('fichas').put({...criarRegistro(b),id:'estranha',nome:'B',ordem:0})
 let backup=await exportarBackup()
 expect(backup.tabelas.fichas).toEqual([])
 expect(backup.tabelas.pendencias).toBeUndefined()
 backup.tabelas.fichas.push({...criarRegistro(b),id:'importada',nome:'Original B',ordem:0})
 await importarBackup(backup,'mesclar')
 expect((await tabela('fichas').get('importada'))?.user_id).toBe(a)
 await abrirIdentidade(null);await banco.delete();await banco.open();await iniciarBanco()
 backup=await exportarBackup();backup.tabelas.fichas.push({...criarRegistro(a),id:'visitante',nome:'Visitante',ordem:0})
 await importarBackup(backup,'mesclar')
 expect((await tabela('fichas').get('visitante'))?.user_id).toBeNull()
})
