import { useEffect, useRef, useState } from 'react'
import { segundosRestantes } from '../utilitarios/treino'
import { tocarAlerta, tocarContagem, silenciarAlerta } from '../utilitarios/alerta'
import { Painel } from './Painel'
export function Descanso({ fim, alterar }: { fim?: string | null; alterar: (fim: string | null) => void }) {
  const [agora, definirAgora] = useState(Date.now)
  const [som, definirSom] = useState(true)
  const avisado = useRef('')
  const ultimoBipe = useRef('')
  const restantes = fim ? segundosRestantes(fim, agora) : 0
  useEffect(() => { return () => silenciarAlerta() }, [som])
  useEffect(() => {
    const chave = `${fim}-${restantes}`
    if (fim && restantes > 0 && restantes <= 10 && ultimoBipe.current !== chave && !document.hidden) {
      ultimoBipe.current = chave
      if (som) tocarContagem()
    }
  }, [fim, restantes, som])
  useEffect(() => {
    if (!fim) return
    silenciarAlerta()
    let timer: ReturnType<typeof setTimeout>
    const atualizar = () => { definirAgora(Date.now()); timer = setTimeout(atualizar, 250) }
    timer = setTimeout(atualizar, 1)
    const voltar = () => { if (!document.hidden) definirAgora(Date.now()) }
    document.addEventListener('visibilitychange', voltar)
    return () => {
      clearTimeout(timer)
      document.removeEventListener('visibilitychange', voltar)
      // Preserve o alerta final ao fechar automaticamente; pular cancela os bipes.
      if (avisado.current !== fim) silenciarAlerta()
    }
  }, [fim])
  useEffect(() => {
    if (fim && restantes <= 0 && avisado.current !== fim && !document.hidden) {
      avisado.current = fim
      if (som) tocarAlerta()
      if (navigator.vibrate) navigator.vibrate([100, 100, 100])
      alterar(null)
    }
  }, [fim, restantes, som, alterar])
  if (!fim || restantes <= 0) return null
  return <Painel centralizado fechamentoLivre={false} titulo="Tempo de descanso" fechar={() => alterar(null)}>
    <section className="descanso descanso-popup" aria-label="Descanso">
      <strong>{`${Math.floor(restantes / 60)}:${String(restantes % 60).padStart(2, '0')}`}</strong>
      <p>Recupere o fôlego. Ao terminar, esta janela fecha automaticamente.</p>
      <div className="ajustes-descanso"><button type="button" onClick={() => alterar(new Date(Math.max(Date.now(), Date.parse(fim)) - 15000).toISOString())}>−15 s</button><button type="button" onClick={() => alterar(new Date(Math.max(Date.now(), Date.parse(fim)) + 15000).toISOString())}>+15 s</button></div>
      <button type="button" className="botao-principal largura-total" onClick={() => alterar(null)}>Pular descanso e continuar</button>
      <button type="button" className="botao-secundario" aria-pressed={!som} onClick={() => definirSom(!som)}>{som ? 'Silenciar alerta' : 'Ativar som'}</button>
    </section>
  </Painel>
}
