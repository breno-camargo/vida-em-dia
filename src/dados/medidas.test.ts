import 'fake-indexeddb/auto'
import { iniciarTreino, adicionarExercicio } from './treinos'
import { salvarFicha } from './fichas'

import { beforeEach, expect, test } from 'vitest'
import { banco, tabela } from './banco'
import { criarRegistro } from './repositorio'
import { iniciarBanco } from './configuracoes'
import { camposMedidas, diferencaMedida, lembreteMedidas, salvarMedida, formatarValorMedida, lerValorMedida } from './medidas'
import { repositorio } from './repositorio'
beforeEach(async () => { await banco.delete(); await banco.open(); await iniciarBanco() })
const medida = (data: string, peso?: number) => ({ ...criarRegistro(), data, peso })
test('peso mantém gramas no parsing, salvamento e comparação', async () => {
  const peso = lerValorMedida('peso', '77,830')
  expect(peso).toBe(77.83)
  expect(formatarValorMedida('peso', peso)).toBe('77,830')
  const antes = medida('2026-01-01', 77.8), depois = medida('2026-01-02', peso)
  await salvarMedida(depois)
  expect((await tabela('medidas_corporais').get(depois.id))?.peso).toBe(77.83)
  expect(diferencaMedida(antes, depois, 'peso')).toBe(0.03)
  expect(formatarValorMedida('peso', diferencaMedida(antes, depois, 'peso')!)).toBe('0,030')
})
test('todas as circunferências aceitam centésimos de cm e não transformam ausência em zero', () => {
  for (const [campo] of camposMedidas.filter(([c]) => c !== 'peso')) {
    expect(lerValorMedida(campo, '82,5')).toBe(82.5)
    expect(formatarValorMedida(campo, 82.5)).toBe('82,50')
    expect(lerValorMedida(campo, '83,75')).toBe(83.75)
    expect(lerValorMedida(campo, '83')).toBe(83)
    expect(() => lerValorMedida(campo, '82,555')).toThrow()
  }
  for (const texto of ['', '-77', '0', '400,001', '77,8301', '1e2']) expect(() => lerValorMedida('peso', texto)).toThrow()
  expect(lerValorMedida('peso', '77.830')).toBe(77.83)
})
test('salve registros parciais sem transformar campos ausentes em zero', async () => {
  const m = { ...medida('2026-01-01'), cintura: 82.5 }
  await salvarMedida(m)
  const salva = (await tabela('medidas_corporais').get(m.id))!
  expect(salva.cintura).toBe(82.5)
  expect(salva.peso).toBeUndefined()
  for (const [campo] of camposMedidas.filter(([campo]) => campo !== 'cintura')) expect(salva[campo]).toBeUndefined()
})
test('impeça duplicidade por data e permita editar e desfazer exclusão', async () => {
  const m = medida('2026-01-01', 70)
  await salvarMedida(m)
  await expect(salvarMedida(medida(m.data, 71))).rejects.toThrow('Já há um registro')
  await salvarMedida({ ...m, peso: 71 })
  expect((await tabela('medidas_corporais').get(m.id))?.peso).toBe(71)
  await repositorio('medidas_corporais').apagar(m.id)
  expect(await repositorio('medidas_corporais').listar()).toHaveLength(0)
  await repositorio('medidas_corporais').salvar(m)
  expect(await repositorio('medidas_corporais').listar()).toHaveLength(1)
})
test('valide data real, registro vazio e valores inválidos', async () => {
  await expect(salvarMedida(medida('2026-02-30', 70))).rejects.toThrow('data válida')
  await expect(salvarMedida(medida('2999-01-01', 70))).rejects.toThrow('data válida')
  await expect(salvarMedida(medida('2026-01-01'))).rejects.toThrow('pelo menos')
  await expect(salvarMedida(medida('2026-01-01', 0))).rejects.toThrow('valor')
  await expect(salvarMedida({ ...medida('2026-01-01', 70), cintura: NaN })).rejects.toThrow('valor')
})
test('compare apenas valores presentes em ambas as datas com precisão decimal', () => {
  expect(diferencaMedida(medida('2026-01-01', 70.2), medida('2026-01-02', 70.1), 'peso')).toBe(-0.1)
  expect(diferencaMedida(medida('2026-01-01', 70), medida('2026-01-02'), 'peso')).toBeNull()
})
test('mostre o lembrete a partir do dia escolhido e encerre com qualquer medida da semana', () => {
  const sabado = new Date(2026, 9, 10, 12)
  expect(lembreteMedidas([], 6, new Date(2026,9,9,12))).toBe(false)
  expect(lembreteMedidas([], 6, sabado)).toBe(true)
  expect(lembreteMedidas([medida('2026-10-05', 70)], 6, sabado)).toBe(false)
  expect(lembreteMedidas([medida('2026-10-04', 70)], 6, sabado)).toBe(true)
  expect(lembreteMedidas([{ ...medida('2026-10-09',70), apagado_em: 'agora' }], 6, sabado)).toBe(true)
  expect(lembreteMedidas([], 0, sabado)).toBe(false)
  expect(lembreteMedidas([], 0, new Date(2026,9,11,12))).toBe(true)
  expect(lembreteMedidas([medida('2026-10-11',70)], 1, new Date(2026,9,12,12))).toBe(true)
})


