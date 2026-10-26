import type { AlimentoFavorito, Nutrientes, RefeicaoDia } from './modelos'
import { banco, tabela } from './banco'
import { repositorio } from './repositorio'
import { dataMedida } from './medidas'
import { alimentosComuns } from './alimentosComuns'

export async function alterarVisibilidadeAlimentosComuns(id?: string) {
  if (id && !alimentosComuns.some(a => a.id === id)) throw new Error('Alimento não encontrado.')
  const repo = repositorio('configuracoes')
  return banco.transaction('rw', tabela('configuracoes'), async () => {
    const config = (await repo.listar()).find(c => c.chave === 'principal')
    if (!config) throw new Error('Configuração não encontrada.')
    await repo.salvar({ ...config, alimentos_comuns_ocultos: id ? [...new Set([...(config.alimentos_comuns_ocultos ?? []), id])] : [] })
  })
}

export async function excluirAlimentoPessoal(id: string) {
  const alimentos = repositorio('alimentos_favoritos'), refeicoes = repositorio('refeicoes_dia')
  return banco.transaction('rw', tabela('alimentos_favoritos'), tabela('refeicoes_dia'), async () => {
    const alimento = await alimentos.obter(id)
    if (!alimento || alimento.apagado_em || alimento.eliminado_em) throw new Error('Alimento não encontrado.')
    // Desvincula o cadastro sem alterar os snapshots, inclusive os removidos.
    // Assim, exportar backup sem o alimento excluído preserva suas refeições.
    const vinculadas = await tabela('refeicoes_dia').where('alimento_id').equals(id).filter(r => r.user_id === alimento.user_id && !r.eliminado_em).toArray()
    for (const registro of vinculadas) {
      delete registro.alimento_id
      await refeicoes.salvar(registro)
    }
    await alimentos.apagar(id)
  })
}

export async function salvarRefeicaoCompleta(registros: RefeicaoDia[]) {
  if (!registros.length) throw new Error('Adicione pelo menos um alimento.')
  const primeiro = registros[0]
  if (!primeiro.refeicao.trim() || !/^\d{4}-\d{2}-\d{2}$/.test(primeiro.data) || dataMedida(new Date(`${primeiro.data}T12:00:00`)) !== primeiro.data || primeiro.data > dataMedida()) throw new Error('Confira a data e a refeição.')
  for (const item of registros) {
    if (item.data !== primeiro.data || item.refeicao !== primeiro.refeicao || !item.descricao.trim() || item.apagado_em || !item.quantidade_g) throw new Error('Confira os alimentos da refeição.')
    calcularPorcao(item, item.quantidade_g, item.quantidade_g)
  }
  const repo = repositorio('refeicoes_dia')
  const alimentos = repositorio('alimentos_favoritos')
  return banco.transaction('rw', tabela('refeicoes_dia'), tabela('alimentos_favoritos'), async () => {
    for (const registro of registros) {
      if (await repo.obter(registro.id)) throw new Error('Este registro já foi salvo.')
      const snapshot = { ...registro }
      if (snapshot.alimento_id) {
        const alimento = await alimentos.obter(snapshot.alimento_id)
        if (!alimento || alimento.apagado_em || alimento.eliminado_em) delete snapshot.alimento_id
      }
      await repo.salvar(snapshot)
    }
  })
}

export function nomeAlimento(alimento: { nome: string; marca?: string }) {
  return alimento.marca ? `${alimento.nome} · ${alimento.marca}` : alimento.nome
}

export async function salvarAlimentoPessoal(alimento: AlimentoFavorito, anterior?: AlimentoFavorito) {
  const repo = repositorio('alimentos_favoritos')
  return banco.transaction('rw', tabela('alimentos_favoritos'), async () => {
    const atual = await repo.obter(alimento.id)
    if (anterior && (!atual || atual.apagado_em || atual.eliminado_em || JSON.stringify(atual) !== JSON.stringify(anterior))) throw new Error('O alimento mudou. Reabra a edição para continuar.')
    if (!anterior && atual) throw new Error('Este alimento já existe. Reabra a edição.')
    await repo.salvar(alimento)
  })
}

export function lerGramas(texto: string) {
  if (!/^\d+(?:[.,]\d{1,3})?$/.test(texto.trim())) return NaN
  return Number(texto.trim().replace(',', '.'))
}

// Mantém precisão nos dados; arredondamento visual pertence à apresentação.
export function calcularPorcao(nutrientes: Nutrientes, base: number, quantidade: number): Nutrientes {
  if (!Number.isFinite(base) || base <= 0 || !Number.isFinite(quantidade) || quantidade <= 0 || quantidade > 20000) throw new Error('Porção inválida.')
  const resultado: Nutrientes = { kcal: 0 }
  for (const campo of ['kcal', 'proteina_g', 'carbo_g', 'gordura_g', 'fibra_g', 'sodio_mg'] as const) {
    const valor = nutrientes[campo]
    if (valor === undefined) continue
    if (!Number.isFinite(valor) || valor < 0) throw new Error('Nutriente inválido.')
    resultado[campo] = Math.round(valor * quantidade / base * 1e6) / 1e6
  }
  return resultado
}
