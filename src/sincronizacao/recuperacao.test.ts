import 'fake-indexeddb/auto'
import Dexie from 'dexie'
import { PGlite } from '@electric-sql/pglite'
import sql from '../../supabase/migrations/202610140001_conta_sincronizacao.sql?raw'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { banco, tabela, abrirIdentidade } from '../dados/banco'
import { exportarBackup, importarBackup } from '../dados/backup'
import { iniciarBanco } from '../dados/configuracoes'
import { iniciarBiblioteca } from '../dados/biblioteca'
import { criarRegistro } from '../dados/repositorio'
import { salvarAtividade } from '../dados/atividade'
import { ColisaoData, contarPendencias, executarSync, listarConflitos, nomesSync, prepararFila, prepararPrimeiroLogin, resolverConflito, retomarRestauracao, vincular, type NomeSync, type Remoto, type Transporte } from './motor'
import { comExclusaoSync, controle, filaBanco, pausaRestauracao, pendencias, recibos } from './armazenamento'

const usuario='11111111-1111-4111-8111-111111111111'
function nuvem(){
  const tabelas=Object.fromEntries(nomesSync.map(n=>[n,new Map<string,Remoto>()])) as Record<NomeSync,Map<string,Remoto>>
  const transporte:Transporte={
    async enviar(nome,linhas){
      const copia=new Map(tabelas[nome])
      for(const r of linhas){
        const anterior=copia.get(r.id)
        if(anterior&&Date.parse(anterior.atualizado_em)>=Date.parse(r.atualizado_em))continue
        if(['atividade_diaria','medidas_corporais','agua_dia','consumo_diario_meta'].includes(nome)&&!r.apagado_em&&[...copia.values()].some(a=>a.id!==r.id&&!a.apagado_em&&a.dados.data===r.dados.data))throw new ColisaoData('23505')
        copia.set(r.id,structuredClone(r))
      }
      tabelas[nome]=copia
    },
    async baixar(nome,depois){return [...tabelas[nome].values()].filter(r=>r.id>depois).sort((a,b)=>a.id<b.id?-1:1).slice(0,200).map(r=>structuredClone(r))},
  }
  return {tabelas,transporte}
}
beforeEach(async()=>{await abrirIdentidade(null);await banco.delete();await banco.open();await iniciarBanco()})
afterEach(()=>{vi.restoreAllMocks();vi.unstubAllGlobals()})

async function doisAparelhos(){
  const n=nuvem()
  await salvarAtividade('2026-01-01',100,20);await vincular(usuario);await executarSync(usuario,n.transporte)
  await banco.delete();await banco.open();;await iniciarBanco()
  await salvarAtividade('2026-01-01',200,30);await vincular(usuario)
  return n
}

test('mantenha pausa após reabrir, preserve vínculo e exija a conta correta para retomar',async()=>{
  const b=await exportarBackup(false),n=nuvem()
  await vincular(usuario);await importarBackup(b,'substituir')
  filaBanco.close();await filaBanco.open();banco.close();await banco.open()
  expect((await controle.get('usuario'))?.valor).toBe(usuario)
  expect(await pausaRestauracao()).toBe(b.criado_em)
  const enviar=vi.spyOn(n.transporte,'enviar'),baixar=vi.spyOn(n.transporte,'baixar')
  await expect(executarSync(usuario,n.transporte)).rejects.toThrow('pausada')
  expect(enviar).not.toHaveBeenCalled();expect(baixar).not.toHaveBeenCalled()
  await expect(retomarRestauracao('outra-conta')).rejects.toThrow('vinculada')
  expect(await pausaRestauracao()).toBeTruthy()
  await retomarRestauracao(usuario);await executarSync(usuario,n.transporte)
  expect(await pausaRestauracao()).toBeUndefined()
})

test('restauração explícita ignora proprietário do arquivo e mantém pausa se vinculado',async()=>{
  const b=await exportarBackup(false)
  await importarBackup(b,'substituir');expect(await pausaRestauracao()).toBeUndefined()
  await vincular(usuario)
  b.tabelas.fichas.push({...criarRegistro('outra-conta'),nome:'Outro dono',ordem:1})
  await importarBackup(b,'substituir')
  expect(await pausaRestauracao()).toBe(b.criado_em)
  expect((await tabela('fichas').toArray())[0].user_id).toBeNull()
})

test('se a escrita da restauração falhar, faça rollback local e mantenha a pausa durável',async()=>{
  const b=await exportarBackup(false)
  await tabela('fichas').add({...criarRegistro(),id:'preservada',nome:'Preservar',ordem:1});await vincular(usuario)
  vi.spyOn(banco.table('fichas'),'bulkPut').mockRejectedValueOnce(new Error('Sem espaço'))
  await expect(importarBackup(b,'substituir')).rejects.toThrow('Sem espaço')
  expect((await tabela('fichas').get('preservada'))?.nome).toBe('Preservar')
  expect(await pausaRestauracao()).toBeTruthy()
})

