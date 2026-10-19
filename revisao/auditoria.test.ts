/// <reference types="vite/client" />
// C01/C02/C03/C07/C09: regressões após correções. Demais casos: reproduções de defeitos ainda abertos.
// fake-indexeddb mantém estes dados exclusivamente na memória do processo de teste.
import 'fake-indexeddb/auto'
import { beforeEach, expect, test } from 'vitest'
import { PGlite } from '@electric-sql/pglite'
import sql from '../supabase/migrations/202610140001_conta_sincronizacao.sql?raw'
import { banco, tabela } from '../src/dados/banco'
import { iniciarBanco } from '../src/dados/configuracoes'
import { iniciarBiblioteca } from '../src/dados/biblioteca'
import { criarRegistro } from '../src/dados/repositorio'
import { exportarBackup, importarBackup, validarBackup, lembreteBackup } from '../src/dados/backup'
import { salvarFicha } from '../src/dados/fichas'
import { planejamentoDoTreino } from '../src/dados/planejamentoTreino'
import { iniciarTreino, adicionarExercicio, concluirSerie, maiorCarga } from '../src/dados/treinos'
import { recordesDoTreino, removerTreino, restaurarTreino } from '../src/dados/historico'
import { sessoesExercicio } from '../src/utilitarios/evolucao'
import { salvarAtividade } from '../src/dados/atividade'
import { executarSync, filaBanco, nomesSync, vincular, listarConflitos, resolverConflito, retomarRestauracao, type NomeSync, type Remoto, type Transporte } from '../src/sincronizacao/motor'
import { pausaRestauracao } from '../src/sincronizacao/armazenamento'

const usuario = '11111111-1111-4111-8111-111111111111'
function nuvem() {
  const dados = Object.fromEntries(nomesSync.map(n => [n, new Map<string, Remoto>()])) as Record<NomeSync, Map<string, Remoto>>
  const transporte: Transporte = {
    async enviar(nome, linhas) {
      for (const r of linhas) {
        if (nome === 'atividade_diaria' && !r.apagado_em && [...dados[nome].values()].some(a => a.id !== r.id && !a.apagado_em && a.dados.data === r.dados.data)) throw new Error('23505: atividade_data_dono')
        const atual = dados[nome].get(r.id)
        if (!atual || Date.parse(r.atualizado_em) > Date.parse(atual.atualizado_em)) dados[nome].set(r.id, structuredClone(r))
      }
    },
    async baixar(nome, depois) { return [...dados[nome].values()].filter(r => r.id > depois).sort((a,b) => a.id.localeCompare(b.id)).slice(0,200) },
  }
  return { dados, transporte }
}
beforeEach(async () => {
  await banco.delete(); await banco.open(); await filaBanco.delete(); await filaBanco.open()
  await iniciarBanco(); await iniciarBiblioteca()
})

test('C01 regressão: restauração fica intacta até confirmar nova mesclagem com a nuvem', async () => {
  const n = nuvem()
  await tabela('fichas').add({ ...criarRegistro(), id:'A', nome:'A', ordem:1 })
  const backup = await exportarBackup(false)
  await tabela('fichas').add({ ...criarRegistro(), id:'B', nome:'B', ordem:2 })
  await vincular(usuario); await executarSync(usuario,n.transporte)
  await importarBackup(backup,'substituir')
  expect(await tabela('fichas').get('B')).toBeUndefined()
  await expect(executarSync(usuario,n.transporte)).rejects.toThrow('pausada')
  expect(await tabela('fichas').get('B')).toBeUndefined()
  expect(await pausaRestauracao()).toBeTruthy()
  await retomarRestauracao(usuario)
  await executarSync(usuario,n.transporte)
  expect((await tabela('fichas').get('B'))?.nome).toBe('B')
})

test('C02 regressão: pendência removida pela substituição não é enviada nem após retomada', async () => {
  const n = nuvem(), backup = await exportarBackup(false)
  await tabela('fichas').add({ ...criarRegistro(), id:'pendente', nome:'Fora do backup', ordem:1 })
  await vincular(usuario)
  await expect(executarSync(usuario,{ ...n.transporte, async enviar(){ throw new Error('offline') } })).rejects.toThrow('offline')
  await importarBackup(backup,'substituir')
  await expect(executarSync(usuario,n.transporte)).rejects.toThrow('pausada')
  await retomarRestauracao(usuario)
  await executarSync(usuario,n.transporte)
  expect(n.dados.fichas.has('pendente')).toBe(false)
  expect(await tabela('fichas').get('pendente')).toBeUndefined()
})

