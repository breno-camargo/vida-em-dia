export function partesDistancia(km: number) {
  const total = Number.isFinite(km) ? Math.max(0, Math.round(km * 1000)) : 0
  return { km: Math.floor(total / 1000), metros: total % 1000 }
}
export function lerDistanciaCardio(km: string, metros: string) {
  if (!/^\d+$/.test(km.trim()) || !/^\d+$/.test(metros.trim())) throw new Error('Informe quilômetros e metros inteiros.')
  const k = Number(km), m = Number(metros)
  if (!Number.isSafeInteger(k) || !Number.isSafeInteger(m) || m > 999) throw new Error('Os metros devem ficar entre 0 e 999.')
  const total = k * 1000 + m
  if (total > 1000000) throw new Error('A distância máxima é 1.000 km.')
  return total / 1000
}
export function formatarDistanciaCardio(km: number) {
  const p = partesDistancia(km)
  return p.km === 0 && p.metros > 0 ? `${p.metros} m` : p.metros ? `${p.km.toLocaleString('pt-BR')} km ${p.metros} m` : `${p.km.toLocaleString('pt-BR')} km`
}
