import 'fake-indexeddb/auto'
import { beforeEach, expect, test } from 'vitest'
import { abrirIdentidade, banco, tabela, criarBancoIdentidade } from './banco'
import { iniciarBanco } from './configuracoes'
import { criarRegistro } from './repositorio'
import { eliminarRegistro, processarRemocoesStorage, purgarRemovidos } from './eliminacao'
import { exportarBackup, importarBackup } from './backup'
import { executarSync, nomesSync, vincular, type Remoto, type Transporte } from '../sincronizacao/motor'
const usuario='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
beforeEach(async()=>{await abrirIdentidade(usuario);await banco.delete();await banco.open();await iniciarBanco()})
async function exemplo(){
 const r={...criarRegistro(),nome:'Segredo pessoal',ordem:1};await tabela('fichas').put(r)
 const ex={...criarRegistro(),nome:'Privado'};await banco.table('exercicios').put(ex)
 const foto={...criarRegistro(),exercicio_id:ex.id,imagem_local:new Blob(['foto']),miniatura_local:new Blob(['mini']),caminho_storage:usuario+'/foto.jpg'}
 await banco.table('fotos').put(foto)
 await banco.table('pendencias').put({chave:'snapshot',tabela:'exercicios',registro:{id:ex.id,dados:ex},usuario})
 await banco.table('conflitos').put({chave:'conflito',tabela:'exercicios',local:{id:ex.id,dados:ex},remoto:{id:'outro',dados:ex},usuario})
 return {r,ex,foto}
}
test('elimina conteúdo, blobs, fila/conflitos e bloqueia alterações; Storage offline mantém retry durável',async()=>{
 const {ex,foto}=await exemplo()
 await expect(eliminarRegistro('exercicios',ex.id,false)).rejects.toThrow('Confirme')
 await eliminarRegistro('exercicios',ex.id,true)
 for(const[nome,id]of [['exercicios',ex.id],['fotos',foto.id]])expect(Object.keys(await banco.table(nome).get(id)).sort()).toEqual(['id','user_id','apagado_em','eliminado_em'].sort())
 expect(await banco.table('pendencias').count()).toBe(0);expect(await banco.table('conflitos').count()).toBe(0)
 await expect(banco.table('exercicios').put(ex)).rejects.toThrow('eliminado')
 await expect(processarRemocoesStorage(usuario,async()=>{throw new Error('offline')})).rejects.toThrow('aguardam')
 banco.close();await banco.open()
 expect((await banco.table('remocoes_storage').toArray())[0].tentativas).toBe(1)
 const apagados:string[]=[];await processarRemocoesStorage(usuario,async p=>{apagados.push(p)})
 expect(apagados).toEqual([usuario+'/foto.jpg']);expect(await banco.table('remocoes_storage').count()).toBe(0)
})
test.each(['mesclar','substituir'] as const)('backup antigo não reativa eliminado (%s), inclusive timestamp futuro',async modo=>{
 const r={...criarRegistro(),nome:'Ficha',ordem:1};await tabela('fichas').put(r)
 const b=await exportarBackup();await eliminarRegistro('fichas',r.id,true)
 b.tabelas.fichas[0].atualizado_em='2999-01-01T00:00:00Z'
 await importarBackup(b,modo)
 expect((await tabela('fichas').get(r.id))?.eliminado_em).toBeTruthy()
 expect((await tabela('fichas').get(r.id))?.nome).toBeUndefined()
})
test('purga exata após 30 dias, sem purgar remoção recente ou de outro proprietário',async()=>{
 const agora=Date.parse('2026-10-21T12:00:00Z'),base={...criarRegistro(),nome:'Teste',ordem:1}
 for(const[id,idade,user_id]of [['vence',30,usuario],['recente',29,usuario],['outro',40,'outro']] as const)await tabela('fichas').put({...base,id,user_id,apagado_em:new Date(agora-idade*86400000).toISOString()})
 await purgarRemovidos(agora)
 expect((await tabela('fichas').get('vence'))?.nome).toBeUndefined()
 expect((await tabela('fichas').get('recente'))?.nome).toBe('Teste')
 expect((await tabela('fichas').get('outro'))?.nome).toBe('Teste')
})
test('abrir a identidade purga antes de devolver o banco às telas',async()=>{
 await tabela('fichas').put({...criarRegistro(),id:'abrir',nome:'Não deve permanecer',ordem:1,apagado_em:new Date(Date.now()-31*86400000).toISOString()})
 banco.close();await abrirIdentidade(usuario)
 const r=await banco.table('fichas').get('abrir');expect(r.eliminado_em).toBeTruthy();expect(Object.keys(r)).toHaveLength(4)
 const b=await exportarBackup(true,true);await importarBackup(b,'mesclar');expect((await banco.table('fichas').get('abrir')).nome).toBeUndefined()
})
test('retry de Storage preserva só o objeto que falhou após sucesso parcial',async()=>{
 await banco.table('remocoes_storage').bulkPut([{caminho:usuario+'/a.jpg',usuario,tentativas:0},{caminho:usuario+'/b.jpg',usuario,tentativas:0}])
 await expect(processarRemocoesStorage(usuario,async caminho=>{if(caminho.endsWith('/b.jpg'))throw new Error('rede')})).rejects.toThrow('aguardam')
 expect((await banco.table('remocoes_storage').toArray()).map(r=>r.caminho)).toEqual([usuario+'/b.jpg'])
 const chamadas:string[]=[];await processarRemocoesStorage(usuario,async p=>{chamadas.push(p)})
 expect(chamadas).toEqual([usuario+'/b.jpg'])
})
test('segundo aparelho e banco limpo restaurado descartam edição offline diante de eliminação remota',async()=>{
 const r={...criarRegistro(),nome:'Ficha',ordem:1};await tabela('fichas').put(r)
 const backup=await exportarBackup();await eliminarRegistro('fichas',r.id,true)
 const marcador=await banco.table('fichas').get(r.id)
 const nuvem=new Map<string,Remoto>();const transporte:Transporte={async enviar(nome,rs){for(const item of rs){const antigo=nuvem.get(nome+'/'+item.id);if(antigo?.eliminado_em&&!item.eliminado_em)throw new Error('Servidor rejeita ressurreição');if(!antigo?.eliminado_em)nuvem.set(nome+'/'+item.id,item)}},async baixar(nome,depois){return [...nuvem.entries()].filter(([k,r])=>k.startsWith(nome+'/')&&r.id>depois).map(([,r])=>r).sort((a,b)=>a.id.localeCompare(b.id))}}
 await vincular(usuario);await executarSync(usuario,transporte)
 const segundo=criarBancoIdentidade('teste-app03-segundo');await segundo.open();await segundo.table('fichas').put({...r,atualizado_em:'2999-01-01T00:00:00Z'})
 const recebido=nuvem.get('fichas/'+r.id)!.dados;await segundo.table('fichas').put(recebido)
 expect((await segundo.table('fichas').get(r.id)).nome).toBeUndefined();await segundo.delete()
 await banco.delete();await banco.open();await importarBackup(backup,'substituir');await vincular(usuario)
 await tabela('fichas').update(r.id,{atualizado_em:'2999-01-01T00:00:00Z'})
 await executarSync(usuario,transporte)
 expect((await tabela('fichas').get(r.id))?.eliminado_em).toBeTruthy()
 expect((await tabela('fichas').get(r.id))?.nome).toBeUndefined()
 expect(Object.keys(marcador)).toHaveLength(4)
 expect(nomesSync).not.toContain('remocoes_storage')
})
