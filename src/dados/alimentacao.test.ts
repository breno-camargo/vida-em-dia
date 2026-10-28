import 'fake-indexeddb/auto'
import { expect, test } from 'vitest'
import { calcularPorcao, lerGramas, nomeAlimento, salvarAlimentoPessoal, salvarRefeicaoCompleta, excluirAlimentoPessoal, alterarVisibilidadeAlimentosComuns } from './alimentacao'
import { alimentosComuns } from './alimentosComuns'
import { validarDominioBackup } from './validacaoBackup'
import { criarRegistro, repositorio } from './repositorio'
import { banco } from './banco'
import { exportarBackup, validarBackup } from './backup'
import { iniciarBanco } from './configuracoes'
import { tipoAlimento } from './tiposAlimentos'
import { agruparAlimentosRefeicao } from './alimentacao'

test('mesmo alimento na mesma refeicao soma porcoes sem alterar registros nem misturar cadastros', () => {
  const arroz = { ...criarRegistro(), data: '2026-10-25', refeicao: 'Almoço', horario: '12:00', descricao: 'Arroz', quantidade_g: 100, precisao: 'exato' as const, kcal: 128, proteina_g: 2.5, carbo_g: 28.1, sodio_mg: 1 }
  const outro = { ...arroz, ...criarRegistro(), horario: '13:00', sodio_mg: undefined }
  const jantar = { ...arroz, ...criarRegistro(), refeicao: 'Jantar' }
  const pessoal = { ...arroz, ...criarRegistro(), alimento_id: 'pessoal-diferente' }
  const entrada = [arroz, outro, jantar, pessoal]
  const antes = structuredClone(entrada)
  const agrupados = agruparAlimentosRefeicao(entrada)
  expect(agrupados).toHaveLength(3)
  expect(agrupados[0]).toMatchObject({ quantidade_g: 200, kcal: 256, proteina_g: 5, carbo_g: 56.2 })
  expect(agrupados[0].sodio_mg).toBeUndefined()
  expect(entrada).toEqual(antes)
})

test('reabrir banco e inicializar app preserva alimento antigo sem categoria e configuracoes', async () => {
  await banco.delete(); await banco.open(); await iniciarBanco()
  const alimento = { ...criarRegistro(), nome: 'Cadastro anterior', marca: 'Marca pessoal', porcao: '50 g', base_quantidade_g: 50, vezes_usado: 3, kcal: 120, proteina_g: 4, carbo_g: 20, gordura_g: 2 }
  await repositorio('alimentos_favoritos').salvar(alimento)
  const salvo = await repositorio('alimentos_favoritos').obter(alimento.id)
  const config = (await repositorio('configuracoes').listar())[0]
  await repositorio('configuracoes').salvar({ ...config, garrafa_ml: 750, meta_agua_ml: 3000, altura_cm: 175 })
  const configuracaoSalva = (await repositorio('configuracoes').listar())[0]
  banco.close(); await banco.open(); await iniciarBanco()
  expect(await repositorio('alimentos_favoritos').obter(alimento.id)).toEqual(salvo)
  expect(tipoAlimento(salvo!)).toBe('Outros')
  expect((await repositorio('configuracoes').listar())[0]).toEqual(configuracaoSalva)
  const backup = validarBackup(await exportarBackup())
  expect(backup.tabelas.alimentos_favoritos).toEqual([salvo])
})

test('calcula 63 g a partir de um rótulo de 50 g sem arredondar nutrientes a cada item', () => {
  expect(calcularPorcao({ kcal: 120, proteina_g: 5, carbo_g: 22, fibra_g: 3, gordura_g: 1 }, 50, 63)).toEqual({ kcal: 151.2, proteina_g: 6.3, carbo_g: 27.72, fibra_g: 3.78, gordura_g: 1.26 })
  expect(lerGramas('63,5')).toBe(63.5)
  for (const texto of ['', '-1', '1e3', 'Infinity', '1.2.3']) expect(lerGramas(texto)).toBeNaN()
  expect(() => calcularPorcao({ kcal: 120 }, 0, 63)).toThrow()
  expect(() => calcularPorcao({ kcal: NaN }, 50, 63)).toThrow()
})

