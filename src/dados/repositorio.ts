import { tabela } from './banco'
import type { Registro, Tabelas } from './modelos'

export function criarRegistro(user_id: string | null = null): Registro {
  const agora = new Date().toISOString()
  return { id: crypto.randomUUID(), user_id, criado_em: agora, atualizado_em: agora, apagado_em: null }
}
export function repositorio<K extends keyof Tabelas>(nome: K) {
  const dados = tabela(nome)
  return {
    listar: () => dados.filter(item => item.apagado_em === null).toArray(),
    obter: (id: string) => dados.get(id),
    salvar: (registro: Tabelas[K]) => dados.put({ ...registro, atualizado_em: new Date().toISOString() }),
    apagar: async (id: string) => {
      const registro = await dados.get(id)
      if (registro) await dados.put({ ...registro, apagado_em: new Date().toISOString(), atualizado_em: new Date().toISOString() })
    },
  }
}
