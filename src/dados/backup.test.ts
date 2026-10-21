import 'fake-indexeddb/auto'
import {beforeEach,expect,test}from 'vitest'
import {banco,tabela}from './banco'
import {iniciarBanco}from './configuracoes'
import {iniciarBiblioteca}from './biblioteca'
import {criarRegistro}from './repositorio'
import {csvTabela,exportarBackup,importarBackup,lembreteBackup,validarBackup}from './backup'
beforeEach(async()=>{await banco.delete();await banco.open();await iniciarBanco();await iniciarBiblioteca()})
test('restaure JSON completo com fotos e registros excluídos',async()=>{
 const ex=(await tabela('exercicios').toArray())[0]
 const foto={...criarRegistro(),tipo:'maquina' as const,data:'2026-10-14',angulo:null,exercicio_id:ex.id,tamanho_bytes:3,imagem_local:new Blob(['abc'],{type:'image/jpeg'}),miniatura_local:new Blob(['xy'],{type:'image/jpeg'})}
 await tabela('fotos').add(foto)
 await tabela('medidas_corporais').add({...criarRegistro(),data:'2026-01-01',peso:80,apagado_em:'2026-10-01T12:00:00Z'})
 const b=JSON.parse(JSON.stringify(await exportarBackup(true,true)))
 await tabela('exercicios').clear();await tabela('fotos').clear();await tabela('medidas_corporais').clear()
 await importarBackup(b,'substituir')
 expect(await tabela('exercicios').count()).toBe(64)
 expect(await (await tabela('fotos').get(foto.id))!.imagem_local!.text()).toBe('abc')
 expect((await tabela('medidas_corporais').toArray())[0].apagado_em).toBeTruthy()
})
test('mescle por ID sem regredir dados nem duplicar a configuração principal',async()=>{
 const b=await exportarBackup(false),ex=b.tabelas.exercicios[0]
 await tabela('exercicios').update(ex.id,{nome:'Nome novo',atualizado_em:'2999-01-01T00:00:00Z'})
 b.tabelas.configuracoes[0].id='outro-id'
 await importarBackup(b,'mesclar')
 expect((await tabela('exercicios').get(ex.id))?.nome).toBe('Nome novo')
 expect(await tabela('configuracoes').count()).toBe(1)
 expect(await tabela('exercicios').count()).toBe(64)
})
test('cancele integralmente a mesclagem em conflito de datas',async()=>{
 const b=await exportarBackup(false)
 const antigo={...criarRegistro(),data:'2026-01-01',peso:80};await tabela('medidas_corporais').add(antigo)
 b.tabelas.medidas_corporais.push({...criarRegistro(),data:'2026-01-01',peso:90})
 b.tabelas.exercicios[0]={...b.tabelas.exercicios[0],nome:'Não deve entrar',atualizado_em:'2999-01-01T00:00:00Z'}
 await expect(importarBackup(b,'mesclar')).rejects.toThrow('Mesclagem cancelada')
 expect((await tabela('exercicios').get(b.tabelas.exercicios[0].id))?.nome).not.toBe('Não deve entrar')
 expect((await tabela('medidas_corporais').get(antigo.id))?.peso).toBe(80)
})
test('rejeite arquivo inválido antes de limpar qualquer dado',async()=>{
 const b=await exportarBackup()
 b.tabelas.exercicios[0].nome=5
 await expect(importarBackup(b,'substituir')).rejects.toThrow('Texto inválido')
 expect(await tabela('exercicios').count()).toBe(64)
 const outro=await exportarBackup();outro.versao=2 as 1
 expect(()=>validarBackup(outro)).toThrow('incompatível')
})
test('omita fotos do JSON e preserve imagens locais na mesclagem',async()=>{
 const foto={...criarRegistro(),tipo:'maquina' as const,data:'2026-10-14',angulo:null,tamanho_bytes:3,imagem_local:new Blob(['abc'],{type:'image/jpeg'})}
 await tabela('fotos').add(foto)
 const b=await exportarBackup(false)
 expect(b.tabelas.fotos[0].imagem_local).toBeUndefined()
 b.tabelas.fotos[0].atualizado_em='2999-01-01T00:00:00Z'
 await importarBackup(b,'mesclar')
 expect(await (await tabela('fotos').get(foto.id))!.imagem_local!.text()).toBe('abc')
})
test('escape CSV e lembre somente depois do intervalo sem backup (sync não reinicia prazo)',()=>{
 const csv=csvTabela([{...criarRegistro(),nome:'=SUM(A1)',nota:'linha;"aspas"\ntexto'}])
 expect(csv).toContain("'=SUM(A1)");expect(csv).toContain('""aspas""')
 const c={criado_em:'2026-01-01T00:00:00Z',dias_lembrete_backup:14}
 expect(lembreteBackup(c,Date.parse('2026-01-14T00:00:00Z'))).toBe(false)
 expect(lembreteBackup(c,Date.parse('2026-01-15T00:00:00Z'))).toBe(true)
 expect(lembreteBackup({...c,ultimo_backup:'2026-01-10T00:00:00Z'},Date.parse('2026-01-15T00:00:00Z'))).toBe(false)
 expect(lembreteBackup({...c,ultima_sincronizacao:'2026-01-10T00:00:00Z'},Date.parse('2026-01-15T00:00:00Z'))).toBe(true)
})

test('recupere fotos ausentes com a mesma versão sem sobrescrever alterações recentes',async()=>{
 const foto={...criarRegistro(),tipo:'maquina' as const,data:'2026-10-14',angulo:null,tamanho_bytes:3,imagem_local:new Blob(['abc'],{type:'image/jpeg'})}
 await tabela('fotos').add(foto)
 const completo=await exportarBackup(true),semFotos=await exportarBackup(false)
 await importarBackup(semFotos,'substituir')
 expect((await tabela('fotos').get(foto.id))?.imagem_local).toBeUndefined()
 await importarBackup(completo,'mesclar')
 expect(await (await tabela('fotos').get(foto.id))!.imagem_local!.text()).toBe('abc')
})
