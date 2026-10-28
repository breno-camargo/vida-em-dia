import 'fake-indexeddb/auto'
import {beforeEach,expect,test}from 'vitest'
import {banco,tabela}from '../dados/banco'
import {iniciarBanco}from '../dados/configuracoes'
import {iniciarBiblioteca}from '../dados/biblioteca'
import {criarRegistro}from '../dados/repositorio'
import {configurarAgua}from '../dados/agua'
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

test('água atravessa dois aparelhos e alterações independentes convergem',async()=>{
 const n=nuvem()
 await configurarAgua('garrafa_ml',800);await configurarAgua('meta_agua_ml',4000)
 await vincular(usuario);await executarSync(usuario,n.transporte)
 const aparelhoA=(await tabela('configuracoes').toArray())[0]
 // Aparelho B: armazenamento novo, com sua própria configuração padrão.
 await banco.delete();await banco.open();await iniciarBanco();await vincular(usuario)
 await executarSync(usuario,n.transporte)
 let b=(await tabela('configuracoes').toArray())[0]
 expect(b).toMatchObject({garrafa_ml:800,meta_agua_ml:4000})
 // B altera só a garrafa; A altera só a meta antes de receber B.
 await configurarAgua('garrafa_ml',1000);await executarSync(usuario,n.transporte)
 b=(await tabela('configuracoes').toArray())[0]
 await banco.delete();await banco.open();await iniciarBanco()
 await tabela('configuracoes').clear();await tabela('configuracoes').put(aparelhoA)
 await vincular(usuario);await configurarAgua('meta_agua_ml',3500);await executarSync(usuario,n.transporte)
 expect((await tabela('configuracoes').toArray())[0]).toMatchObject({garrafa_ml:1000,meta_agua_ml:3500})
 // B recebe a meta de A sem perder a garrafa que escolheu.
 await banco.delete();await banco.open();await iniciarBanco()
 await tabela('configuracoes').clear();await tabela('configuracoes').put(b)
 await vincular(usuario);await executarSync(usuario,n.transporte)
 expect((await tabela('configuracoes').toArray())[0]).toMatchObject({garrafa_ml:1000,meta_agua_ml:3500})
 expect(n.tabelas.configuracoes.get('principal')?.dados).toMatchObject({garrafa_ml:1000,meta_agua_ml:3500})
})

test('preserva água antiga contra padrão novo e respeita edição explícita independente',async()=>{
 const n=nuvem();await vincular(usuario)
 const local=(await tabela('configuracoes').toArray())[0]
 const dados={...local,id:'principal',user_id:usuario,atualizado_em:'2026-10-01T12:00:00Z',garrafa_ml:800,meta_agua_ml:4000}
 n.tabelas.configuracoes.set('principal',{id:'principal',user_id:usuario,criado_em:dados.criado_em,atualizado_em:dados.atualizado_em,apagado_em:null,dados})
 await executarSync(usuario,n.transporte)
 expect(await tabela('configuracoes').get(local.id)).toMatchObject({garrafa_ml:800,meta_agua_ml:4000})
 const atual=(await tabela('configuracoes').get(local.id))!
 const agora=new Date(Date.now()+1000).toISOString()
 // Escolher 2000 explicitamente não é o mesmo que receber o padrão vazio de outro aparelho.
 await tabela('configuracoes').put({...atual,meta_agua_ml:2000,meta_agua_atualizada_em:agora,atualizado_em:agora})
 await executarSync(usuario,n.transporte)
 expect(n.tabelas.configuracoes.get('principal')?.dados).toMatchObject({garrafa_ml:800,meta_agua_ml:2000})
 // Uma edição posterior de tema no outro aparelho não desfaz a meta escolhida.
 const remoto=n.tabelas.configuracoes.get('principal')!
 n.tabelas.configuracoes.set('principal',{...remoto,atualizado_em:new Date(Date.now()+2000).toISOString(),dados:{...remoto.dados,meta_agua_ml:4000,meta_agua_atualizada_em:'2026-10-01T12:00:00Z',atualizado_em:new Date(Date.now()+2000).toISOString()}})
 await executarSync(usuario,n.transporte)
 expect(await tabela('configuracoes').get(local.id)).toMatchObject({garrafa_ml:800,meta_agua_ml:2000})
})

