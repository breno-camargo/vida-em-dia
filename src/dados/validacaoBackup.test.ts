import 'fake-indexeddb/auto'
import { beforeEach, expect, test } from 'vitest'
import { banco, tabela } from './banco'
import { iniciarBanco } from './configuracoes'
import { iniciarBiblioteca } from './biblioteca'
import { criarRegistro } from './repositorio'
import { exportarBackup, importarBackup, validarBackup } from './backup'

beforeEach(async () => { await banco.delete(); await banco.open(); await iniciarBanco(); await iniciarBiblioteca() })

async function exemplo() {
  const b = await exportarBackup(false)
  const ex = b.tabelas.exercicios[0]
  const treino = { ...criarRegistro(), data: '2026-10-16', inicio: '2026-10-16T10:00:00Z', observacao: '', duracao_minutos: 0 }
  b.tabelas.treinos.push(treino)
  // Campos opcionais de carga ausentes, como em registros antigos.
  b.tabelas.series_treino.push({ ...criarRegistro(), treino_id: treino.id, exercicio_id: ex.id, numero_serie: 1, tipo: 'normal', peso_digitado: 0, peso_total: 0, repeticoes: 10, recorde: false })
  return b
}

test.each([
  ['peso_digitado', -1], ['peso_digitado', 2001], ['peso_total', -1], ['repeticoes', -5],
  ['repeticoes', 0], ['repeticoes', 1.5], ['repeticoes', 1001], ['numero_serie', 0], ['numero_serie', 1.5], ['rpe', 11],
])('rejeita série com %s = %s', async (campo, valor) => {
  const b = await exemplo(); b.tabelas.series_treino[0][campo] = valor
  expect(() => validarBackup(b)).toThrow(`series_treino.${campo}`)
})

test.each(['treino_id', 'exercicio_id'])('rejeita vínculo obrigatório inexistente: %s', async campo => {
  const b = await exemplo(); b.tabelas.series_treino[0][campo] = 'inexistente'
  expect(() => validarBackup(b)).toThrow('Vínculo inválido')
})

test('valida vínculos opcionais, sem exigir vínculo para uma foto independente', async () => {
  const b = await exemplo()
  b.tabelas.fotos.push({ ...criarRegistro(), tipo: 'progresso', data: '2026-10-16', angulo: 'frente', tamanho_bytes: 0 })
  expect(() => validarBackup(b)).not.toThrow()
  b.tabelas.fotos[0].medida_id = 'ausente'
  expect(() => validarBackup(b)).toThrow('fotos.medida_id')
  delete b.tabelas.fotos[0].medida_id
  b.tabelas.treinos[0].ficha_id = 'ausente'
  expect(() => validarBackup(b)).toThrow('treinos.ficha_id')
})

test('aceita pais excluídos, carga zero, legado e medidas com precisão preservada', async () => {
  const b = await exemplo(), data = '2026-10-16T11:00:00Z'
  b.tabelas.treinos[0].apagado_em = data
  b.tabelas.exercicios[0].apagado_em = data
  b.tabelas.medidas_corporais.push({ ...criarRegistro(), data: '2026-10-16', peso: 77.83, cintura: 83.75 })
  await importarBackup(b, 'substituir')
  expect((await tabela('series_treino').toArray())[0].repeticoes).toBe(10)
  expect((await tabela('treinos').toArray())[0].apagado_em).toBe(data)
  expect((await tabela('medidas_corporais').toArray())[0].cintura).toBe(83.75)
})

test.each(['mesclar', 'substituir'] as const)('arquivo inválido preserva integralmente o banco em %s', async modo => {
  const antes = (await exportarBackup(true)).tabelas
  const b = await exemplo(); b.tabelas.series_treino[0].treino_id = 'ausente'
  await expect(importarBackup(b, modo)).rejects.toThrow('Vínculo inválido')
  expect((await exportarBackup(true)).tabelas).toEqual(antes)
})

test.each([-1, 0, 401])('rejeita peso corporal inválido: %s', async peso => {
  const b = await exemplo()
  b.tabelas.medidas_corporais.push({ ...criarRegistro(), data: '2026-10-16', peso })
  expect(() => validarBackup(b)).toThrow('medidas_corporais.peso')
})

test('rejeita duração zero, frequência invertida e passos fracionários no cardio', async () => {
  const b = await exemplo()
  const cardio = { ...criarRegistro(), data: '2026-10-16', tipo: 'futebol', duracao_minutos: 0, observacao: '', fc_media: 150, fc_max: 170, passos: 754 }
  b.tabelas.cardio_sessoes.push(cardio)
  expect(() => validarBackup(b)).toThrow('duracao_minutos')
  cardio.duracao_minutos = 1 + 33 / 60
  cardio.passos = 1.5
  expect(() => validarBackup(b)).toThrow('passos')
  cardio.passos = 754
  cardio.fc_max = 140
  expect(() => validarBackup(b)).toThrow('fc_media')
  cardio.fc_max = 170
  expect(() => validarBackup(b)).not.toThrow()
})

test('rejeita números inválidos em reduções e itens de combo', async () => {
  const b = await exemplo()
  b.tabelas.series_treino[0].reducoes = [{ peso_digitado: 5, repeticoes: -2 }]
  expect(() => validarBackup(b)).toThrow('reducoes')
  delete b.tabelas.series_treino[0].reducoes
  b.tabelas.combos_refeicao.push({ ...criarRegistro(), nome: 'Combo', itens: [{ descricao: 'Item', kcal: -1 }] })
  expect(() => validarBackup(b)).toThrow('itens.kcal')
})
