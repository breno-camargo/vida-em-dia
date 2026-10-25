export function partesDuracao(minutos: number) {
  const total = Number.isFinite(minutos) ? Math.max(0, Math.round(minutos * 60)) : 0
  return { minutos: Math.floor(total / 60), segundos: total % 60 }
}
export function formatarDuracaoCardio(valor: number) {
  const { minutos, segundos } = partesDuracao(valor)
  return segundos ? `${minutos} min ${segundos} s` : `${minutos} min`
}
export function lerDuracaoCardio(minutos: string, segundos: string) {
  if (!/^\d+$/.test(minutos.trim()) || !/^\d+$/.test(segundos.trim())) throw new Error('Informe minutos e segundos inteiros.')
  const m = Number(minutos), s = Number(segundos)
  if (!Number.isSafeInteger(m) || !Number.isSafeInteger(s) || s > 59) throw new Error('Os segundos devem ficar entre 0 e 59.')
  const total = m * 60 + s
  if (total < 1 || total > 86400) throw new Error('Informe uma duração de 1 segundo até 24 horas.')
  return total / 60
}