test('C03 regressão: colisão por data permite escolha e retomada sem duplicar o dia', async () => {
  const n = nuvem()
  await salvarAtividade('2026-01-01',100,20); await vincular(usuario); await executarSync(usuario,n.transporte)
  // Outro aparelho: IndexedDB separado simulado pela recriação apenas da base em memória.
  await banco.delete(); await banco.open(); await filaBanco.delete(); await filaBanco.open(); await iniciarBanco()
  await salvarAtividade('2026-01-01',200,30); await vincular(usuario)
  await expect(executarSync(usuario,n.transporte)).rejects.toThrow('revisar')
  expect(await tabela('atividade_diaria').count()).toBe(1)
  expect((await tabela('atividade_diaria').toArray())[0].passos).toBe(200)
  const [conflito]=await listarConflitos(usuario)
  expect(conflito.local.dados.passos).toBe(200)
  expect(conflito.remoto.dados.passos).toBe(100)
  await resolverConflito(usuario,conflito.chave,'local',n.transporte)
  await executarSync(usuario,n.transporte)
  expect(await listarConflitos(usuario)).toHaveLength(0)
  const ativos=(await tabela('atividade_diaria').toArray()).filter(r=>!r.apagado_em)
  expect(ativos).toHaveLength(1);expect(ativos[0].passos).toBe(200)
  expect([...n.dados.atividade_diaria.values()].filter(r=>!r.apagado_em)).toHaveLength(1)
})

test('C04 regressão: treino livre com cardio vira ficha sem criar séries de força', async () => {
  const ex = (await tabela('exercicios').toArray()).find(e => e.tipo === 'cardio')!
  expect(ex).toBeDefined()
  const id = await iniciarTreino(), treino = (await tabela('treinos').get(id))!
  await adicionarExercicio(treino,ex)
  const itens = await tabela('treino_exercicios').where('treino_id').equals(id).toArray()
  const series = await tabela('series_treino').where('treino_id').equals(id).toArray()
  const ficha = { ...criarRegistro(), nome:'Cardio livre', ordem:1 }
  await salvarFicha(ficha,planejamentoDoTreino(ficha,itens,series))
  expect(await tabela('fichas').get(ficha.id)).toBeDefined()
  await tabela('treinos').update(id,{fim:new Date().toISOString()})
  const novoId=await iniciarTreino(ficha.id)
  expect(await tabela('series_treino').where('treino_id').equals(novoId).count()).toBe(0)
})

test('C05 regressão: backup inválido é rejeitado antes de substituir dados', async () => {
  const backup = await exportarBackup(false)
  backup.tabelas.series_treino.push({ ...criarRegistro(), treino_id:'inexistente', exercicio_id:'inexistente', numero_serie:1, tipo:'normal', peso_digitado:-10, peso_total:-10, repeticoes:-5, recorde:false })
  const antes = await tabela('exercicios').count()
  expect(() => validarBackup(backup)).toThrow()
  await expect(importarBackup(backup,'substituir')).rejects.toThrow()
  expect(await tabela('exercicios').count()).toBe(antes)
  expect(await tabela('series_treino').count()).toBe(0)
})

test('C06 regressão: sincronização recente não suprime aviso de backup das fotos locais', () => {
  expect(lembreteBackup({ criado_em:'2026-01-01T00:00:00Z', dias_lembrete_backup:14, ultima_sincronizacao:'2026-10-15T00:00:00Z' },Date.parse('2026-10-16T00:00:00Z'))).toBe(true)
})

test('C07 regressão: apenas um vínculo concorrente é aceito sob o lock compartilhado', async () => {
  const outro = '22222222-2222-4222-8222-222222222222'
  const resultados = await Promise.allSettled([vincular(usuario),vincular(outro)])
  expect(resultados.map(r => r.status)).toEqual(['fulfilled','rejected'])
})

