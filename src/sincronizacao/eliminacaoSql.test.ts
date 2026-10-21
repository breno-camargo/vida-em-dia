import { PGlite } from '@electric-sql/pglite'
import { afterAll, beforeAll, expect, test } from 'vitest'
import base from '../../supabase/migrations/202610140001_conta_sincronizacao.sql?raw'
import sql from '../../supabase/migrations/202610210001_eliminacao.sql?raw'
import { RETENCAO_REMOVIDOS_DIAS } from '../dados/retencao'
const pg=new PGlite(),a='11111111-1111-4111-8111-111111111111',b='22222222-2222-4222-8222-222222222222'
beforeAll(async()=>{
 await pg.exec(`create role anon;create role authenticated;create role service_role bypassrls;create schema auth;create schema storage;
 create table auth.users(id uuid primary key);insert into auth.users values('${a}'),('${b}');
 create function auth.uid() returns uuid language sql stable as $$select (nullif(current_setting('request.jwt.claims',true),'')::jsonb->>'sub')::uuid$$;
 grant usage on schema public,auth,storage to anon,authenticated,service_role;grant execute on function auth.uid() to anon,authenticated,service_role;
 create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
 create table storage.objects(id text,bucket_id text,name text);create function storage.foldername(text) returns text[] language sql immutable as $$select string_to_array($1,'/')$$;`)
 await pg.exec(base);await pg.exec(sql)
 await pg.exec('grant all on all tables in schema public to service_role')
},30000)
afterAll(()=>pg.close())
async function entrar(id:string,role='authenticated'){await pg.exec(`reset role;set role ${role};select set_config('request.jwt.claims','{"sub":"${id}"}',false)`)}
async function enviar(id:string,dono=a){const agora=new Date().toISOString();await pg.query('select public.vida_em_dia_enviar($1,$2::jsonb)',['fichas',JSON.stringify([{id,user_id:dono,criado_em:agora,atualizado_em:agora,apagado_em:null,dados:{id,user_id:dono,nome:'Privado'}}])])}
test('RPC invoker, RLS, tombstone mínimo e trigger rejeitam update/upsert de qualquer idade',async()=>{
 await entrar(a);await enviar('eliminar')
 await entrar(b);await pg.query('select public.vida_em_dia_eliminar($1,$2)',['fichas','eliminar'])
 // B só cria marcador próprio, nunca altera o de A.
 expect((await pg.query<{dados:{nome?:string}}>('select dados from fichas')).rows.every(r=>!r.dados.nome)).toBe(true)
 await entrar(a);expect((await pg.query<{dados:{nome:string}}>('select dados from fichas')).rows[0].dados.nome).toBe('Privado')
 await pg.query('select public.vida_em_dia_eliminar($1,$2)',['fichas','eliminar'])
 const r=(await pg.query<{dados:Record<string,unknown>;eliminado_em:unknown}>('select dados,eliminado_em from fichas')).rows[0]
 expect(r.eliminado_em).toBeTruthy();expect(Object.keys(r.dados).sort()).toEqual(['id','user_id','apagado_em','eliminado_em'].sort())
 await expect(pg.exec(`update fichas set eliminado_em=null`)).rejects.toThrow('eliminado')
 await expect(pg.exec(`update fichas set dados=dados`)).rejects.toThrow('eliminado')
 await expect(enviar('eliminar')).rejects.toThrow('eliminado')
 await expect(pg.exec(`delete from fichas`)).rejects.toThrow()
 await pg.query('select public.vida_em_dia_eliminar($1,$2)',['fichas','eliminar'])
 expect((await pg.query<{prosecdef:boolean}>(`select prosecdef from pg_proc where proname='vida_em_dia_eliminar'`)).rows[0].prosecdef).toBe(false)
})
test('prazo SQL/cliente iguais, purga conteúdo e enfileira objeto sem tocar storage.objects',async()=>{
 await entrar(a);await enviar('purga')
 await pg.exec(`update fichas set apagado_em=clock_timestamp()-interval '31 days' where id='purga'`)
 await pg.exec('reset role')
 expect((await pg.query<{dias:number}>('select public.vida_em_dia_retencao_dias() as dias')).rows[0].dias).toBe(RETENCAO_REMOVIDOS_DIAS)
 await pg.query(`insert into fotos(id,user_id,criado_em,atualizado_em,apagado_em,dados) values('foto',$1::uuid,now(),now(),now()-interval '31 days',jsonb_build_object('id','foto','user_id',$1::text,'caminho_storage',$2::text))`,[a,a+'/foto.jpg'])
 await pg.exec('set role service_role;select public.vida_em_dia_purgar()')
 expect((await pg.query<{dados:Record<string,unknown>}>(`select dados from fichas where id='purga'`)).rows[0].dados.nome).toBeUndefined()
 expect((await pg.query('select * from vida_em_dia_remocoes_storage')).rows).toHaveLength(1)
 expect(sql).not.toMatch(/delete\s+from\s+storage\.objects/i)
})
test('tentativas atômicas, controles com RLS sem políticas, JWT antigo bloqueado por FK',async()=>{
 await pg.exec('reset role;set role service_role')
 for(let i=1;i<=6;i++)expect((await pg.query<{ok:boolean}>('select public.vida_em_dia_tentar_exclusao($1) as ok',[a])).rows[0].ok).toBe(i<=5)
 await entrar(a)
 expect((await pg.query('select * from vida_em_dia_tentativas_exclusao').catch(()=>({rows:[]}))).rows).toHaveLength(0)
 await pg.exec('reset role')
 expect((await pg.query(`select * from pg_policies where tablename in ('vida_em_dia_tentativas_exclusao','vida_em_dia_exclusao_conta')`)).rows).toHaveLength(0)
 await pg.query('delete from auth.users where id=$1',[b]);await entrar(b)
 await expect(enviar('jwt-antigo',b)).rejects.toThrow('foreign key')
})
