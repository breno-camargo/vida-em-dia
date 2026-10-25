import type { SyntheticEvent } from 'react'

export function enquadrarDetalhes(evento: SyntheticEvent<HTMLDetailsElement>, exclusivo = false) {
  evento.stopPropagation()
  const secao = evento.currentTarget
  if (evento.target !== secao || !secao.open) return
  if (exclusivo) for (const outro of Array.from(secao.parentElement?.children ?? [])) {
    if (outro !== secao && outro instanceof HTMLDetailsElement) outro.open = false
  }
  requestAnimationFrame(() => {
    if (!secao.isConnected || !secao.open) return
    const area = secao.closest<HTMLElement>('.conteudo-modal, main#conteudo')
    if (!area) return
    const caixa = secao.getBoundingClientRect(), visivel = area.getBoundingClientRect()
    const acoes = area.matches('main') ? area.querySelector<HTMLElement>('.finalizar-acoes')?.getBoundingClientRect() : undefined
    const fundo = acoes ? Math.min(visivel.bottom, acoes.top) : visivel.bottom
    const altura = fundo - visivel.top
    area.scrollTo({ top: area.scrollTop + caixa.top - visivel.top - Math.max(12, (altura - caixa.height) / 2), behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' })
  })
}

const fechamentos = new WeakMap<HTMLElement, Animation>()

export function recolherSecaoSuavemente(secao: HTMLElement, concluir: () => void) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) { concluir(); return }
  const anterior = fechamentos.get(secao)
  if (anterior) { anterior.cancel(); return }
  const inicio = secao.getBoundingClientRect()
  const copia = secao.cloneNode(false) as HTMLElement
  if (copia instanceof HTMLDetailsElement) { copia.open = false; copia.removeAttribute('name') }
  copia.classList.remove('expandida')
  copia.style.cssText = 'position:absolute;visibility:hidden;pointer-events:none;height:auto;width:' + inicio.width + 'px'
  const titulo = secao.querySelector(':scope > summary, :scope > h2')
  if (!titulo) { concluir(); return }
  copia.append(titulo.cloneNode(true))
  secao.after(copia)
  const alturaFechada = copia.getBoundingClientRect().height
  copia.remove()
  const area = secao.closest<HTMLElement>('.conteudo-modal, main#conteudo')
  area?.scrollTo({ top: area.scrollTop, behavior: 'instant' })
  const animacao = secao.animate([
    { height: inicio.height + 'px', overflow: 'hidden' },
    { height: alturaFechada + 'px', overflow: 'hidden' },
  ], { duration: 220, easing: 'cubic-bezier(.22,.61,.36,1)', fill: 'forwards' })
  fechamentos.set(secao, animacao)
  animacao.oncancel = () => { fechamentos.delete(secao) }
  animacao.onfinish = () => { concluir(); requestAnimationFrame(() => animacao.cancel()) }
}

export function recolherDetalhesSuavemente(evento: SyntheticEvent<HTMLElement>) {
  if ((evento.target as Element).closest('button, a, input, select, textarea')) return
  const secao = evento.currentTarget.closest('details')
  if (!secao?.open) return
  evento.preventDefault()
  recolherSecaoSuavemente(secao, () => { secao.open = false })
}

export function alternarDetalhesExclusivos(evento: SyntheticEvent<HTMLElement>) {
  const secao = evento.currentTarget.closest('details')
  if (!secao) return
  if (secao.open) { recolherDetalhesSuavemente(evento); return }
  const anterior = Array.from(secao.parentElement?.children ?? []).find((el): el is HTMLDetailsElement => el instanceof HTMLDetailsElement && el !== secao && el.open)
  if (!anterior) return
  evento.preventDefault()
  recolherSecaoSuavemente(anterior, () => { anterior.open = false; if (secao.isConnected) secao.open = true })
}
