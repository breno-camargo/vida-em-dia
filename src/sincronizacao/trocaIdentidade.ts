import { fecharIdentidade } from '../dados/banco'
import { novoUuid } from '../utilitarios/uuid'

const chave = 'vida-em-dia:troca-identidade'
export interface CanalIdentidade { postMessage(valor: unknown): void; close(): void; onmessage: ((evento: MessageEvent) => void) | null }
export function observarTrocas(canal: CanalIdentidade | undefined, aoTrocar: () => void) {
 if (canal) canal.onmessage = () => aoTrocar()
 return () => { if (canal) { canal.onmessage = null; canal.close() } }
}
let canal: BroadcastChannel | undefined
let reiniciando = false
let desmontar = () => undefined as void
export function prepararTrocaIdentidade(antesDeFechar: () => void) {
 desmontar = antesDeFechar
 canal = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel(chave) : undefined
 observarTrocas(canal, () => reiniciarIdentidade(false))
 window.addEventListener('storage', e => { if (e.key === chave) reiniciarIdentidade(false) })
}
export function reiniciarIdentidade(publicar = true) {
 if (reiniciando) return
 reiniciando = true
 // Retira as telas/assinaturas antes de fechar qualquer conexão.
 desmontar()
 fecharIdentidade()
 if (publicar) {
  canal?.postMessage({ troca: novoUuid() })
  localStorage.setItem(chave, novoUuid())
 }
 window.location.reload()
}
