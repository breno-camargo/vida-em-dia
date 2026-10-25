// Retém a identidade do snapshot quando a atualização não altera nenhum campo.
export function atualizarCampos<T extends object>(anterior: T, parcial: Partial<T>): T {
  if (Object.entries(parcial).every(([chave, valor]) => Object.is(anterior[chave as keyof T], valor))) return anterior
  return { ...anterior, ...parcial }
}