test('configuração nova de outro aparelho não apague o perfil energético já preenchido',async()=>{
 const n=nuvem();await vincular(usuario)
 const local=(await tabela('configuracoes').toArray())[0]
 const dados={...local,id:'principal',user_id:usuario,atualizado_em:'2026-10-01T12:00:00Z',data_nascimento:'1996-01-01',sexo_calculo_energia:'masculino',altura_cm:175,nivel_atividade_energia:'moderada'}
 n.tabelas.configuracoes.set('principal',{id:'principal',user_id:usuario,criado_em:dados.criado_em,atualizado_em:dados.atualizado_em,apagado_em:null,dados})
 await executarSync(usuario,n.transporte)
 const atual=await tabela('configuracoes').get(local.id)
 expect(atual?.data_nascimento).toBe('1996-01-01')
 expect(atual?.sexo_calculo_energia).toBe('masculino')
 expect(atual?.altura_cm).toBe(175)
 expect(atual?.nivel_atividade_energia).toBe('moderada')
 expect(n.tabelas.configuracoes.get('principal')?.dados.data_nascimento).toBe('1996-01-01')
 // Outra configuração mais recente e incompleta também não apaga o perfil local.
 const incompleta={...n.tabelas.configuracoes.get('principal')!}
 incompleta.dados={...incompleta.dados};delete incompleta.dados.data_nascimento;delete incompleta.dados.altura_cm
 incompleta.atualizado_em=new Date(Date.now()+1000).toISOString();incompleta.dados.atualizado_em=incompleta.atualizado_em
 n.tabelas.configuracoes.set('principal',incompleta)
 await executarSync(usuario,n.transporte)
 expect((await tabela('configuracoes').get(local.id))?.data_nascimento).toBe('1996-01-01')
 // Escolher explicitamente apenas repouso continua removendo a rotina.
 const config=await tabela('configuracoes').get(local.id)
 await tabela('configuracoes').put({...config!,nivel_atividade_energia:undefined,nivel_atividade_energia_definido:true,atualizado_em:new Date(Date.now()+3000).toISOString()})
 await executarSync(usuario,n.transporte)
 expect(n.tabelas.configuracoes.get('principal')?.dados.nivel_atividade_energia).toBeUndefined()
})

test('reutilize a leitura sem envio e consulte novamente a tabela enviada',async()=>{
 const n=nuvem();await vincular(usuario);await executarSync(usuario,n.transporte)
 const leituras:NomeSync[]=[]
 const transporte:Transporte={...n.transporte,async baixar(nome,depois){leituras.push(nome);return n.transporte.baixar(nome,depois)}}
 await executarSync(usuario,transporte)
 expect(leituras).toEqual([...nomesSync])
 leituras.length=0
 await tabela('fichas').add(ficha())
 await executarSync(usuario,transporte)
 expect(leituras.filter(n=>n==='fichas')).toHaveLength(2)
 for(const nome of nomesSync.filter(n=>n!=='fichas'))expect(leituras.filter(n=>n===nome)).toHaveLength(1)
 expect(n.tabelas.fichas.get('ficha-a')?.dados.nome).toBe('Ficha A')
 expect(await contarPendencias(usuario)).toBe(0)
})
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

// Volume local sintetico: verifica lotes e recuperacao; nao mede capacidade do Supabase.
test('historico com 1000 refeicoes retoma lote interrompido e baixa paginas sem duplicar',async()=>{
 const n=nuvem()
 const linhas=Array.from({length:1000},(_,i)=>({...criarRegistro(),id:'refeicao-volume-'+String(i).padStart(5,'0'),data:'2026-10-26',refeicao:'Lanche',horario:'12:00',descricao:'Alimento sintetico',precisao:'exato' as const,kcal:125,proteina_g:3.9,carbo_g:24,gordura_g:1.5,fibra_g:1.3,sodio_mg:217,quantidade_g:50}))
 await tabela('refeicoes_dia').bulkAdd(linhas)
 await vincular(usuario)
 let envios=0
 const lotes:number[]=[]
 const falha:Transporte={...n.transporte,async enviar(nome,registros){if(nome==='refeicoes_dia'){lotes.push(registros.length);if(++envios===2)throw new Error('Interrupcao sintetica')}await n.transporte.enviar(nome,registros)}}
 await expect(executarSync(usuario,falha)).rejects.toThrow('Interrupcao sintetica')
 expect(await contarPendencias(usuario)).toBeGreaterThan(0)
 await executarSync(usuario,{...n.transporte,async enviar(nome,registros){if(nome==='refeicoes_dia')lotes.push(registros.length);await n.transporte.enviar(nome,registros)}})
 expect(Math.max(...lotes)).toBeLessThanOrEqual(100)
 expect(n.tabelas.refeicoes_dia.size).toBe(1000)
 expect(await contarPendencias(usuario)).toBe(0)
 await tabela('refeicoes_dia').clear()
 await executarSync(usuario,n.transporte)
 expect(await tabela('refeicoes_dia').count()).toBe(1000)
 const salvo=await tabela('refeicoes_dia').get(linhas[999].id)
 expect(salvo?.sodio_mg).toBe(217)
 expect(salvo?.quantidade_g).toBe(50)
 const antes=n.chamadas.length
 await executarSync(usuario,n.transporte)
 expect(n.chamadas.length).toBe(antes)
 expect(await tabela('refeicoes_dia').count()).toBe(1000)
},90000)
