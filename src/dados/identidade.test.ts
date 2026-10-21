import 'fake-indexeddb/auto'
import { expect, test } from 'vitest'
import { abrirIdentidade, banco, identidadeAtual, tabela, observarBanco } from './banco'
import { criarRegistro, repositorio } from './repositorio'
import { pendencias, controle } from '../sincronizacao/armazenamento'

test('A → B → visitante → A isola registros, fila e fotos e fecha instância anterior', async () => {
 const a='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',b='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
 for (const dono of [a,b,null]) {
  const anterior=banco
  const parar=observarBanco(()=>{expect(anterior.isOpen()).toBe(false);expect(banco.isOpen()).toBe(false)})
  await abrirIdentidade(dono)
  parar()
  expect(anterior.isOpen()).toBe(false)
  await banco.delete(); await banco.open()
  expect(identidadeAtual()).toBe(dono)
  await repositorio('fichas').salvar({...criarRegistro(),id:'ficha',nome:dono ?? 'visitante',ordem:0})
  await tabela('fotos').add({...criarRegistro(),id:'foto',tipo:'maquina',data:'2026-10-21',angulo:null,tamanho_bytes:1,imagem_local:new Blob([dono ?? 'visitante'])})
  await controle.put({chave:'teste',valor:dono ?? 'visitante'})
  await pendencias.put({chave:'fila',usuario:dono ?? 'visitante',tabela:'fichas',registro:{id:'ficha',user_id:dono ?? '',criado_em:'2026-10-21',atualizado_em:'2026-10-21',apagado_em:null,dados:{id:'ficha',atualizado_em:'2026-10-21'}},assinatura:'teste'})
 }
 const anterior=banco, repoAnterior=repositorio('fichas')
 await abrirIdentidade(a)
 expect(anterior.isOpen()).toBe(false)
 await expect(repoAnterior.listar()).rejects.toThrow('mudou')
 expect((await repositorio('fichas').listar()).map(f=>f.user_id)).toEqual([a])
 expect((await tabela('fotos').get('foto'))?.user_id).toBe(a)
 expect((await controle.get('teste'))?.valor).toBe(a)
 expect((await pendencias.get('fila'))?.usuario).toBe(a)
 // Defesa em profundidade: registro inválido inserido diretamente não aparece no repositório.
 await tabela('fichas').put({...criarRegistro(b),id:'estranha',nome:'B',ordem:0})
 expect((await repositorio('fichas').listar()).map(f=>f.user_id)).toEqual([a])
 expect(await repositorio('fichas').obter('estranha')).toBeUndefined()
 await abrirIdentidade(null)
})
