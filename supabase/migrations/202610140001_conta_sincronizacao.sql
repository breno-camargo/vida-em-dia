-- ETAPA 8: aplicar primeiro em um projeto de TESTES.
-- Não executar em produção antes de revisar ambiente e backup.
begin;
do $$
declare nome text;
begin
  foreach nome in array array['exercicios','fichas','ficha_exercicios','treinos','treino_exercicios','series_treino','cardio_sessoes','medidas_corporais','atividade_diaria','feriados','refeicoes_dia','alimentos_favoritos','combos_refeicao','agua_dia','consumo_diario_meta','configuracoes','fotos'] loop
    execute format('create table public.%I (
      id text not null, user_id uuid not null references auth.users(id) on delete cascade,
      criado_em timestamptz not null, atualizado_em timestamptz not null, apagado_em timestamptz,
      dados jsonb not null check(jsonb_typeof(dados) = ''object''),
      primary key(user_id,id),
      check((dados->>''id'') is not distinct from id), check((dados->>''user_id'') is not distinct from user_id::text)
    )', nome);
    execute format('alter table public.%I enable row level security', nome);
    execute format('create index on public.%I (user_id, atualizado_em, id)', nome);
    execute format('revoke all on public.%I from anon, authenticated', nome);
    execute format('grant select, insert, update on public.%I to authenticated', nome);
    execute format('create policy dono_select on public.%I for select to authenticated using ((select auth.uid()) = user_id)', nome);
    execute format('create policy dono_insert on public.%I for insert to authenticated with check ((select auth.uid()) = user_id)', nome);
    execute format('create policy dono_update on public.%I for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)', nome);
  end loop;
end $$;
create unique index configuracao_principal_dono on public.configuracoes(user_id, (dados->>'chave')) where apagado_em is null;
create unique index medida_data_dono on public.medidas_corporais(user_id, (dados->>'data')) where apagado_em is null;
create unique index atividade_data_dono on public.atividade_diaria(user_id, (dados->>'data')) where apagado_em is null;
create unique index agua_data_dono on public.agua_dia(user_id, (dados->>'data')) where apagado_em is null;
create unique index consumo_data_dono on public.consumo_diario_meta(user_id, (dados->>'data')) where apagado_em is null;
-- Conflito resolvido atomicamente no Postgres; horário igual preserva o servidor.
create function public.vida_em_dia_enviar(tabela_nome text, registros jsonb)
returns void language plpgsql security invoker set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'Login necessário'; end if;
  if tabela_nome <> all(array['exercicios','fichas','ficha_exercicios','treinos','treino_exercicios','series_treino','cardio_sessoes','medidas_corporais','atividade_diaria','feriados','refeicoes_dia','alimentos_favoritos','combos_refeicao','agua_dia','consumo_diario_meta','configuracoes']) then raise exception 'Tabela inválida'; end if;
  if jsonb_typeof(registros) <> 'array' or jsonb_array_length(registros)>100 then raise exception 'Lote inválido'; end if;
  execute format('insert into public.%I as destino (id,user_id,criado_em,atualizado_em,apagado_em,dados)
    select id,user_id,criado_em,atualizado_em,apagado_em,dados
    from jsonb_to_recordset($1) as r(id text,user_id uuid,criado_em timestamptz,atualizado_em timestamptz,apagado_em timestamptz,dados jsonb)
    on conflict(user_id,id) do update set criado_em=excluded.criado_em, atualizado_em=excluded.atualizado_em,
    apagado_em=excluded.apagado_em,dados=excluded.dados
    where excluded.atualizado_em > destino.atualizado_em',tabela_nome) using registros;
end $$;
revoke all on function public.vida_em_dia_enviar(text,jsonb) from public, anon;
grant execute on function public.vida_em_dia_enviar(text,jsonb) to authenticated;
-- Reservado para etapa 11: imagens privadas, nunca públicas.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('fotos-vida-em-dia','fotos-vida-em-dia',false,5242880,array['image/jpeg','image/png','image/webp']);
create policy fotos_dono_select on storage.objects for select to authenticated using (bucket_id='fotos-vida-em-dia' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy fotos_dono_insert on storage.objects for insert to authenticated with check (bucket_id='fotos-vida-em-dia' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy fotos_dono_update on storage.objects for update to authenticated using (bucket_id='fotos-vida-em-dia' and (storage.foldername(name))[1]=(select auth.uid())::text) with check (bucket_id='fotos-vida-em-dia' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy fotos_dono_delete on storage.objects for delete to authenticated using (bucket_id='fotos-vida-em-dia' and (storage.foldername(name))[1]=(select auth.uid())::text);
commit;