test('a importação espera o envio em curso e impede qualquer envio posterior até retomar',async()=>{
  const n=nuvem(),b=await exportarBackup(false)
  await tabela('fichas').add({...criarRegistro(),id:'antes',nome:'Antes',ordem:1});await vincular(usuario)
  let liberar!:()=>void,entrou!:()=>void
  const barreira=new Promise<void>(r=>{liberar=r}),iniciou=new Promise<void>(r=>{entrou=r})
  const sync=executarSync(usuario,{...n.transporte,async enviar(nome,linhas){entrou();await barreira;await n.transporte.enviar(nome,linhas)}})
  await iniciou
  const restaurar=importarBackup(b,'substituir')
  expect(await tabela('fichas').get('antes')).toBeDefined()
  liberar();await sync;await restaurar
  expect(await tabela('fichas').get('antes')).toBeUndefined()
  await expect(executarSync(usuario,n.transporte)).rejects.toThrow('pausada')
})

test('remova pendência obsoleta ao reconstruir fila mesmo fora de uma restauração',async()=>{
  const n=nuvem(),r={...criarRegistro(),nome:'Removida fisicamente',ordem:1}
  await tabela('fichas').add(r);await vincular(usuario);await prepararFila(usuario)
  await tabela('fichas').delete(r.id);await executarSync(usuario,n.transporte)
  expect(n.tabelas.fichas.has(r.id)).toBe(false);expect(await contarPendencias(usuario)).toBe(0)
})

test('sincronize correção de data pelo mesmo ID sem deixar atividade ativa na data antiga',async()=>{
  const n=nuvem();await salvarAtividade('2026-01-02',1000,123);await vincular(usuario);await executarSync(usuario,n.transporte)
  const original=(await tabela('atividade_diaria').toArray())[0]
  await salvarAtividade('2026-01-03',1000,123,{...original,moverData:true});await executarSync(usuario,n.transporte)
  expect(n.tabelas.atividade_diaria.size).toBe(1)
  expect(n.tabelas.atividade_diaria.get(original.id)?.dados).toMatchObject({data:'2026-01-03',passos:1000,calorias_gastas:123})
  await banco.delete();await banco.open();;await iniciarBanco();await vincular(usuario);await executarSync(usuario,n.transporte)
  const recebidos=await tabela('atividade_diaria').toArray()
  expect(recebidos).toHaveLength(1);expect(recebidos[0]).toMatchObject({id:original.id,data:'2026-01-03',passos:1000,calorias_gastas:123})
})

test.each(['local','remoto'] as const)('resolva com escolha %s, preserve o conteúdo recusado e envie outras tabelas durante conflito',async escolha=>{
  await abrirIdentidade(usuario);await banco.delete();await banco.open();await iniciarBanco()
  const n=await doisAparelhos()
  const config=(await tabela('configuracoes').toArray())[0]
  await tabela('configuracoes').update(config.id,{meta_passos_util:5432,atualizado_em:new Date(Date.now()+2000).toISOString()})
  await expect(executarSync(usuario,n.transporte)).rejects.toThrow('revisar')
  expect(n.tabelas.configuracoes.get('principal')?.dados.meta_passos_util).toBe(5432)
  expect((await tabela('configuracoes').get(config.id))?.ultima_sincronizacao).toBeUndefined()
  const [c]=await listarConflitos(usuario)
  await resolverConflito(usuario,c.chave,escolha,n.transporte,c)
  await executarSync(usuario,n.transporte)
  const registros=await tabela('atividade_diaria').toArray(),ativos=registros.filter(r=>!r.apagado_em),removidos=registros.filter(r=>r.apagado_em)
  expect(ativos).toHaveLength(1);expect(ativos[0].id).toBe(c.remoto.id)
  expect(ativos[0].passos).toBe(escolha==='local'?200:100)
  expect(removidos).toHaveLength(1);expect(removidos[0].passos).toBe(escolha==='local'?100:200)
  expect((await exportarBackup(false,true)).tabelas.atividade_diaria).toHaveLength(2)
  expect([...n.tabelas.atividade_diaria.values()].filter(r=>!r.apagado_em)).toHaveLength(1)
  expect(await listarConflitos(usuario)).toHaveLength(0);expect(await contarPendencias(usuario)).toBe(0)
})

