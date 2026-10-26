import 'fake-indexeddb/auto'
import { beforeEach, expect, test } from 'vitest'
import { banco, tabela } from './banco'
import { iniciarBanco } from './configuracoes'
import { criarRegistro } from './repositorio'
import { configurarAgua, registrarGarrafa } from './agua'
import { validarDominioBackup } from './validacaoBackup'
beforeEach(async () => { await banco.delete(); await banco.open(); await iniciarBanco() })
test('capacidade alterada preserva volumes e desfazer retira o último volume real', async () => {
 await configurarAgua('garrafa_ml', 500)
 await Promise.all([registrarGarrafa('2026-10-25'), registrarGarrafa('2026-10-25')])
 await configurarAgua('garrafa_ml', 750)
 await registrarGarrafa('2026-10-25')
 let r = (await tabela('agua_dia').toArray())[0]
 expect(r.ml).toBe(1750); expect(r.garrafas_ml).toEqual([500,500,750])
 await registrarGarrafa('2026-10-25', true)
 r = (await tabela('agua_dia').toArray())[0]
 expect(r.ml).toBe(1000); expect(r.garrafas_ml).toEqual([500,500])
 await registrarGarrafa('2026-10-24')
 expect((await tabela('agua_dia').where('data').equals('2026-10-25').first())?.ml).toBe(1000)
})
test('registro legado sem garrafas mantém volume e não inventa contagem', async () => {
 await tabela('agua_dia').put({...criarRegistro(),data:'2026-10-25',ml:300})
 await configurarAgua('garrafa_ml',500); await registrarGarrafa('2026-10-25'); await registrarGarrafa('2026-10-25',true)
 expect((await tabela('agua_dia').toArray())[0].ml).toBe(300)
})
test('recusa capacidade inválida, falta de configuração e registros duplicados', async () => {
 await expect(configurarAgua('garrafa_ml',0)).rejects.toThrow()
 await expect(registrarGarrafa('2026-10-25')).rejects.toThrow()
 await configurarAgua('garrafa_ml',500)
 for(let i=0;i<2;i++)await tabela('agua_dia').put({...criarRegistro(),data:'2026-10-25',ml:100})
 await expect(registrarGarrafa('2026-10-25')).rejects.toThrow('duplicados')
})
test('backup aceita legado e novos volumes e recusa volume inconsistente', () => {
 expect(()=>validarDominioBackup('agua_dia',{...criarRegistro(),ml:300})).not.toThrow()
 expect(()=>validarDominioBackup('agua_dia',{...criarRegistro(),ml:1250,garrafas_ml:[500,750]})).not.toThrow()
 expect(()=>validarDominioBackup('agua_dia',{...criarRegistro(),ml:500,garrafas_ml:[750]})).toThrow()
 expect(()=>validarDominioBackup('configuracoes',{...criarRegistro(),garrafa_ml:0})).toThrow()
})