test('use o último peso não excluído ao salvar um treino', async () => {
  const ex = { ...criarRegistro(), nome: 'Teste', tipo: 'forca' as const, grupo_muscular: 'Peito', equipamento: '', descanso_padrao_segundos: 90, modo_carga: 'total' as const, peso_barra: 0, nota_fixa: '', como_fazer: '', musculos: 'Peito', origem: 'manual' as const }
  await tabela('exercicios').add(ex)
  await salvarMedida(medida('2026-01-01', 70))
  await salvarMedida({ ...medida('2026-01-03'), cintura: 82 })
  const apagada = medida('2026-01-02', 80)
  await salvarMedida(apagada)
  await repositorio('medidas_corporais').apagar(apagada.id)
  const id = await iniciarTreino()
  await adicionarExercicio((await tabela('treinos').get(id))!, ex)
  await tabela('treinos').update(id, { inicio: new Date(Date.now() - 60 * 60000).toISOString() })
  const ficha = { ...criarRegistro(), nome: 'Outra', ordem: 0 }
  await salvarFicha(ficha, [{ ...criarRegistro(), ficha_id: ficha.id, exercicio_id: ex.id, ordem: 0, series_planejadas: 1, descanso_segundos: 90 }])
  await iniciarTreino(ficha.id, true)
  const salvo = (await tabela('treinos').get(id))!
  expect(salvo.peso_corporal).toBe(70)
  expect(salvo.calorias).toBe(350)
})


test('calcule calorias pelo tempo real mesmo num treino com menos de um minuto', async () => {
  const ex = { ...criarRegistro(), nome: 'Teste curto', tipo: 'forca' as const, grupo_muscular: 'Peito', equipamento: '', descanso_padrao_segundos: 90, modo_carga: 'total' as const, peso_barra: 0, nota_fixa: '', como_fazer: '', musculos: 'Peito', origem: 'manual' as const }
  await tabela('exercicios').add(ex)
  await salvarMedida(medida('2026-01-01', 70))
  const id = await iniciarTreino()
  await adicionarExercicio((await tabela('treinos').get(id))!, ex)
  await tabela('treinos').update(id, { inicio: new Date(Date.now() - 20000).toISOString() })
  const ficha = { ...criarRegistro(), nome: 'Outra curta', ordem: 0 }
  await salvarFicha(ficha, [{ ...criarRegistro(), ficha_id: ficha.id, exercicio_id: ex.id, ordem: 0, series_planejadas: 1, descanso_segundos: 90 }])
  await iniciarTreino(ficha.id, true)
  const salvo = (await tabela('treinos').get(id))!
  expect(salvo.duracao_minutos).toBe(0)
  expect(salvo.calorias).toBeGreaterThan(0)
})

test('salve busto isolado, compare duas datas e mantenha registros antigos sem busto', async () => {
  const antes = { ...medida('2026-01-01'), busto: 92.5 }
  const depois = { ...medida('2026-01-02'), busto: 93.1 }
  await salvarMedida(antes)
  await salvarMedida(depois)
  banco.close(); await banco.open()
  const salvo = (await tabela('medidas_corporais').get(antes.id))!
  expect(salvo.busto).toBe(92.5)
  expect(salvo.peso).toBeUndefined()
  expect(diferencaMedida(salvo, depois, 'busto')).toBe(0.6)
  expect(diferencaMedida(medida('2025-12-01', 70), depois, 'busto')).toBeNull()
  await expect(salvarMedida({ ...medida('2026-01-03'), busto: 0 })).rejects.toThrow('busto')
})

test('salve centésimos de cm e preserve pequenas diferenças na comparação', async () => {
 const antes={...medida('2026-01-01'),cintura:83.70}
 const depois={...medida('2026-01-02'),cintura:lerValorMedida('cintura','83.75')}
 await salvarMedida(depois)
 expect((await tabela('medidas_corporais').get(depois.id))?.cintura).toBe(83.75)
 expect(diferencaMedida(antes,depois,'cintura')).toBe(0.05)
 expect(formatarValorMedida('cintura',diferencaMedida(antes,depois,'cintura')!)).toBe('0,05')
})
