import 'fake-indexeddb/auto'
import { expect, test } from 'vitest'
import { estimarEnergia, idadeEnergia, pesoParaEnergia, salvarPerfilEnergia, salvarCampoEnergia } from './energia'
import { banco } from './banco'
import { criarRegistro, repositorio } from './repositorio'
import { iniciarBanco } from './configuracoes'
import { exportarBackup, validarBackup } from './backup'
import type { MedidaCorporal } from './modelos'

const perfil = { data_nascimento: '1996-10-25', altura_cm: 175, sexo_calculo_energia: 'masculino' as const }
test('Mifflin calcula ambos os coeficientes, idade completa e diário sem arredondamento intermediário', () => {
  expect(estimarEnergia(perfil, 70, '2026-10-25')?.repouso).toBe(1649)
  expect(estimarEnergia({ ...perfil, sexo_calculo_energia: 'feminino' }, 70, '2026-10-25')?.repouso).toBe(1483)
  expect(estimarEnergia({ ...perfil, nivel_atividade_energia: 'leve' }, 70, '2026-10-25')?.diario).toBe(2556)
  expect(estimarEnergia(perfil, 70, '2026-10-25')?.diario).toBeUndefined()
  expect(idadeEnergia('1996-10-26', '2026-10-25')).toBe(29)
  expect(idadeEnergia('1996-02-30', '2026-10-25')).toBeUndefined()
  expect(idadeEnergia('2027-01-01', '2026-10-25')).toBeUndefined()
})

test('não inventa valores com dados faltantes, inválidos ou fora da faixa atendida', () => {
  expect(estimarEnergia({}, 70, '2026-10-25')).toBeNull()
  expect(estimarEnergia(perfil, undefined, '2026-10-25')).toBeNull()
  expect(estimarEnergia(perfil, NaN, '2026-10-25')).toBeNull()
  expect(estimarEnergia({ ...perfil, data_nascimento: '2010-10-25' }, 70, '2026-10-25')).toBeNull()
  expect(estimarEnergia({ ...perfil, data_nascimento: '1940-10-25' }, 70, '2026-10-25')).toBeNull()
})

test('último peso ignora medições sem peso, futuras, removidas e inválidas', () => {
  const medida = (data: string, peso?: number): MedidaCorporal => ({ ...criarRegistro(), data, peso })
  const itens = [medida('2026-10-25'), medida('2026-10-24', 70), medida('2026-10-26', 90), { ...medida('2026-10-25', 80), apagado_em: '2026-10-25T00:00:00Z' }, medida('2026-10-25', NaN)]
  expect(pesoParaEnergia(itens, '2026-10-25')?.peso).toBe(70)
  expect(itens).toHaveLength(5)
})

test('perfil persiste, mantém outras configurações e backup não gera meta automaticamente', async () => {
  await banco.delete(); await banco.open(); await iniciarBanco()
  const original = (await repositorio('configuracoes').listar())[0]
  await repositorio('configuracoes').salvar({ ...original, meta_agua_ml: 4000 })
  await salvarPerfilEnergia({ ...perfil, nivel_atividade_energia: 'moderada', meta_kcal_util: 0, meta_kcal_fds_feriado: 0 })
  const atual = (await repositorio('configuracoes').listar())[0]
  expect(atual.meta_agua_ml).toBe(4000)
  expect(atual.meta_kcal_util).toBe(0)
  expect(atual.meta_kcal_fds_feriado).toBe(0)
  const backup = validarBackup(await exportarBackup())
  expect(backup.tabelas.configuracoes[0].data_nascimento).toBe('1996-10-25')
  expect(backup.tabelas.configuracoes[0].nivel_atividade_energia).toBe('moderada')
  await salvarPerfilEnergia({ ...perfil, meta_kcal_util: 2000, meta_kcal_fds_feriado: 2200 })
  expect((await repositorio('configuracoes').listar())[0].nivel_atividade_energia).toBeUndefined()
  await expect(salvarPerfilEnergia({ ...perfil, altura_cm: NaN, meta_kcal_util: 0, meta_kcal_fds_feriado: 0 })).rejects.toThrow()
  await expect(salvarPerfilEnergia({ ...perfil, meta_kcal_util: -1, meta_kcal_fds_feriado: 0 })).rejects.toThrow()
})

test('campos salvam separadamente no perfil incompleto sem perder valores anteriores', async () => {
 await banco.delete(); await banco.open(); await iniciarBanco()
 await salvarCampoEnergia('meta_kcal_util', 2000)
 await salvarCampoEnergia('altura_cm', 175)
 await salvarCampoEnergia('sexo_calculo_energia', 'masculino')
 await salvarCampoEnergia('data_nascimento', '2000-01-01')
 await salvarCampoEnergia('nivel_atividade_energia', 'moderada')
 await salvarCampoEnergia('nivel_atividade_energia', undefined)
 const atual = (await repositorio('configuracoes').listar())[0]
 expect(atual.meta_kcal_util).toBe(2000)
 expect(atual.altura_cm).toBe(175)
 expect(atual.sexo_calculo_energia).toBe('masculino')
 expect(atual.data_nascimento).toBe('2000-01-01')
 expect(atual.nivel_atividade_energia).toBeUndefined()
 await expect(salvarCampoEnergia('data_nascimento','2000-02-30')).rejects.toThrow()
 await expect(salvarCampoEnergia('meta_kcal_util',-1)).rejects.toThrow()
 expect((await repositorio('configuracoes').listar())[0].meta_kcal_util).toBe(2000)
})