test.each(['local','remoto'] as const)('recuse escolha se o lado %s mudar depois da comparação',async lado=>{
  const n=await doisAparelhos();await expect(executarSync(usuario,n.transporte)).rejects.toThrow('revisar')
  const [c]=await listarConflitos(usuario)
  if(lado==='local')await tabela('atividade_diaria').update(c.local.id,{passos:999,atualizado_em:new Date(Date.parse(c.local.atualizado_em)+1000).toISOString()})
  else {const r=n.tabelas.atividade_diaria.get(c.remoto.id)!;r.dados.passos=888;r.atualizado_em=new Date(Date.parse(r.atualizado_em)+1000).toISOString();r.dados.atualizado_em=r.atualizado_em}
  await expect(resolverConflito(usuario,c.chave,'local',n.transporte,c)).rejects.toThrow('mudou')
  expect(await tabela('atividade_diaria').filter(r=>!r.apagado_em).count()).toBe(1)
  expect(await listarConflitos(usuario)).toHaveLength(1)
})

test('recuse snapshot antigo da revisão e conta diferente sem modificar dados',async()=>{
  const n=await doisAparelhos();await expect(executarSync(usuario,n.transporte)).rejects.toThrow('revisar')
  const [c]=await listarConflitos(usuario),antigo=structuredClone(c);antigo.local.dados.passos=0
  await expect(resolverConflito(usuario,c.chave,'local',n.transporte,antigo)).rejects.toThrow('revisão mudou')
  await expect(resolverConflito('outro',c.chave,'local',n.transporte,c)).rejects.toThrow('vinculada')
  expect(await tabela('atividade_diaria').count()).toBe(1)
})

test('converta colisão surgida depois da conferência inicial em revisão sem travar outras tabelas',async()=>{
  const n=nuvem();await salvarAtividade('2026-01-01',200,30);await vincular(usuario)
  let inserir=true
  const transporte:Transporte={...n.transporte,async enviar(nome,linhas){
    if(nome==='atividade_diaria'&&inserir){inserir=false;const r=structuredClone(linhas[0]);r.id='concorrente';r.dados.id=r.id;r.dados.passos=100;n.tabelas[nome].set(r.id,r);throw new ColisaoData('23505')}
    await n.transporte.enviar(nome,linhas)
  }}
  await expect(executarSync(usuario,transporte)).rejects.toThrow('revisar')
  expect(await listarConflitos(usuario)).toHaveLength(1);expect(n.tabelas.configuracoes.has('principal')).toBe(true)
})

test('retome envio interrompido depois da escolha sem ressuscitar o registro recusado',async()=>{
  const n=await doisAparelhos();await expect(executarSync(usuario,n.transporte)).rejects.toThrow('revisar')
  const [c]=await listarConflitos(usuario);await resolverConflito(usuario,c.chave,'local',n.transporte,c)
  await expect(executarSync(usuario,{...n.transporte,async enviar(nome,linhas){if(nome==='atividade_diaria'&&linhas.some(r=>!r.apagado_em))throw new Error('Conexão interrompida');await n.transporte.enviar(nome,linhas)}})).rejects.toThrow('interrompida')
  filaBanco.close();await filaBanco.open();await executarSync(usuario,n.transporte)
  expect([...n.tabelas.atividade_diaria.values()].filter(r=>!r.apagado_em)).toHaveLength(1)
  expect((await tabela('atividade_diaria').filter(r=>!r.apagado_em).first())?.passos).toBe(200)
  expect(await contarPendencias(usuario)).toBe(0)
})

test('fila legada permanece separada e não atribui vínculo ou pendências ao novo banco',async()=>{
  await filaBanco.delete()
  const antigo=new Dexie('vida-em-dia-sincronizacao')
  antigo.version(1).stores({pendencias:'chave, usuario, tabela',recibos:'chave',controle:'chave'})
  await antigo.table('controle').put({chave:'usuario',valor:usuario})
  await antigo.table('recibos').put({chave:'r',assinatura:'assinatura'})
  await antigo.table('pendencias').put({chave:'p',usuario,tabela:'fichas'})
  antigo.close();await filaBanco.open()
  expect(await controle.get('usuario')).toBeUndefined()
  expect(await recibos.get('r')).toBeUndefined()
  expect(await pendencias.get('p')).toBeUndefined();expect(await listarConflitos(usuario)).toEqual([])
  const leitura = new Dexie('vida-em-dia-sincronizacao', { autoOpen:false }); await leitura.open()
  expect((await leitura.table('controle').get('usuario'))?.valor).toBe(usuario)
  leitura.close()
})

test('em navegador sem Web Locks, preserve dados e recuse a operação protegida',async()=>{
  vi.stubGlobal('window',{});vi.stubGlobal('navigator',{})
  const acao=vi.fn(async()=>undefined)
  await expect(comExclusaoSync(acao)).rejects.toThrow('Atualize-o')
  expect(acao).not.toHaveBeenCalled()
})

