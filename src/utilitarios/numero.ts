export type ResultadoValidacao =
  | { valido: true; valor: number }
  | { valido: false; erro: string }

export type OpcoesValidacaoNumero = {
  decimal?: boolean
  minimo?: number
  maximo?: number
}

export function saltoNumero(base: number, texto: string | undefined, delta: number, opcoes: OpcoesValidacaoNumero): ResultadoValidacao {
  if (texto !== undefined && texto.trim() !== '') {
    const resultado = validarEntradaNumero(texto, opcoes)
    if (!resultado.valido) return resultado
    base = resultado.valor
  }
  const novo = Math.max(opcoes.minimo ?? 0, Math.min(opcoes.maximo ?? Infinity, base + delta))
  return { valido: true, valor: opcoes.decimal ? Math.round(novo * 10) / 10 : Math.round(novo) }
}

export function formatarNumeroEntrada(valor: number | undefined, decimal = false): string {
  if (valor === undefined || !Number.isFinite(valor)) return ''
  if (!decimal) return String(Math.floor(valor))
  const arredondado = Math.round(valor * 10) / 10
  return String(arredondado).replace('.', ',')
}

export function validarEntradaNumero(texto: string, opcoes: OpcoesValidacaoNumero = {}): ResultadoValidacao {
  const { decimal = false, minimo = 0, maximo } = opcoes
  const limpo = texto.trim()

  if (limpo === '') {
    return { valido: false, erro: 'Digite um valor.' }
  }

  if (limpo.includes('-')) {
    return { valido: false, erro: 'Informe um valor positivo.' }
  }

  if (/[eE]/.test(limpo) || limpo.includes('+')) {
    return { valido: false, erro: 'Digite um número válido.' }
  }

  if (!decimal) {
    if (limpo.includes(',') || limpo.includes('.')) {
      return { valido: false, erro: 'Este campo aceita apenas números inteiros.' }
    }
    if (!/^\d+$/.test(limpo)) {
      return { valido: false, erro: 'Digite um número válido.' }
    }
  } else {
    if (!/^\d+([.,]\d+)?$/.test(limpo)) {
      return { valido: false, erro: 'Digite um número válido.' }
    }
    const partes = limpo.split(/[.,]/)
    if (partes[1] && partes[1].length > 1) {
      return { valido: false, erro: 'Informe no máximo uma casa decimal.' }
    }
  }

  const normalizado = limpo.replace(',', '.')
  const n = Number(normalizado)

  if (!Number.isFinite(n) || Number.isNaN(n)) {
    return { valido: false, erro: 'Digite um número válido.' }
  }

  if (!decimal && !Number.isInteger(n)) {
    return { valido: false, erro: 'Este campo aceita apenas números inteiros.' }
  }

  if (minimo !== undefined && n < minimo) {
    if (minimo > 0) {
      return {
        valido: false,
        erro: minimo === 1 && !decimal ? 'O valor deve ser pelo menos 1.' : 'Informe um valor maior que zero.'
      }
    }
    return { valido: false, erro: 'O valor não pode ser negativo.' }
  }

  if (maximo !== undefined && n > maximo) {
    return {
      valido: false,
      erro: `O valor não pode ser maior que ${maximo.toLocaleString('pt-BR')}.`
    }
  }

  return { valido: true, valor: decimal ? Math.round(n * 10) / 10 : n }
}

