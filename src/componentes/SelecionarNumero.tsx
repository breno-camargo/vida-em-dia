import { useId, useMemo, useState } from 'react'
import { Painel } from './Painel'
import { Rolagem } from './Rolagem'
import { formatarNumeroEntrada, validarEntradaNumero, saltoNumero } from '../utilitarios/numero'

export function SelecionarNumero({
  titulo,
  unidade,
  valor,
  maximo,
  fechar,
  confirmar,
  decimal = false,
  opcional = false,
  passoRapido,
  minimo = 0,
  permitirDigitar = false
}: {
  titulo: string
  unidade: string
  valor?: number
  maximo: number
  fechar: () => void
  confirmar: (v?: number) => void | Promise<void>
  decimal?: boolean
  opcional?: boolean
  passoRapido?: number
  minimo?: number
  permitirDigitar?: boolean
}) {
  const [ocupado, definirOcupado] = useState(false)
  const [erro, definirErro] = useState('')
  const [modo, definirModo] = useState<'rolar' | 'digitar'>('rolar')
  const inputId = useId()

  const aplicar = async (v?: number) => {
    definirOcupado(true)
    try {
      await confirmar(v)
      fechar()
    } catch (e) {
      definirErro(e instanceof Error ? e.message : 'Não foi possível salvar.')
    } finally {
      definirOcupado(false)
    }
  }

  const [inteiro, definirInteiro] = useState(Math.floor(valor ?? 0))
  const [fracao, definirFracao] = useState(Math.round(((valor ?? 0) % 1) * 10))
  const milhares = maximo > 2000
  const [mil, definirMil] = useState(Math.floor((valor ?? 0) / 1000))
  const [centena, definirCentena] = useState(Math.floor(((valor ?? 0) % 1000) / 100))
  const [dezena, definirDezena] = useState(Math.floor(((valor ?? 0) % 100) / 10))
  const [unidadeNumero, definirUnidadeNumero] = useState(Math.floor((valor ?? 0) % 10))

  const [rascunhoTexto, definirRascunhoTexto] = useState(formatarNumeroEntrada(valor, decimal))

  const lista = useMemo(() => Array.from({ length: milhares ? 10 : maximo + 1 }, (_, i) => i), [maximo, milhares])
  const listaMil = useMemo(() => Array.from({ length: Math.floor(maximo / 1000) + 1 }, (_, i) => i), [maximo])
  const decimais = useMemo(() => Array.from({ length: 10 }, (_, i) => i), [])

  const numero = milhares
    ? mil * 1000 + centena * 100 + dezena * 10 + unidadeNumero
    : inteiro + (decimal ? fracao / 10 : 0)

  const sincronizarRodas = (num: number) => {
    if (milhares) {
      definirMil(Math.floor(num / 1000))
      definirCentena(Math.floor((num % 1000) / 100))
      definirDezena(Math.floor((num % 100) / 10))
      definirUnidadeNumero(Math.floor(num % 10))
    } else {
      definirInteiro(Math.floor(num))
      definirFracao(Math.round((num % 1) * 10))
    }
  }

  const atualizarRodaInteiro = (v: number) => {
    definirInteiro(v)
    const novo = v + (decimal ? fracao / 10 : 0)
    definirRascunhoTexto(formatarNumeroEntrada(novo, decimal))
    definirErro('')
  }

  const atualizarRodaFracao = (v: number) => {
    definirFracao(v)
    const novo = inteiro + v / 10
    definirRascunhoTexto(formatarNumeroEntrada(novo, decimal))
    definirErro('')
  }

  const atualizarRodaMilhares = (m: number, c: number, d: number, u: number) => {
    definirMil(m)
    definirCentena(c)
    definirDezena(d)
    definirUnidadeNumero(u)
    const novo = m * 1000 + c * 100 + d * 10 + u
    definirRascunhoTexto(formatarNumeroEntrada(novo, decimal))
    definirErro('')
  }

  const aplicarSalto = (delta: number) => {
    const resultado = saltoNumero(numero, modo === 'digitar' ? rascunhoTexto : undefined, delta, { decimal, minimo, maximo })
    if (!resultado.valido) { definirErro(resultado.erro); return }
    const arredondado = resultado.valor
    sincronizarRodas(arredondado)
    definirRascunhoTexto(formatarNumeroEntrada(arredondado, decimal))
    definirErro('')
  }

  const mudarModo = (novoModo: 'rolar' | 'digitar') => {
    if (novoModo === modo) return
    if (novoModo === 'rolar') {
      if (rascunhoTexto.trim() === '') { definirErro(''); definirModo('rolar'); return }
      {
        const parsed = validarEntradaNumero(rascunhoTexto, { decimal, minimo, maximo })
        if (parsed.valido) {
          sincronizarRodas(parsed.valor)
          definirErro('')
        } else {
          definirErro(parsed.erro)
          return
        }
      }
    } else {
      if (rascunhoTexto.trim() === '' && numero > 0) {
        definirRascunhoTexto(formatarNumeroEntrada(numero, decimal))
      }
      definirErro('')
    }
    definirModo(novoModo)
  }

  const handleConfirmar = () => {
    if (permitirDigitar && modo === 'digitar') {
      const res = validarEntradaNumero(rascunhoTexto, { decimal, minimo, maximo })
      if (!res.valido) {
        definirErro(res.erro)
        return
      }
      void aplicar(res.valor)
    } else {
      const valorArredondado = Math.round(numero * 10) / 10
      if (minimo !== undefined && valorArredondado < minimo) {
        definirErro(
          minimo > 0
            ? minimo === 1 && !decimal
              ? 'O valor deve ser pelo menos 1.'
              : 'Informe um valor maior que zero.'
            : 'O valor não pode ser negativo.'
        )
        return
      }
      if (maximo !== undefined && valorArredondado > maximo) {
        definirErro(`O valor não pode ser maior que ${maximo.toLocaleString('pt-BR')}.`)
        return
      }
      void aplicar(valorArredondado)
    }
  }

  const valorFormatado =
    modo === 'digitar' && rascunhoTexto.trim() !== ''
      ? `${rascunhoTexto} ${unidade}`
      : modo === 'digitar' && rascunhoTexto.trim() === ''
        ? `Digite o valor em ${unidade}`
        : `${numero.toLocaleString('pt-BR')} ${unidade}`

  return (
    <Painel titulo={titulo} fechar={() => { if (!ocupado) { if (opcional) void aplicar(undefined); else fechar() } }} acao={<button type="button" className="botao-principal salvar-cabecalho" disabled={ocupado} onClick={handleConfirmar}>Salvar</button>}>
      {permitirDigitar ? (
        <div className="cabecalho-seletor-numero">
          <div className="alternador-seletor" role="tablist" aria-label="Modo de seleção">
            <button
              type="button"
              role="tab"
              aria-selected={modo === 'rolar'}
              className={`opcao-seletor${modo === 'rolar' ? ' selecionada' : ''}`}
              onClick={() => mudarModo('rolar')}
            >
              Rolar
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={modo === 'digitar'}
              className={`opcao-seletor${modo === 'digitar' ? ' selecionada' : ''}`}
              onClick={() => mudarModo('digitar')}
            >
              Digitar
            </button>
          </div>
          {passoRapido !== undefined && passoRapido > 0 && (
            <div className="atalhos-numero">
              <button
                type="button"
                className="botao-atalho-numero"
                onClick={() => aplicarSalto(-passoRapido)}
                aria-label={`Subtrair ${passoRapido.toLocaleString('pt-BR')} ${unidade}`}
              >
                -{passoRapido.toLocaleString('pt-BR')} {unidade}
              </button>
              <button
                type="button"
                className="botao-atalho-numero"
                onClick={() => aplicarSalto(passoRapido)}
                aria-label={`Adicionar ${passoRapido.toLocaleString('pt-BR')} ${unidade}`}
              >
                +{passoRapido.toLocaleString('pt-BR')} {unidade}
              </button>
            </div>
          )}
        </div>
      ) : (
        <p className="subtitulo-seletor">Deslize e confirme para aplicar.</p>
      )}

      {modo === 'digitar' && permitirDigitar ? (
        <div className="campo-digitar-numero">
          <label htmlFor={inputId} className="sr-only">
            {titulo} em {unidade}
          </label>
          <div className="input-com-unidade">
            <input
              id={inputId}
              type="text"
              inputMode={decimal ? 'decimal' : 'numeric'}
              pattern={decimal ? '[0-9]*[.,]?[0-9]?' : '[0-9]*'}
              placeholder={valor !== undefined ? String(valor) : (decimal ? '0,0' : '0')}
              value={rascunhoTexto}
              onChange={e => {
                definirRascunhoTexto(e.target.value)
                definirErro('')
              }}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleConfirmar()
                }
              }}
              autoFocus
            />
            <span className="unidade-input">{unidade}</span>
          </div>
        </div>
      ) : (
        <div className={`rodas-numero${milhares ? ' casas-numero' : decimal ? ' dupla-roda' : ''}`}>
          {milhares ? (
            <>
              <Rolagem
                valores={listaMil}
                inicial={Math.floor((valor ?? 0) / 1000)}
                valor={mil}
                rotulo="MILHARES"
                escolher={v => atualizarRodaMilhares(v, centena, dezena, unidadeNumero)}
              />
              <Rolagem
                valores={lista}
                inicial={Math.floor(((valor ?? 0) % 1000) / 100)}
                valor={centena}
                rotulo="CENTENAS"
                escolher={v => atualizarRodaMilhares(mil, v, dezena, unidadeNumero)}
              />
              <Rolagem
                valores={lista}
                inicial={Math.floor(((valor ?? 0) % 100) / 10)}
                valor={dezena}
                rotulo="DEZENAS"
                escolher={v => atualizarRodaMilhares(mil, centena, v, unidadeNumero)}
              />
              <Rolagem
                valores={lista}
                inicial={Math.floor((valor ?? 0) % 10)}
                valor={unidadeNumero}
                rotulo="UNIDADES"
                escolher={v => atualizarRodaMilhares(mil, centena, dezena, v)}
              />
            </>
          ) : (
            <>
              <Rolagem
                valores={lista}
                inicial={Math.floor(valor ?? 0)}
                valor={inteiro}
                rotulo={unidade}
                escolher={atualizarRodaInteiro}
              />
              {decimal && (
                <Rolagem
                  valores={decimais}
                  inicial={Math.round(((valor ?? 0) % 1) * 10)}
                  valor={fracao}
                  rotulo="DECIMAL"
                  escolher={atualizarRodaFracao}
                  formatar={v => `,${v}`}
                />
              )}
            </>
          )}
        </div>
      )}

      <p className="valor-escolhido">{valorFormatado}</p>
      {erro && <p className="erro" role="alert">{erro}</p>}
    </Painel>
  )
}