test('backup aceita campos antigos e novos e rejeita fibra e quantidades inválidas', () => {
  const linha = { ...criarRegistro(), kcal: 120 }
  expect(() => validarDominioBackup('alimentos_favoritos', linha)).not.toThrow()
  expect(() => validarDominioBackup('alimentos_favoritos', { ...linha, base_quantidade_g: 50, fibra_g: 3 })).not.toThrow()
  expect(() => validarDominioBackup('alimentos_favoritos', { ...linha, base_quantidade_g: 0 })).toThrow()
  expect(() => validarDominioBackup('alimentos_favoritos', { ...linha, fibra_g: '3' })).toThrow()
  expect(() => validarDominioBackup('alimentos_favoritos', { ...linha, sodio_mg: 217 })).not.toThrow()
  expect(() => validarDominioBackup('alimentos_favoritos', { ...linha, sodio_mg: -1 })).toThrow()
  expect(() => validarDominioBackup('alimentos_favoritos', { ...linha, sodio_mg: '217' })).toThrow()
  expect(() => validarDominioBackup('refeicoes_dia', { ...linha, precisao: 'exato', quantidade_g: -1 })).toThrow()
})

test('consumo preserva snapshot após editar alimento e é incluído no backup', async () => {
  await banco.delete(); await banco.open(); await iniciarBanco()
  const alimento = { ...criarRegistro(), nome: 'Pão de teste', porcao: '50 g', base_quantidade_g: 50, vezes_usado: 0, kcal: 120, fibra_g: 3, sodio_mg: 217, acucares_g: 2.5 }
  await repositorio('alimentos_favoritos').salvar(alimento)
  const registro = { ...criarRegistro(), data: '2026-10-25', refeicao: 'Lanche', horario: '12:00', descricao: alimento.nome, alimento_id: alimento.id, quantidade_g: 63, precisao: 'exato' as const, ...calcularPorcao(alimento, 50, 63) }
  await repositorio('refeicoes_dia').salvar(registro)
  const anterior = (await repositorio('alimentos_favoritos').obter(alimento.id))!
  await salvarAlimentoPessoal({ ...anterior, nome: 'Novo nome', marca: 'Marca atualizada', kcal: 200, base_quantidade_g: 80 }, anterior)
  expect((await repositorio('refeicoes_dia').obter(registro.id))?.kcal).toBe(151.2)
  expect((await repositorio('refeicoes_dia').obter(registro.id))?.descricao).toBe('Pão de teste')
  expect(nomeAlimento((await repositorio('alimentos_favoritos').obter(alimento.id))!)).toBe('Novo nome · Marca atualizada')
  await expect(salvarAlimentoPessoal({ ...anterior, kcal: 300 }, anterior)).rejects.toThrow()
  const backup = validarBackup(await exportarBackup())
  expect(backup.tabelas.refeicoes_dia[0].fibra_g).toBe(3.78)
  expect(backup.tabelas.refeicoes_dia[0].sodio_mg).toBe(273.42)
  expect(backup.tabelas.refeicoes_dia[0].acucares_g).toBe(3.15)
  await repositorio('refeicoes_dia').apagar(registro.id)
  expect(await repositorio('refeicoes_dia').listar()).toHaveLength(0)
})

test('cópia pessoal não altera o catálogo comum e alimento removido não é ressuscitado', async () => {
  await banco.delete(); await banco.open(); await iniciarBanco()
  const original = JSON.stringify(alimentosComuns)
  const referencia = alimentosComuns[0]
  const copia = { ...criarRegistro(), nome: referencia.nome, marca: 'Minha versão', porcao: '100 g', base_quantidade_g: 100, vezes_usado: 0, kcal: 150 }
  await salvarAlimentoPessoal(copia)
  const anterior = (await repositorio('alimentos_favoritos').obter(copia.id))!
  await repositorio('alimentos_favoritos').apagar(copia.id)
  await expect(salvarAlimentoPessoal({ ...anterior, kcal: 200 }, anterior)).rejects.toThrow()
  expect(JSON.stringify(alimentosComuns)).toBe(original)
  expect(await repositorio('alimentos_favoritos').listar()).toHaveLength(0)
})

