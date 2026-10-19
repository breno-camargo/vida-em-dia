import { useEffect, useState } from 'react'

// Apenas o aviso expira. O registro continua com exclusão lógica no banco.
export function useEstadoTemporario<T>(inicial: T, duracao = 10000) {
  const [valor, definirValor] = useState<T>(inicial)
  useEffect(() => {
    if (valor === inicial) return
    const timer = setTimeout(() => definirValor(inicial), duracao)
    return () => clearTimeout(timer)
  }, [valor, inicial, duracao])
  return [valor, definirValor] as const
}
