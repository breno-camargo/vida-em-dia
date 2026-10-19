import 'fake-indexeddb/auto'
import { beforeEach, expect, test } from 'vitest'
import { banco, tabela } from './banco'
import { iniciarBanco } from './configuracoes'
import { criarRegistro } from './repositorio'
import { dataMedida } from './medidas'
import { controle, filaBanco } from '../sincronizacao/armazenamento'
import { prepararPerfilCadastro, salvarPerfilCadastro, validarPerfilCadastro, descartarPerfilCadastro } from './perfilCadastro'

const usuario = { id: 'teste', email: 'teste@example.com' }
const perfil = () => ({ email: usuario.email, nome: 'Breno', altura_cm: 175, medida: { ...criarRegistro(), data: dataMedida(), peso: 77.83, cintura: 83.75 } })
beforeEach(async () => {
  descartarPerfilCadastro(); await banco.delete(); await banco.open(); await iniciarBanco()
  await filaBanco.delete(); await filaBanco.open()
})
async function conectar() {
  await controle.put({ chave: 'usuario', valor: usuario.id })
  const config = (await tabela('configuracoes').toArray())[0]
  await tabela('configuracoes').update(config.id, { user_id: usuario.id })
}

test('nome é obrigatório, medidas/altura são opcionais e rascunho não grava no banco', async () => {
  expect(() => validarPerfilCadastro({ nome: 'Breno' })).not.toThrow()
  prepararPerfilCadastro(usuario.email, perfil())
  expect(await tabela('medidas_corporais').count()).toBe(0)
  expect((await tabela('configuracoes').toArray())[0].altura_cm).toBeUndefined()
})

test('somente conta vinculada salva medidas com precisão e proprietário corretos', async () => {
  await conectar()
  await salvarPerfilCadastro(usuario, perfil(), () => usuario.id)
  expect((await tabela('medidas_corporais').toArray())[0]).toMatchObject({ user_id: usuario.id, peso: 77.83, cintura: 83.75 })
  expect((await tabela('configuracoes').toArray())[0].altura_cm).toBe(175)
})

test('primeiro vínculo aceita configuração visitante, mas rejeita proprietário de outra conta', async () => {
  await controle.put({ chave: 'usuario', valor: usuario.id })
  await salvarPerfilCadastro(usuario, perfil(), () => usuario.id)
  const config = (await tabela('configuracoes').toArray())[0]
  expect(config.user_id).toBe(usuario.id)
  await tabela('configuracoes').update(config.id, { user_id: 'outra-conta' })
  await expect(salvarPerfilCadastro(usuario, perfil(), () => usuario.id)).rejects.toThrow('conta deste aparelho mudou')
})

test('sem vínculo ou com e-mail de outra conta não grava nada', async () => {
  await expect(salvarPerfilCadastro(usuario, perfil(), () => usuario.id)).rejects.toThrow('Conecte')
  await conectar()
  await expect(salvarPerfilCadastro({ ...usuario, email: 'outra@example.com' }, perfil(), () => usuario.id)).rejects.toThrow('outro cadastro')
  expect(await tabela('medidas_corporais').count()).toBe(0)
})

test('conflito de medida existente preserva registro e também reverte altura', async () => {
  await conectar()
  await tabela('medidas_corporais').add({ ...criarRegistro(usuario.id), data: dataMedida(), peso: 80 })
  await expect(salvarPerfilCadastro(usuario, perfil(), () => usuario.id)).rejects.toThrow('Já há um registro')
  expect((await tabela('medidas_corporais').toArray())[0].peso).toBe(80)
  expect((await tabela('configuracoes').toArray())[0].altura_cm).toBeUndefined()
})

test('troca de sessão durante gravação reverte a transação inteira', async () => {
  await conectar()
  let chamadas = 0
  await expect(salvarPerfilCadastro(usuario, perfil(), () => ++chamadas <= 2 ? usuario.id : undefined)).rejects.toThrow('sessão mudou')
  expect(await tabela('medidas_corporais').count()).toBe(0)
  expect((await tabela('configuracoes').toArray())[0].altura_cm).toBeUndefined()
})
