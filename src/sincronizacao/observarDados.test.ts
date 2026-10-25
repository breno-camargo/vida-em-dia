import 'fake-indexeddb/auto'
import Dexie, { RangeSet } from 'dexie'
import { expect, test, vi } from 'vitest'
import { observarDados } from './observarDados'

test('detecta insert/update não indexado/delete após commit sem ler o conteúdo das tabelas', async () => {
  const db=new Dexie('teste-observacao-dados');db.version(1).stores({series:'id',pendencias:'id'})
  await db.open()
  const avisar=vi.fn(),ler=vi.spyOn(db.table('series'),'toArray'),parar=observarDados(db.name,['series'],avisar)
  try {
    await db.table('series').put({id:'s',repeticoes:10});await vi.waitFor(()=>expect(avisar).toHaveBeenCalledTimes(1))
    await db.table('series').update('s',{repeticoes:12});await vi.waitFor(()=>expect(avisar).toHaveBeenCalledTimes(2))
    await db.table('series').delete('s');await vi.waitFor(()=>expect(avisar).toHaveBeenCalledTimes(3))
    expect(ler).not.toHaveBeenCalled()
    await db.table('pendencias').put({id:'fila'});expect(avisar).toHaveBeenCalledTimes(3)
    parar();await db.table('series').put({id:'s2'});expect(avisar).toHaveBeenCalledTimes(3)
  } finally {parar();await db.delete()}
})
test('outra conta, tabelas internas e transação abortada não geram aviso', async () => {
  const db=new Dexie('teste-observacao-abort');db.version(1).stores({series:'id'});await db.open()
  const avisar=vi.fn(),parar=observarDados(db.name,['series'],avisar)
  try {
    const range=new RangeSet('id')
    Dexie.on.storagemutated.fire({['idb://outra-conta/series/']:range})
    Dexie.on.storagemutated.fire({[`idb://${db.name}/pendencias/`]:range})
    await expect(db.transaction('rw','series',async()=>{await db.table('series').put({id:'s'});throw new Error('abortar')})).rejects.toThrow('abortar')
    expect(avisar).not.toHaveBeenCalled()
    // O mesmo formato de evento é utilizado para avisos vindos de outra aba.
    Dexie.on.storagemutated.fire({[`idb://${db.name}/series/:dels`]:range})
    expect(avisar).toHaveBeenCalledTimes(1)
  } finally {parar();await db.delete()}
})
test('reabrir o mesmo banco depois de falha de limpeza não perde a observação', async () => {
  const db=new Dexie('teste-observacao-reabrir');db.version(1).stores({series:'id'});await db.open()
  const avisar=vi.fn(),parar=observarDados(db.name,['series'],avisar)
  try {
    db.close();await db.open();await db.table('series').put({id:'s'})
    await vi.waitFor(()=>expect(avisar).toHaveBeenCalledTimes(1))
  } finally {parar();await db.delete()}
})
