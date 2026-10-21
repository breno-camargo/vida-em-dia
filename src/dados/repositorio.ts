import { tabela, banco, identidadeAtual, geracaoAtual } from './banco'
import type { Registro, Tabelas } from './modelos'

export function criarRegistro(user_id: string | null = identidadeAtual()): Registro {
  const agora = new Date().toISOString()
  return { id: crypto.randomUUID(), user_id, criado_em: agora, atualizado_em: agora, apagado_em: null }
}
export function repositorio<K extends keyof Tabelas>(nome: K) {
  const dados = tabela(nome)
  const dono = identidadeAtual(), geracao = geracaoAtual(), instancia = banco
  const conferir = () => { if (geracao !== geracaoAtual() || banco !== instancia || !instancia.isOpen()) throw new Error('O espaço local mudou. Reabra esta tela.') }
  return {
    listar: async () => { conferir(); const itens = await dados.filter(item => item.apagado_em === null && item.user_id === dono).toArray(); conferir(); return itens },
    obter: async (id: string) => { conferir(); const item = await dados.get(id); conferir(); return item?.user_id === dono ? item : undefined },
    salvar: async (registro: Tabelas[K]) => { conferir(); const existente=await dados.get(registro.id); conferir(); if (registro.user_id !== dono || (existente && existente.user_id !== dono)) throw new Error('Registro de outro proprietário.'); return dados.put({ ...registro, atualizado_em: new Date().toISOString() }) },
    apagar: async (id: string) => {
      conferir()
      const registro = await dados.get(id)
      conferir()
      if (registro?.user_id === dono) await dados.put({ ...registro, apagado_em: new Date().toISOString(), atualizado_em: new Date().toISOString() })
    },
  }
}
