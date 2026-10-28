import 'fake-indexeddb/auto'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { banco } from './banco'
import { iniciarBanco } from './configuracoes'
import { criarRegistro, repositorio } from './repositorio'
import { referenciaAlimentar, registrarReferenciaHoje } from './referenciaAlimentar'

beforeEach(async () => {
  vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(new Date('2026-10-26T12:00:00-03:00'))
  await banco.delete(); await banco.open(); await iniciarBanco()
})
afterEach(() => vi.useRealTimers())
async function preparar() {
  const repo = repositorio('configuracoes'), config = (await repo.listar())[0]
  const perfil = { ...config, data_nascimento: '1996-10-25', sexo_calculo_energia: 'masculino' as const, altura_cm: 175, nivel_atividade_energia: 'leve' as const }
  await repo.salvar(perfil)
  await repositorio('medidas_corporais').salvar({ ...criarRegistro(), data: '2026-10-26', peso: 70 })
  return perfil
}
test('meta manual tem prioridade e manutenção usa gasto com rotina, não a basal', async () => {
  const perfil = await preparar()
  expect(referenciaAlimentar(perfil, 70, 'util', '2026-10-26')).toEqual({ kcal: 2556, origem: 'manutencao' })
  expect(referenciaAlimentar({ ...perfil, nivel_atividade_energia: 'sedentaria' }, 70, 'util', '2026-10-26')).toEqual({ kcal: 1979, origem: 'manutencao' })
  expect(referenciaAlimentar({ ...perfil, meta_kcal_util: 2000 }, 70, 'util', '2026-10-26')).toEqual({ kcal: 2000, origem: 'manual' })
  expect(referenciaAlimentar({ ...perfil, meta_kcal_fds_feriado: 2200 }, 70, 'fds_feriado', '2026-10-26')).toEqual({ kcal: 2200, origem: 'manual' })
})
test('sem perfil, peso ou rotina não inventa manutenção', async () => {
  const perfil = await preparar()
  for (const [config, peso] of [[undefined, 70], [perfil, undefined], [{ ...perfil, nivel_atividade_energia: undefined }, 70]] as const) {
    expect(referenciaAlimentar(config, peso, 'util', '2026-10-26')).toEqual({ kcal: 0, origem: 'nenhuma' })
  }
})
test('atualiza hoje sem criar duplicatas nem reescrever dias anteriores ou metas manuais', async () => {
  await preparar(); await registrarReferenciaHoje(); await registrarReferenciaHoje()
  const repo = repositorio('consumo_diario_meta')
  expect(await repo.listar()).toHaveLength(1)
  const ontem = (await repo.listar())[0]
  vi.setSystemTime(new Date('2026-10-27T12:00:00-03:00'))
  const configRepo = repositorio('configuracoes'), config = (await configRepo.listar())[0]
  await configRepo.salvar({ ...config, meta_kcal_util: 1800 })
  await registrarReferenciaHoje()
  expect(await repo.obter(ontem.id)).toEqual(ontem)
  expect((await repo.listar()).find(r => r.data === '2026-10-27')).toMatchObject({ meta_kcal_aplicada: 1800, origem_meta: 'manual' })
  expect((await configRepo.listar())[0].meta_kcal_fds_feriado).toBe(0)
})
