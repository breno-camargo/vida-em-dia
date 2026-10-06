import { useEffect, useRef, useState } from 'react'
import { segundosRestantes } from '../utilitarios/treino'
import { tocarAlerta } from '../utilitarios/alerta'
export function Descanso({ fim, alterar }: { fim?: string | null; alterar: (fim: string | null) => void }) {
  const [agora, definirAgora] = useState(Date.now)
  const [som, definirSom] = useState(true)
  const avisado = useRef('')
  const restantes = fim ? segundosRestantes(fim, agora) : 0
  useEffect(() => {
    if (!fim) return
    let timer: ReturnType<typeof setTimeout>
    const atualizar = () => { definirAgora(Date.now()); timer = setTimeout(atualizar, 250) }
    timer = setTimeout(atualizar, 1)
    const voltar = () => { if (!document.hidden) definirAgora(Date.now()) }
    document.addEventListener('visibilitychange', voltar)
    return () => { clearTimeout(timer); document.removeEventListener('visibilitychange', voltar) }
  }, [fim])
  useEffect(() => {
    if (fim && restantes <= 0 && avisado.current !== fim && !document.hidden) {
      avisado.current = fim
      if (som) tocarAlerta()
      if (navigator.vibrate) navigator.vibrate([100, 100, 100])
    }
  }, [fim, restantes, som])
  if (!fim) return null
  return <section className={`descanso ${restantes <= 0 ? 'terminou' : ''}`} aria-label="Descanso">
    <span>{restantes > 0 ? 'DESCANSO' : 'Próxima série'}</span>
    <strong>{restantes > 0 ? `${Math.floor(restantes / 60)}:${String(restantes % 60).padStart(2, '0')}` : `Descanso terminou há ${Math.abs(restantes)} s`}</strong>
    <div className="acoes"><button onClick={() => alterar(new Date(Date.parse(fim) + 15000).toISOString())}>+15 s</button><button onClick={() => alterar(new Date(Date.parse(fim) - 15000).toISOString())}>−15 s</button><button onClick={() => alterar(null)}>{restantes > 0 ? 'Pular descanso' : 'Continuar'}</button><button aria-pressed={!som} onClick={() => definirSom(!som)}>{som ? 'Silenciar' : 'Ativar som'}</button></div>
  </section>
}
