import Dexie, { type ObservabilitySet } from 'dexie'

// O evento é emitido após o commit e também entre abas. Não relê o histórico
// inteiro só para descobrir que uma tabela foi alterada.
export function observarDados(nomeBanco: string, tabelas: readonly string[], aoAlterar: () => void) {
  const prefixos = tabelas.map(tabela => `idb://${nomeBanco}/${tabela}/`)
  const notificar = (partes: ObservabilitySet) => {
    if (Object.keys(partes).some(parte => prefixos.some(prefixo => parte.startsWith(prefixo)))) aoAlterar()
  }
  Dexie.on.storagemutated.subscribe(notificar)
  return () => Dexie.on.storagemutated.unsubscribe(notificar)
}
