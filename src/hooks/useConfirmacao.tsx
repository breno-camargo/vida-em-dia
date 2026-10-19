import { useEffect, useRef, useState } from 'react'
import { Painel } from '../componentes/Painel'

export function useConfirmacao() {
 const [pedido, definir] = useState<{ mensagem: string; acao: string }>()
 const resposta = useRef<((valor: boolean) => void) | undefined>(undefined)
 useEffect(() => () => { resposta.current?.(false) }, [])
 function concluir(valor: boolean) { const resolver = resposta.current; resposta.current = undefined; definir(undefined); resolver?.(valor) }
 function confirmar(mensagem: string, acao = 'Confirmar') {
  resposta.current?.(false)
  return new Promise<boolean>(resolve => { resposta.current = resolve; definir({ mensagem, acao }) })
 }
 const dialogo = pedido && <Painel centralizado titulo={pedido.acao} fechar={() => concluir(false)}><div className="confirmacao-app"><p>{pedido.mensagem}</p><button type="button" className="botao-secundario" autoFocus onClick={() => concluir(false)}>Voltar</button><button type="button" className="botao-principal" onClick={() => concluir(true)}>{pedido.acao}</button></div></Painel>
 return { confirmar, dialogo }
}