test('C08 GEM-06: segunda série da primeira sessão grava recorde sem conquista no histórico', async () => {
  const ex = (await tabela('exercicios').toArray()).find(e => e.tipo === 'forca' && e.modo_carga === 'total')!
  const id = await iniciarTreino()
  await adicionarExercicio((await tabela('treinos').get(id))!,ex)
  const series = await tabela('series_treino').where('treino_id').equals(id).sortBy('numero_serie')
  await concluirSerie({ ...series[0], peso_digitado:50, repeticoes:10 })
  await concluirSerie({ ...series[1], peso_digitado:60, repeticoes:10 })
  expect((await tabela('series_treino').get(series[0].id))?.recorde).toBe(false)
  expect((await tabela('series_treino').get(series[1].id))?.recorde).toBe(true)
  expect(await recordesDoTreino(id,ex.id)).toEqual([])
  await tabela('treinos').update(id,{fim:new Date().toISOString()})
  const sessoes = sessoesExercicio(await tabela('treinos').toArray(),await tabela('series_treino').toArray(),ex.id)
  expect(sessoes[0].recordes).toEqual([])
})

test('C09 regressão A07: exclusão preserva filhos para desfazer e consulta do painel ignora treino removido', async () => {
  const ex = (await tabela('exercicios').toArray()).find(e => e.tipo === 'forca' && e.modo_carga === 'total')!
  const alto = await iniciarTreino()
  await adicionarExercicio((await tabela('treinos').get(alto))!,ex)
  const serie = (await tabela('series_treino').where('treino_id').equals(alto).first())!
  await concluirSerie({ ...serie, peso_digitado:100, repeticoes:10 })
  await tabela('treinos').update(alto,{fim:new Date().toISOString()})
  const baixo = await iniciarTreino()
  await adicionarExercicio((await tabela('treinos').get(baixo))!,ex)
  const outra = (await tabela('series_treino').where('treino_id').equals(baixo).first())!
  await concluirSerie({ ...outra, peso_digitado:20, repeticoes:10 })
  await tabela('treinos').update(baixo,{fim:new Date().toISOString()})
  await removerTreino(alto)
  expect((await tabela('series_treino').get(serie.id))?.apagado_em).toBeNull()
  const series = await tabela('series_treino').toArray()
  const sessoes = sessoesExercicio(await tabela('treinos').toArray(),series,ex.id)
  expect(Math.max(...sessoes.map(s => s.carga))).toBe(20)
  // Consulta de maior carga (A07) ignora treino removido
  expect(await maiorCarga(ex.id)).toBe(20)
  const n = nuvem(); await vincular(usuario); await executarSync(usuario,n.transporte)
  expect(n.dados.treinos.get(alto)?.apagado_em).toBeTruthy()
  expect(n.dados.series_treino.get(serie.id)?.apagado_em).toBeNull()
  expect(n.dados.series_treino.get(serie.id)?.dados.treino_id).toBe(alto)
  await restaurarTreino(alto)
  expect(sessoesExercicio(await tabela('treinos').toArray(),await tabela('series_treino').toArray(),ex.id).some(s => s.treino.id === alto && s.carga === 100)).toBe(true)
  expect(await maiorCarga(ex.id)).toBe(100)
})

test('C03 SQL: RPC real rejeita IDs distintos na mesma data com 23505', async () => {
  const pg = new PGlite()
  try {
    await pg.exec(`create role anon; create role authenticated; create schema auth; create schema storage;
      create table auth.users(id uuid primary key); insert into auth.users values('${usuario}');
      create function auth.uid() returns uuid language sql stable as $$select '${usuario}'::uuid$$;
      create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
      create table storage.objects(id text,bucket_id text,name text);
      create function storage.foldername(text) returns text[] language sql immutable as $$select string_to_array($1,'/')$$;`)
    await pg.exec(sql)
    const remoto = (id:string) => { const dados = { ...criarRegistro(usuario), id, data:'2026-01-01', passos:100 }; return { ...dados, dados } }
    await pg.query('select public.vida_em_dia_enviar($1,$2::jsonb)',['atividade_diaria',JSON.stringify([remoto('aparelho-a')])])
    await expect(pg.query('select public.vida_em_dia_enviar($1,$2::jsonb)',['atividade_diaria',JSON.stringify([remoto('aparelho-b')])])).rejects.toMatchObject({code:'23505'})
    expect((await pg.query('select * from public.atividade_diaria')).rows).toHaveLength(1)
  } finally { await pg.close() }
},30000)