test('sódio é proporcional em mg e ausência permanece diferente de zero', () => {
  expect(calcularPorcao({ kcal: 125, sodio_mg: 217 }, 50, 63).sodio_mg).toBe(273.42)
  expect(calcularPorcao({ kcal: 125, sodio_mg: 0 }, 50, 63).sodio_mg).toBe(0)
  expect(calcularPorcao({ kcal: 125 }, 50, 63).sodio_mg).toBeUndefined()
})

test('refeição completa salva todos os alimentos e reverte tudo se um falhar', async () => {
  await banco.delete(); await banco.open(); await iniciarBanco()
  const item = () => ({ ...criarRegistro(), data: '2026-10-25', refeicao: 'Café da manhã', horario: '08:00', descricao: 'Alimento sintético', quantidade_g: 50, precisao: 'exato' as const, kcal: 120, sodio_mg: 217 })
  await expect(salvarRefeicaoCompleta([item(), { ...item(), user_id: 'outro-usuario' }])).rejects.toThrow()
  expect(await repositorio('refeicoes_dia').listar()).toHaveLength(0)
  const primeiro = item(), segundo = { ...item(), descricao: 'Segundo alimento', kcal: 80 }
  await salvarRefeicaoCompleta([primeiro, segundo])
  const salvos = await repositorio('refeicoes_dia').listar()
  expect(salvos).toHaveLength(2)
  expect(salvos.reduce((total, r) => total + r.kcal, 0)).toBe(200)
  await repositorio('refeicoes_dia').salvar({ ...primeiro, kcal: 140 })
  expect((await repositorio('refeicoes_dia').obter(segundo.id))?.kcal).toBe(80)
  await expect(salvarRefeicaoCompleta([])).rejects.toThrow()
  await expect(salvarRefeicaoCompleta([{ ...item(), quantidade_g: -1 }])).rejects.toThrow()
})

test('excluir alimento pessoal preserva refeições e seu backup, inclusive rascunhos antigos', async () => {
  await banco.delete(); await banco.open(); await iniciarBanco()
  const alimento = { ...criarRegistro(), nome: 'Alimento teste', porcao: '50 g', base_quantidade_g: 50, vezes_usado: 0, kcal: 120 }
  await salvarAlimentoPessoal(alimento)
  const registro = { ...criarRegistro(), data: '2026-10-25', refeicao: 'Lanche', horario: '12:00', descricao: alimento.nome, alimento_id: alimento.id, quantidade_g: 50, precisao: 'exato' as const, kcal: 120 }
  await salvarRefeicaoCompleta([registro])
  await excluirAlimentoPessoal(alimento.id)
  expect(await repositorio('alimentos_favoritos').listar()).toHaveLength(0)
  expect(await repositorio('refeicoes_dia').obter(registro.id)).toMatchObject({ descricao: alimento.nome, kcal: 120 })
  expect((await repositorio('refeicoes_dia').obter(registro.id))?.alimento_id).toBeUndefined()
  await salvarRefeicaoCompleta([{ ...registro, ...criarRegistro() }])
  const backup = validarBackup(await exportarBackup())
  expect(backup.tabelas.refeicoes_dia).toHaveLength(2)
  expect(backup.tabelas.alimentos_favoritos).toHaveLength(0)
})

test('pré-cadastrado removido fica oculto na configuração e pode ser restaurado', async () => {
  await banco.delete(); await banco.open(); await iniciarBanco()
  const original = JSON.stringify(alimentosComuns), id = alimentosComuns[0].id
  await alterarVisibilidadeAlimentosComuns(id)
  await alterarVisibilidadeAlimentosComuns(id)
  expect((await repositorio('configuracoes').listar())[0].alimentos_comuns_ocultos).toEqual([id])
  expect(validarBackup(await exportarBackup()).tabelas.configuracoes[0].alimentos_comuns_ocultos).toEqual([id])
  await alterarVisibilidadeAlimentosComuns()
  expect((await repositorio('configuracoes').listar())[0].alimentos_comuns_ocultos).toEqual([])
  expect(JSON.stringify(alimentosComuns)).toBe(original)
  expect(() => validarDominioBackup('configuracoes', { ...criarRegistro(), alimentos_comuns_ocultos: [5] })).toThrow()
})

