import 'fake-indexeddb/auto'
import { webcrypto } from 'node:crypto'
import { beforeEach, expect, test } from 'vitest'
import { banco, tabela } from './banco'
import { iniciarBanco } from './configuracoes'
import { iniciarBiblioteca } from './biblioteca'
import { criarRegistro } from './repositorio'
import { exportarBackup, importarBackup, validarBackup } from './backup'
import { conferirTamanho, criptografarBackup, decifrarBackup, lerJsonBackup, LIMITE_BACKUP, validarSenhaBackup } from './backupCriptografado'
Object.defineProperty(globalThis, 'crypto', { value: webcrypto, configurable: true })
const senha = 'senha longa de teste'
beforeEach(async()=>{await banco.delete();await banco.open();await iniciarBanco();await iniciarBiblioteca()})
test('ida e volta real e compatibilidade com JSON legível antigo, proprietário forçado',async()=>{
 const b=await exportarBackup();b.tabelas.exercicios[0].user_id='outro'
 const json=JSON.stringify(b),e=await criptografarBackup(json,senha)
 expect(await decifrarBackup(e,senha)).toBe(json)
 await importarBackup(lerJsonBackup(await decifrarBackup(e,senha)),'substituir')
 expect((await tabela('exercicios').toArray()).every(r=>r.user_id===null)).toBe(true)
 await importarBackup(lerJsonBackup(json),'mesclar')
 expect(validarBackup(lerJsonBackup(json)).versao).toBe(1)
 const outro=await criptografarBackup(json,senha);expect(outro.salt).not.toBe(e.salt);expect(outro.iv).not.toBe(e.iv)
})
test('senha errada, byte no corpo e byte no cabeçalho autenticado têm o mesmo erro',async()=>{
 const e=await criptografarBackup('{}',senha)
 const alterar=(s:string)=>{const b=Buffer.from(s,'base64');b[0]^=1;return b.toString('base64')}
 for(const [valor,pwd]of [[e,'errada'],[{...e,dados:alterar(e.dados)},senha],[{...e,salt:alterar(e.salt)},senha],[{...e,iv:alterar(e.iv)},senha],[{...e,kdf:{...e.kdf,iteracoes:600001}},senha]] as const){await expect(decifrarBackup(valor,pwd)).rejects.toThrow('Senha incorreta ou arquivo alterado.')}
})
test('rejeita versão e limites de cabeçalho antes de KDF',async()=>{
 const e=await criptografarBackup('{}',senha)
 for(const valor of [{...e,versao:2},{...e,salt:'AA=='},{...e,iv:'AA=='},{...e,kdf:{...e.kdf,iteracoes:599999}},{...e,kdf:{...e.kdf,iteracoes:1000001}}])await expect(decifrarBackup(valor,senha)).rejects.toThrow('Formato ou versão não reconhecidos.')
 expect(()=>conferirTamanho(LIMITE_BACKUP+1)).toThrow('250 MB')
 expect(()=>validarSenhaBackup('curta','curta')).toThrow('12 caracteres')
 expect(()=>validarSenhaBackup(senha,'diferente')).toThrow('não coincidem')
})
test('backup padrão exclui removidos e dependentes; opção explícita inclui',async()=>{
 const ex=(await tabela('exercicios').toArray())[0]
 await tabela('fotos').add({...criarRegistro(),tipo:'maquina',data:'2026-10-21',angulo:null,exercicio_id:ex.id,tamanho_bytes:3,imagem_local:new Blob(['abc'],{type:'image/jpeg'})})
 await tabela('exercicios').update(ex.id,{apagado_em:new Date().toISOString()})
 const b=await exportarBackup();expect(b.tabelas.exercicios.some(r=>r.id===ex.id)).toBe(false);expect(b.tabelas.fotos).toHaveLength(0);validarBackup(b)
 expect((await exportarBackup(true,true)).tabelas.exercicios.some(r=>r.id===ex.id)).toBe(true)
})
test('texto decifrado/legível maior que 250 MB é recusado antes do JSON.parse',()=>{
 // O texto é JSON inválido: erro de tamanho prova que o parser não foi chamado.
 expect(()=>lerJsonBackup('x'.repeat(LIMITE_BACKUP+1))).toThrow('250 MB')
})
test.each(['mesclar','substituir'] as const)('backup → remover → restaurar em %s preserva exclusão mais recente',async modo=>{
 const b=await exportarBackup(),id=b.tabelas.exercicios[0].id,quando='2999-01-01T00:00:00.000Z'
 await tabela('exercicios').update(id,{apagado_em:quando,atualizado_em:quando})
 await importarBackup(b,modo)
 expect((await tabela('exercicios').get(id))?.apagado_em).toBe(quando)
})
test('arquivo sintético grande: WebCrypto real, tamanho e consumo de memória',async()=>{
 const inicial=process.memoryUsage().rss, inicio=performance.now()
 const texto=JSON.stringify({sintetico:'x'.repeat(32*1048576)})
 const e=await criptografarBackup(texto,senha)
 const claro=await decifrarBackup(e,senha)
 expect(lerJsonBackup(claro)).toEqual({sintetico:'x'.repeat(32*1048576)})
 console.info('APP-04 memória sintética',JSON.stringify({claroBytes:Buffer.byteLength(claro),arquivoBytes:Buffer.byteLength(JSON.stringify(e)),rssInicial:inicial,rssFinal:process.memoryUsage().rss,picoRss:process.resourceUsage().maxRSS*1024,ms:Math.round(performance.now()-inicio)}))
},30000)