test('não substitua a base inicial se o vínculo mudar durante o download da primeira conexão',async()=>{
  const n=nuvem();await iniciarBiblioteca();await vincular(usuario);await executarSync(usuario,n.transporte)
  await banco.delete();await banco.open();;await iniciarBanco();await iniciarBiblioteca()
  const ids=(await tabela('exercicios').toArray()).map(r=>r.id).sort()
  let liberar!:()=>void,entrou!:()=>void
  const barreira=new Promise<void>(r=>{liberar=r}),baixando=new Promise<void>(r=>{entrou=r})
  const preparar=prepararPrimeiroLogin(usuario,{...n.transporte,async baixar(nome,depois){entrou();await barreira;return n.transporte.baixar(nome,depois)}})
  await baixando;await vincular(usuario);liberar()
  await expect(preparar).rejects.toThrow('vínculo local mudou')
  expect((await tabela('exercicios').toArray()).map(r=>r.id).sort()).toEqual(ids)
  expect(await pausaRestauracao()).toBeUndefined()
})

test('transfira fotos da medida escolhida e preserve os valores recusados no tombstone',async()=>{
  const n=nuvem(),medida={...criarRegistro(),data:'2026-01-01',peso:70}
  await tabela('medidas_corporais').add(medida);await vincular(usuario);await executarSync(usuario,n.transporte)
  await banco.delete();await banco.open();;await iniciarBanco()
  const local={...criarRegistro(),data:'2026-01-01',peso:80}
  await tabela('medidas_corporais').add(local)
  const foto={...criarRegistro(),tipo:'progresso' as const,data:local.data,angulo:'frente' as const,medida_id:local.id,tamanho_bytes:3,imagem_local:new Blob(['abc'],{type:'image/jpeg'})}
  await tabela('fotos').add(foto);await vincular(usuario)
  await expect(executarSync(usuario,n.transporte)).rejects.toThrow('revisar')
  const [c]=await listarConflitos(usuario);await resolverConflito(usuario,c.chave,'local',n.transporte,c);await executarSync(usuario,n.transporte)
  expect((await tabela('medidas_corporais').get(medida.id))?.peso).toBe(80)
  expect((await tabela('medidas_corporais').get(local.id))?.peso).toBe(70)
  expect((await tabela('fotos').get(foto.id))?.medida_id).toBe(medida.id)
  expect(await (await tabela('fotos').get(foto.id))?.imagem_local?.text()).toBe('abc')
})

test.each(['local','remoto'] as const)('RPC SQL real: resolva pela escolha %s e mantenha uma única atividade ativa',async escolha=>{
  const pg=new PGlite()
  try{
    await pg.exec(`create role anon;create role authenticated;create schema auth;create schema storage;
      create table auth.users(id uuid primary key);insert into auth.users values('${usuario}');
      create function auth.uid() returns uuid language sql stable as $$select '${usuario}'::uuid$$;
      grant usage on schema public,auth,storage to authenticated;
      create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
      create table storage.objects(id text,bucket_id text,name text);
      create function storage.foldername(text) returns text[] language sql immutable as $$select string_to_array($1,'/')$$;`)
    await pg.exec(sql);await pg.exec('set role authenticated')
    const transporte:Transporte={
      async enviar(nome,linhas){await pg.query('select public.vida_em_dia_enviar($1,$2::jsonb)',[nome,JSON.stringify(linhas)])},
      async baixar(nome,depois){const r=await pg.query<Remoto>(`select id,user_id,criado_em::text,atualizado_em::text,apagado_em::text,dados from public.${nome} where id>$1 order by id limit 200`,[depois]);return r.rows},
    }
    await salvarAtividade('2026-01-01',100,20);await vincular(usuario);await executarSync(usuario,transporte)
    await banco.delete();await banco.open();;await iniciarBanco()
    await salvarAtividade('2026-01-01',200,30);await vincular(usuario)
    await expect(executarSync(usuario,transporte)).rejects.toThrow('revisar')
    const [c]=await listarConflitos(usuario)
    await resolverConflito(usuario,c.chave,escolha,transporte,c);await executarSync(usuario,transporte)
    const ativos=await pg.query<{dados:{passos:number}}>('select dados from public.atividade_diaria where apagado_em is null')
    expect(ativos.rows).toHaveLength(1);expect(ativos.rows[0].dados.passos).toBe(escolha==='local'?200:100)
    const removidos=await pg.query<{dados:{passos:number}}>('select dados from public.atividade_diaria where apagado_em is not null')
    expect(removidos.rows).toHaveLength(1);expect(removidos.rows[0].dados.passos).toBe(escolha==='local'?100:200)
    expect(await contarPendencias(usuario)).toBe(0)
  }finally{await pg.close()}
},30000)
