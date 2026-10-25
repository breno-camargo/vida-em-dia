import 'fake-indexeddb/auto'
import { afterEach, expect, test, vi } from 'vitest'
import { createHash } from 'node:crypto'
import { novoUuid } from '../utilitarios/uuid'
import { banco, tabela, abrirIdentidade, fecharIdentidade } from './banco'
import { criarRegistro } from './repositorio'
import { comExclusaoSync } from '../sincronizacao/armazenamento'
import { iniciarBanco } from './configuracoes'
import { iniciarBiblioteca, ampliarBiblioteca } from './biblioteca'
import { idsCatalogoWifi } from './idsCatalogoWifi'
import { criptografarBackup } from './backupCriptografado'

const nativa = globalThis.crypto
const simularHttp = () => vi.stubGlobal('crypto', { getRandomValues: nativa.getRandomValues.bind(nativa) })
afterEach(() => vi.unstubAllGlobals())
test('gera UUID v4 em HTTP usando aleatoriedade nativa', () => {
  simularHttp()
  const ids = Array.from({length:1000},()=>novoUuid())
  expect(new Set(ids).size).toBe(ids.length)
  for(const id of ids)expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/)
})
test('tabela Wi-Fi corresponde exatamente ao algoritmo original para todos os IDs',()=>{
  for(const [nome,id] of Object.entries(idsCatalogoWifi)){
    const b=createHash('sha256').update('vida-em-dia:catalogo:1:'+nome).digest().subarray(0,16)
    b[6]=(b[6]&15)|80;b[8]=(b[8]&63)|128
    const h=b.toString('hex')
    expect(id).toBe(`${h.slice(0,8)}-${h.slice(8,12)}-${h.slice(12,16)}-${h.slice(16,20)}-${h.slice(20)}`)
  }
})
test('inicia e amplia em HTTP com os mesmos IDs de uma instalação segura',async()=>{
  await banco.delete();await banco.open();await iniciarBanco();await iniciarBiblioteca();await ampliarBiblioteca()
  const seguro=(await tabela('exercicios').toArray()).map(e=>[e.nome,e.id]).sort()
  await banco.delete();await banco.open();simularHttp()
  await iniciarBanco();await iniciarBiblioteca();await ampliarBiblioteca()
  expect((await tabela('exercicios').toArray()).map(e=>[e.nome,e.id]).sort()).toEqual(seguro)
  expect(await ampliarBiblioteca()).toBe(0)
})
test('não enfraquece nem substitui a criptografia quando Web Crypto não está disponível',async()=>{
  simularHttp()
  await expect(criptografarBackup('{}','senha-ficticia-123')).rejects.toThrow('precisa de HTTPS')
})
test('visitante HTTP abre sem purga destrutiva e continua bloqueando operações sem Web Locks',async()=>{
  await banco.delete();await banco.open();await iniciarBanco()
  const removido={...criarRegistro(),data:'2000-01-01',peso:80,apagado_em:'2000-01-01T12:00:00Z'}
  await tabela('medidas_corporais').add(removido)
  vi.stubGlobal('window',{isSecureContext:false});vi.stubGlobal('navigator',{})
  fecharIdentidade();await abrirIdentidade(null)
  expect(await tabela('medidas_corporais').get(removido.id)).toEqual(removido)
  let executou=false
  await expect(comExclusaoSync(async()=>{executou=true})).rejects.toThrow('HTTPS')
  expect(executou).toBe(false)
})
