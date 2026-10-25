import 'fake-indexeddb/auto'
import { beforeEach, expect, test } from 'vitest'
import { banco, tabela } from './banco'
import { iniciarBanco } from './configuracoes'
import { criarRegistro } from './repositorio'
import { descansoDoDia, definirDescansoDoDia, iniciarFeriados, salvarAtividade } from './atividade'
import { exportarBackup, validarBackup } from './backup'

beforeEach(async () => { await banco.delete(); await banco.open(); await iniciarBanco() })
test('sábados e domingos começam como descanso; dia útil sem feriado não', () => {
  expect(descansoDoDia('2026-10-24', [])).toBe(true)
  expect(descansoDoDia('2026-10-25', [])).toBe(true)
  expect(descansoDoDia('2026-10-23', [])).toBe(false)
})
test('feriados nacionais e locais ativam descanso; feriados removidos são ignorados', async () => {
  await iniciarFeriados(2026)
  const feriados = await tabela('feriados').toArray()
  expect(descansoDoDia('2026-10-12', feriados)).toBe(true)
  const local = { ...criarRegistro(), data: '2026-10-23', nome: 'Feriado municipal' }
  expect(descansoDoDia(local.data, [...feriados, local])).toBe(true)
  expect(descansoDoDia(local.data, [...feriados, { ...local, apagado_em: '2026-10-24' }])).toBe(false)
})
test('desativar feriado mantém o calendário, persiste ao reabrir e não afeta outros dias', async () => {
  await iniciarFeriados(2026)
  await definirDescansoDoDia('2026-10-12', false)
  banco.close(); await banco.open()
  const config = (await tabela('configuracoes').where('chave').equals('principal').first())!
  const feriados = await tabela('feriados').toArray()
  expect(descansoDoDia('2026-10-12', feriados, config.descanso_por_data)).toBe(false)
  expect(feriados.find(f => f.data === '2026-10-12')?.apagado_em).toBeFalsy()
  expect(descansoDoDia('2026-10-25', feriados, config.descanso_por_data)).toBe(true)
  expect(await tabela('treinos').count()).toBe(0)
  expect(await tabela('atividade_diaria').count()).toBe(0)
})
test('descanso manual em dia útil aplica meta de descanso sem reescrever o histórico', async () => {
  await salvarAtividade('2026-10-22', 100, 20)
  const anterior = (await tabela('atividade_diaria').toArray())[0]
  await definirDescansoDoDia('2026-10-23', true)
  await salvarAtividade('2026-10-23', 200, 30)
  const novo = await tabela('atividade_diaria').where('data').equals('2026-10-23').first()
  expect(novo?.tipo_dia).toBe('fds_feriado')
  expect(await tabela('atividade_diaria').get(anterior.id)).toEqual(anterior)
  await definirDescansoDoDia('2026-10-23', false)
  const config = (await tabela('configuracoes').where('chave').equals('principal').first())!
  expect(descansoDoDia('2026-10-23', [], config.descanso_por_data)).toBe(false)
})
test('backup conserva escolhas de descanso e rejeita tipos e datas inválidos', async () => {
  await definirDescansoDoDia('2026-10-25', false)
  const backup = JSON.parse(JSON.stringify(await exportarBackup(false, false)))
  expect(() => validarBackup(backup)).not.toThrow()
  const config = backup.tabelas.configuracoes[0]
  expect(config.descanso_por_data['2026-10-25']).toBe(false)
  config.descanso_por_data['2026-10-25'] = 'false'
  expect(() => validarBackup(backup)).toThrow('Preferências de descanso inválidas')
  config.descanso_por_data = { '2026-02-30': false }
  expect(() => validarBackup(backup)).toThrow('Preferências de descanso inválidas')
})
