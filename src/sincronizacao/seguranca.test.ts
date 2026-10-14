import { PGlite } from '@electric-sql/pglite'
import sql from '../../supabase/migrations/202610140001_conta_sincronizacao.sql?raw'
import { afterAll, beforeAll, expect, test } from 'vitest'
const pg=new PGlite()
const a='11111111-1111-4111-8111-111111111111',b='22222222-2222-4222-8222-222222222222'
const registro=(usuario=a,nome='Ficha A',atualizado='2026-10-14T12:00:00Z')=>({id:'ficha-a',user_id:usuario,criado_em:'2026-10-14T10:00:00Z',atualizado_em:atualizado,apagado_em:null,dados:{id:'ficha-a',user_id:usuario,nome}})
beforeAll(async()=>{
 await pg.exec(`create role anon; create role authenticated; create schema auth; create schema storage;
 create table auth.users(id uuid primary key);
 insert into auth.users values('${a}'),('${b}');
 create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
 grant usage on schema public,auth,storage to anon,authenticated;
 grant execute on function auth.uid() to anon,authenticated;
 create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
 create table storage.objects(id text,bucket_id text,name text);
 alter table storage.objects enable row level security;
 grant select,insert,update,delete on storage.objects to authenticated;
 create function storage.foldername(text) returns text[] language sql immutable as $$select string_to_array($1,'/')$$;`)
 await pg.exec(sql)
},30000)
afterAll(async()=>{await pg.close()})
async function entrar(usuario:string,role='authenticated'){await pg.exec(`reset role; set role ${role}; select set_config('request.jwt.claim.sub','${usuario}',false)`)}
async function enviar(r:unknown){await pg.query('select public.vida_em_dia_enviar($1,$2::jsonb)',['fichas',JSON.stringify([r])])}
test('SQL aplica RLS em todas as tabelas e mantém bucket privado',async()=>{
 await pg.exec('reset role')
 const tabelas=await pg.query<{relrowsecurity:boolean}>(`select relrowsecurity from pg_class c join pg_namespace n on c.relnamespace=n.oid where n.nspname='public' and c.relkind='r'`)
 expect(tabelas.rows).toHaveLength(17);expect(tabelas.rows.every(t=>t.relrowsecurity)).toBe(true)
 expect((await pg.query<{public:boolean}>(`select public from storage.buckets`)).rows[0].public).toBe(false)
})
test('RLS impede leitura e escrita cruzadas e acesso anônimo',async()=>{
 await entrar(a);await enviar(registro())
 await entrar(b);expect((await pg.query('select * from public.fichas')).rows).toHaveLength(0)
 await expect(enviar(registro(a))).rejects.toThrow()
 await expect(pg.query(`insert into public.fichas select * from jsonb_populate_record(null::public.fichas,$1::jsonb)`,[JSON.stringify(registro(a))])).rejects.toThrow()
 await entrar('','anon');await expect(pg.query('select * from public.fichas')).rejects.toThrow()
 await expect(enviar(registro())).rejects.toThrow()
})
test('RPC preserva alteração mais recente e propaga exclusão sem apagar registro',async()=>{
 await entrar(a);await enviar(registro(a,'Novo','2026-10-14T14:00:00Z'))
 await enviar(registro(a,'Antigo','2026-10-14T11:00:00Z'))
 expect((await pg.query<{dados:{nome:string}}>('select dados from public.fichas')).rows[0].dados.nome).toBe('Novo')
 const r={...registro(a,'Apagado','2026-10-14T15:00:00Z'),apagado_em:'2026-10-14T15:00:00Z'};await enviar(r)
 expect((await pg.query<{apagado_em:unknown}>('select apagado_em from public.fichas')).rows[0].apagado_em).toBeTruthy()
 await expect(pg.query('delete from public.fichas')).rejects.toThrow()
})
test('bucket permite somente o caminho do dono',async()=>{
 await entrar(a)
 await pg.query('insert into storage.objects values($1,$2,$3)',['foto','fotos-vida-em-dia',`${a}/2026/foto.jpg`])
 await expect(pg.query('insert into storage.objects values($1,$2,$3)',['outra','fotos-vida-em-dia',`${b}/2026/foto.jpg`])).rejects.toThrow()
 await entrar(b);expect((await pg.query('select * from storage.objects')).rows).toHaveLength(0)
})