test('acucares sao proporcionais sem somar calorias novamente e aceitam ausencia', () => {
  expect(calcularPorcao({ kcal: 125, acucares_g: 2.5 }, 50, 63)).toEqual({ kcal: 157.5, acucares_g: 3.15 })
  expect(calcularPorcao({ kcal: 125, acucares_g: 0 }, 50, 63).acucares_g).toBe(0)
  expect(calcularPorcao({ kcal: 125 }, 50, 63).acucares_g).toBeUndefined()
  for (const tabela of ['alimentos_favoritos', 'refeicoes_dia'] as const) {
    const linha = { ...criarRegistro(), kcal: 125, precisao: 'exato' }
    expect(() => validarDominioBackup(tabela, { ...linha, acucares_g: 0 })).not.toThrow()
    for (const valor of [-1, '2', NaN, Infinity]) expect(() => validarDominioBackup(tabela, { ...linha, acucares_g: valor })).toThrow()
  }
})

test('editar refeicao inteira preserva snapshots e remove itens atomicamente', async () => {
  await banco.delete(); await banco.open(); await iniciarBanco()
  const item = (nome: string) => ({ ...criarRegistro(), data: '2026-10-25', refeicao: 'Almoco', horario: '12:00', descricao: nome, quantidade_g: 50, precisao: 'exato' as const, kcal: 125, acucares_g: 2 })
  await salvarRefeicaoCompleta([item('Primeiro'), item('Segundo')])
  const antes = await repositorio('refeicoes_dia').listar()
  await expect(salvarRefeicaoCompleta([{ ...antes[0], quantidade_g: -1 }], antes)).rejects.toThrow()
  expect(await repositorio('refeicoes_dia').listar()).toHaveLength(2)
  await salvarRefeicaoCompleta([{ ...antes[0], quantidade_g: 100, kcal: 250, acucares_g: 4 }, item('Terceiro')], antes)
  const depois = await repositorio('refeicoes_dia').listar()
  expect(depois).toHaveLength(2)
  expect(depois.find(r => r.id === antes[0].id)).toMatchObject({ kcal: 250, acucares_g: 4, criado_em: antes[0].criado_em, horario: antes[0].horario })
  expect(depois.some(r => r.id === antes[1].id)).toBe(false)
  await expect(salvarRefeicaoCompleta([antes[0]], antes)).rejects.toThrow('mudou')
  expect(await repositorio('refeicoes_dia').listar()).toEqual(depois)
})

test('edicao rejeita inclusao concorrente sem perder alimentos', async () => {
  await banco.delete(); await banco.open(); await iniciarBanco()
  const r = { ...criarRegistro(), data: '2026-10-25', refeicao: 'Lanche', horario: '12:00', descricao: 'Teste', quantidade_g: 50, precisao: 'exato' as const, kcal: 125 }
  await salvarRefeicaoCompleta([r])
  const antes = await repositorio('refeicoes_dia').listar()
  await salvarRefeicaoCompleta([{ ...r, ...criarRegistro() }])
  await expect(salvarRefeicaoCompleta(antes, antes)).rejects.toThrow('mudou')
  expect(await repositorio('refeicoes_dia').listar()).toHaveLength(2)
})

test('excluir refeicao inteira remove so o grupo escolhido e preserva outro', async () => {
 await banco.delete(); await banco.open(); await iniciarBanco()
 const item = { ...criarRegistro(), data: '2026-10-25', refeicao: 'Almoco', horario: '12:00', descricao: 'Teste', quantidade_g: 50, precisao: 'exato' as const, kcal: 125 }
 await salvarRefeicaoCompleta([item])
 await salvarRefeicaoCompleta([{ ...item, ...criarRegistro(), refeicao: 'Jantar' }])
 const antes = (await repositorio('refeicoes_dia').listar()).filter(r => r.refeicao === 'Almoco')
 await salvarRefeicaoCompleta([], antes)
 expect((await repositorio('refeicoes_dia').listar()).map(r => r.refeicao)).toEqual(['Jantar'])
})
