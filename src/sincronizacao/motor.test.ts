import 'fake-indexeddb/auto'
import {beforeEach,expect,test}from 'vitest'
import {banco,tabela}from '../dados/banco'
import {iniciarBanco}from '../dados/configuracoes'
import {iniciarBiblioteca}from '../dados/biblioteca'
import {criarRegistro}from '../dados/repositorio'
import {aparelhoSemRegistros,contarPendencias,executarSync,filaBanco,nomesSync,prepararFila,prepararPrimeiroLogin,vincular,type NomeSync,type Remoto,type Transporte}from './motor'
const usuario='11111111-1111-4111-8111-111111111111'
const ficha=(nome='Ficha A',atualizado='2026-10-14T12:00:00Z')=>({...criarRegistro(),id:'ficha-a',nome,ordem:1,atualizado_em:atualizado})
function nuvem(){
 const tabelas=Object.fromEntries(nomesSync.map(n=>[n,new Map<string,Remoto>()])) as Record<NomeSync,Map<string,Remoto>>
 const chamadas:NomeSync[]=[]
 const transporte:Transporte={
  async enviar(n,linhas){chamadas.push(n);for(const r of linhas){const atual=tabelas[n].get(r.id);if(!atual||Date.parse(r.atualizado_em)>Date.parse(atual.atualizado_em))tabelas[n].set(r.id,structuredClone(r))}},
  async baixar(n,depois){return [...tabelas[n].values()].filter(r=>r.id>depois).sort((a,b)=>a.id<b.id?-1:1).slice(0,200).map(r=>structuredClone(r))},
 }
 return{tabelas,chamadas,transporte}
}
function remoto(r:ReturnType<typeof ficha>):Remoto{const dados={...r,user_id:usuario};return {id:r.id,user_id:usuario,criado_em:r.criado_em,atualizado_em:r.atualizado_em,apagado_em:null,dados}}
beforeEach(async()=>{await banco.delete();await banco.open();;await iniciarBanco()})
test('envie somente alterações, normalize ordem das chaves e preserve fotos fora do sync',async()=>{
 const n=nuvem();await tabela('fichas').add(ficha());await vincular(usuario);await executarSync(usuario,n.transporte)
 expect(await contarPendencias(usuario)).toBe(0)
 expect((await tabela('fichas').get('ficha-a'))?.user_id).toBe(usuario)
 n.chamadas.length=0;await executarSync(usuario,n.transporte);expect(n.chamadas).toHaveLength(0)
 await tabela('fichas').update('ficha-a',{nome:'Ficha B',atualizado_em:'2026-10-15T00:00:00Z'})
 await executarSync(usuario,n.transporte);expect(n.chamadas).toEqual(['fichas'])
 expect(n.tabelas.fichas.get('ficha-a')?.dados.nome).toBe('Ficha B')
})
test('mantenha a fila após falha e retome sem duplicar registros',async()=>{
 const n=nuvem();await tabela('fichas').add(ficha());await vincular(usuario)
 const comFalha:Transporte={...n.transporte,async enviar(){throw new Error('Sem conexão')}}
 await expect(executarSync(usuario,comFalha)).rejects.toThrow('Sem conexão')
 expect(await contarPendencias(usuario)).toBeGreaterThan(0)
 filaBanco.close();await filaBanco.open()
 await executarSync(usuario,n.transporte);expect(n.tabelas.fichas.size).toBe(1);expect(await contarPendencias(usuario)).toBe(0)
})
test('aplique remoto mais recente e exclusões, mantendo mudança local concorrente para o próximo envio',async()=>{
 const n=nuvem();await vincular(usuario);await tabela('fichas').add(ficha())
 n.tabelas.fichas.set('ficha-a',remoto(ficha('Remoto','2026-10-16T00:00:00Z')))
 await executarSync(usuario,n.transporte);expect((await tabela('fichas').get('ficha-a'))?.nome).toBe('Remoto')
 await tabela('fichas').update('ficha-a',{apagado_em:'2026-10-17T00:00:00Z',atualizado_em:'2026-10-17T00:00:00Z'})
 await executarSync(usuario,n.transporte);expect(n.tabelas.fichas.get('ficha-a')?.apagado_em).toBeTruthy()
 const transporte:Transporte={...n.transporte,async enviar(nome,r){await n.transporte.enviar(nome,r);if(nome==='fichas')await tabela('fichas').update('ficha-a',{nome:'Durante sync',atualizado_em:'2026-10-20T00:00:00Z'})}}
 await tabela('fichas').update('ficha-a',{nome:'Antes sync',atualizado_em:'2026-10-19T00:00:00Z'})
 await executarSync(usuario,transporte);expect((await tabela('fichas').get('ficha-a'))?.nome).toBe('Durante sync');expect(await contarPendencias(usuario)).toBe(1)
})
test('bloqueie outra conta e dados importados de usuário diferente',async()=>{
 await vincular(usuario);await expect(vincular('outro')).rejects.toThrow('outra conta')
 await tabela('fichas').add({...ficha(),user_id:'outra-pessoa'})
 await expect(prepararFila(usuario)).rejects.toThrow('outra conta')
})
test('baixe conta em aparelho novo sem duplicar biblioteca e sem sobrescrever as metas remotas',async()=>{
 await iniciarBiblioteca();const n=nuvem();await vincular(usuario);await executarSync(usuario,n.transporte)
 const ids=[...n.tabelas.exercicios.keys()]
 await banco.delete();await banco.open();;await iniciarBanco();await iniciarBiblioteca()
 expect(await aparelhoSemRegistros()).toBe(true)
 await prepararPrimeiroLogin(usuario,n.transporte);await vincular(usuario);await executarSync(usuario,n.transporte)
 expect(await tabela('exercicios').count()).toBe(64)
 expect((await tabela('exercicios').toArray()).map(r=>r.id).sort()).toEqual(ids.sort())
 expect(n.tabelas.exercicios.size).toBe(64)
})
test('não substitua dados existentes durante primeira conexão',async()=>{
 await iniciarBiblioteca();await tabela('fichas').add(ficha());const n=nuvem()
 await prepararPrimeiroLogin(usuario,n.transporte)
 expect((await tabela('fichas').get('ficha-a'))?.nome).toBe('Ficha A');expect(await aparelhoSemRegistros()).toBe(false)
})
test('baixe todas as páginas e preserve data do último sync quando houver erro',async()=>{
 const n=nuvem();await vincular(usuario)
 for(let i=0;i<405;i++){const r=remoto({...ficha(),id:`ficha-${String(i).padStart(4,'0')}`});n.tabelas.fichas.set(r.id,r)}
 await executarSync(usuario,n.transporte);expect(await tabela('fichas').count()).toBe(405)
 const c=await tabela('configuracoes').where('chave').equals('principal').first()
 await expect(executarSync(usuario,{...n.transporte,async baixar(){throw new Error('Falhou')}})).rejects.toThrow('Falhou')
 expect((await tabela('configuracoes').get(c!.id))?.ultima_sincronizacao).toBe(c?.ultima_sincronizacao)
})
