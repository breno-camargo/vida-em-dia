-- APP-03. Somente STAGING mediante revisao/aprovacao; este arquivo nao faz deploy.
begin;
create function public.vida_em_dia_retencao_dias() returns integer language sql immutable as $$select 30$$;
create table public.vida_em_dia_remocoes_storage(user_id uuid not null references auth.users(id) on delete cascade,caminho text not null,primary key(user_id,caminho),check(split_part(caminho,'/',1)=user_id::text));
alter table public.vida_em_dia_remocoes_storage enable row level security;
revoke all on public.vida_em_dia_remocoes_storage from public,anon,authenticated;
grant select,insert,delete on public.vida_em_dia_remocoes_storage to authenticated;
create policy dono_remocao on public.vida_em_dia_remocoes_storage to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
create table public.vida_em_dia_exclusao_conta(user_id uuid primary key references auth.users(id) on delete cascade,etapa text not null default 'iniciada');
alter table public.vida_em_dia_exclusao_conta enable row level security;
revoke all on public.vida_em_dia_exclusao_conta from public,anon,authenticated;
create table public.vida_em_dia_tentativas_exclusao(user_id uuid primary key references auth.users(id) on delete cascade,inicio timestamptz not null default clock_timestamp(),tentativas integer not null default 0);
alter table public.vida_em_dia_tentativas_exclusao enable row level security;
revoke all on public.vida_em_dia_tentativas_exclusao from public,anon,authenticated;
-- Tabelas de controle sem politicas: acesso somente pela Edge Function com service_role.
create function public.vida_em_dia_conta_ativa() returns boolean language sql stable security definer set search_path='' as $$select not exists(select 1 from public.vida_em_dia_exclusao_conta where user_id=auth.uid())$$;
revoke all on function public.vida_em_dia_conta_ativa() from public,anon;
grant execute on function public.vida_em_dia_conta_ativa() to authenticated;
create function public.vida_em_dia_bloquear_eliminado() returns trigger language plpgsql security invoker set search_path='' as $$
begin
 if TG_OP='UPDATE' and OLD.eliminado_em is not null then raise exception using errcode='P0002',message='Registro eliminado definitivamente';end if;
 if NEW.eliminado_em is not null then
  NEW.apagado_em=coalesce(NEW.apagado_em,NEW.eliminado_em);
  if TG_TABLE_NAME='fotos' and TG_OP='UPDATE' and OLD.dados->>'caminho_storage' is not null then
   insert into public.vida_em_dia_remocoes_storage(user_id,caminho) values(OLD.user_id,OLD.dados->>'caminho_storage') on conflict do nothing;
  end if;
  NEW.criado_em=NEW.eliminado_em;NEW.atualizado_em=NEW.eliminado_em;
  NEW.dados=jsonb_build_object('id',NEW.id,'user_id',NEW.user_id,'apagado_em',NEW.apagado_em,'eliminado_em',NEW.eliminado_em);
 end if;
 return NEW;
end $$;
alter table public.exercicios add column eliminado_em timestamptz;
alter table public.exercicios add constraint tombstone_minimo check(eliminado_em is null or (apagado_em is not null and dados=jsonb_build_object('id',id,'user_id',user_id,'apagado_em',apagado_em,'eliminado_em',eliminado_em)));
create trigger bloquear_eliminado before insert or update on public.exercicios for each row execute function public.vida_em_dia_bloquear_eliminado();
create policy conta_ativa on public.exercicios as restrictive for all to authenticated using(public.vida_em_dia_conta_ativa()) with check(public.vida_em_dia_conta_ativa());
alter table public.fichas add column eliminado_em timestamptz;
alter table public.fichas add constraint tombstone_minimo check(eliminado_em is null or (apagado_em is not null and dados=jsonb_build_object('id',id,'user_id',user_id,'apagado_em',apagado_em,'eliminado_em',eliminado_em)));
create trigger bloquear_eliminado before insert or update on public.fichas for each row execute function public.vida_em_dia_bloquear_eliminado();
create policy conta_ativa on public.fichas as restrictive for all to authenticated using(public.vida_em_dia_conta_ativa()) with check(public.vida_em_dia_conta_ativa());
alter table public.ficha_exercicios add column eliminado_em timestamptz;
alter table public.ficha_exercicios add constraint tombstone_minimo check(eliminado_em is null or (apagado_em is not null and dados=jsonb_build_object('id',id,'user_id',user_id,'apagado_em',apagado_em,'eliminado_em',eliminado_em)));
create trigger bloquear_eliminado before insert or update on public.ficha_exercicios for each row execute function public.vida_em_dia_bloquear_eliminado();
create policy conta_ativa on public.ficha_exercicios as restrictive for all to authenticated using(public.vida_em_dia_conta_ativa()) with check(public.vida_em_dia_conta_ativa());
alter table public.treinos add column eliminado_em timestamptz;
alter table public.treinos add constraint tombstone_minimo check(eliminado_em is null or (apagado_em is not null and dados=jsonb_build_object('id',id,'user_id',user_id,'apagado_em',apagado_em,'eliminado_em',eliminado_em)));
create trigger bloquear_eliminado before insert or update on public.treinos for each row execute function public.vida_em_dia_bloquear_eliminado();
create policy conta_ativa on public.treinos as restrictive for all to authenticated using(public.vida_em_dia_conta_ativa()) with check(public.vida_em_dia_conta_ativa());
alter table public.treino_exercicios add column eliminado_em timestamptz;
alter table public.treino_exercicios add constraint tombstone_minimo check(eliminado_em is null or (apagado_em is not null and dados=jsonb_build_object('id',id,'user_id',user_id,'apagado_em',apagado_em,'eliminado_em',eliminado_em)));
create trigger bloquear_eliminado before insert or update on public.treino_exercicios for each row execute function public.vida_em_dia_bloquear_eliminado();
create policy conta_ativa on public.treino_exercicios as restrictive for all to authenticated using(public.vida_em_dia_conta_ativa()) with check(public.vida_em_dia_conta_ativa());
alter table public.series_treino add column eliminado_em timestamptz;
alter table public.series_treino add constraint tombstone_minimo check(eliminado_em is null or (apagado_em is not null and dados=jsonb_build_object('id',id,'user_id',user_id,'apagado_em',apagado_em,'eliminado_em',eliminado_em)));
create trigger bloquear_eliminado before insert or update on public.series_treino for each row execute function public.vida_em_dia_bloquear_eliminado();
create policy conta_ativa on public.series_treino as restrictive for all to authenticated using(public.vida_em_dia_conta_ativa()) with check(public.vida_em_dia_conta_ativa());
alter table public.cardio_sessoes add column eliminado_em timestamptz;
alter table public.cardio_sessoes add constraint tombstone_minimo check(eliminado_em is null or (apagado_em is not null and dados=jsonb_build_object('id',id,'user_id',user_id,'apagado_em',apagado_em,'eliminado_em',eliminado_em)));
create trigger bloquear_eliminado before insert or update on public.cardio_sessoes for each row execute function public.vida_em_dia_bloquear_eliminado();
create policy conta_ativa on public.cardio_sessoes as restrictive for all to authenticated using(public.vida_em_dia_conta_ativa()) with check(public.vida_em_dia_conta_ativa());
alter table public.medidas_corporais add column eliminado_em timestamptz;
alter table public.medidas_corporais add constraint tombstone_minimo check(eliminado_em is null or (apagado_em is not null and dados=jsonb_build_object('id',id,'user_id',user_id,'apagado_em',apagado_em,'eliminado_em',eliminado_em)));
create trigger bloquear_eliminado before insert or update on public.medidas_corporais for each row execute function public.vida_em_dia_bloquear_eliminado();
create policy conta_ativa on public.medidas_corporais as restrictive for all to authenticated using(public.vida_em_dia_conta_ativa()) with check(public.vida_em_dia_conta_ativa());
alter table public.atividade_diaria add column eliminado_em timestamptz;
alter table public.atividade_diaria add constraint tombstone_minimo check(eliminado_em is null or (apagado_em is not null and dados=jsonb_build_object('id',id,'user_id',user_id,'apagado_em',apagado_em,'eliminado_em',eliminado_em)));
create trigger bloquear_eliminado before insert or update on public.atividade_diaria for each row execute function public.vida_em_dia_bloquear_eliminado();
create policy conta_ativa on public.atividade_diaria as restrictive for all to authenticated using(public.vida_em_dia_conta_ativa()) with check(public.vida_em_dia_conta_ativa());
alter table public.feriados add column eliminado_em timestamptz;
alter table public.feriados add constraint tombstone_minimo check(eliminado_em is null or (apagado_em is not null and dados=jsonb_build_object('id',id,'user_id',user_id,'apagado_em',apagado_em,'eliminado_em',eliminado_em)));
create trigger bloquear_eliminado before insert or update on public.feriados for each row execute function public.vida_em_dia_bloquear_eliminado();
create policy conta_ativa on public.feriados as restrictive for all to authenticated using(public.vida_em_dia_conta_ativa()) with check(public.vida_em_dia_conta_ativa());
alter table public.refeicoes_dia add column eliminado_em timestamptz;
alter table public.refeicoes_dia add constraint tombstone_minimo check(eliminado_em is null or (apagado_em is not null and dados=jsonb_build_object('id',id,'user_id',user_id,'apagado_em',apagado_em,'eliminado_em',eliminado_em)));
create trigger bloquear_eliminado before insert or update on public.refeicoes_dia for each row execute function public.vida_em_dia_bloquear_eliminado();
create policy conta_ativa on public.refeicoes_dia as restrictive for all to authenticated using(public.vida_em_dia_conta_ativa()) with check(public.vida_em_dia_conta_ativa());
alter table public.alimentos_favoritos add column eliminado_em timestamptz;
alter table public.alimentos_favoritos add constraint tombstone_minimo check(eliminado_em is null or (apagado_em is not null and dados=jsonb_build_object('id',id,'user_id',user_id,'apagado_em',apagado_em,'eliminado_em',eliminado_em)));
create trigger bloquear_eliminado before insert or update on public.alimentos_favoritos for each row execute function public.vida_em_dia_bloquear_eliminado();
create policy conta_ativa on public.alimentos_favoritos as restrictive for all to authenticated using(public.vida_em_dia_conta_ativa()) with check(public.vida_em_dia_conta_ativa());
alter table public.combos_refeicao add column eliminado_em timestamptz;
alter table public.combos_refeicao add constraint tombstone_minimo check(eliminado_em is null or (apagado_em is not null and dados=jsonb_build_object('id',id,'user_id',user_id,'apagado_em',apagado_em,'eliminado_em',eliminado_em)));
create trigger bloquear_eliminado before insert or update on public.combos_refeicao for each row execute function public.vida_em_dia_bloquear_eliminado();
create policy conta_ativa on public.combos_refeicao as restrictive for all to authenticated using(public.vida_em_dia_conta_ativa()) with check(public.vida_em_dia_conta_ativa());
alter table public.agua_dia add column eliminado_em timestamptz;
alter table public.agua_dia add constraint tombstone_minimo check(eliminado_em is null or (apagado_em is not null and dados=jsonb_build_object('id',id,'user_id',user_id,'apagado_em',apagado_em,'eliminado_em',eliminado_em)));
create trigger bloquear_eliminado before insert or update on public.agua_dia for each row execute function public.vida_em_dia_bloquear_eliminado();
create policy conta_ativa on public.agua_dia as restrictive for all to authenticated using(public.vida_em_dia_conta_ativa()) with check(public.vida_em_dia_conta_ativa());
alter table public.consumo_diario_meta add column eliminado_em timestamptz;
alter table public.consumo_diario_meta add constraint tombstone_minimo check(eliminado_em is null or (apagado_em is not null and dados=jsonb_build_object('id',id,'user_id',user_id,'apagado_em',apagado_em,'eliminado_em',eliminado_em)));
create trigger bloquear_eliminado before insert or update on public.consumo_diario_meta for each row execute function public.vida_em_dia_bloquear_eliminado();
create policy conta_ativa on public.consumo_diario_meta as restrictive for all to authenticated using(public.vida_em_dia_conta_ativa()) with check(public.vida_em_dia_conta_ativa());
alter table public.configuracoes add column eliminado_em timestamptz;
alter table public.configuracoes add constraint tombstone_minimo check(eliminado_em is null or (apagado_em is not null and dados=jsonb_build_object('id',id,'user_id',user_id,'apagado_em',apagado_em,'eliminado_em',eliminado_em)));
create trigger bloquear_eliminado before insert or update on public.configuracoes for each row execute function public.vida_em_dia_bloquear_eliminado();
create policy conta_ativa on public.configuracoes as restrictive for all to authenticated using(public.vida_em_dia_conta_ativa()) with check(public.vida_em_dia_conta_ativa());
alter table public.fotos add column eliminado_em timestamptz;
alter table public.fotos add constraint tombstone_minimo check(eliminado_em is null or (apagado_em is not null and dados=jsonb_build_object('id',id,'user_id',user_id,'apagado_em',apagado_em,'eliminado_em',eliminado_em)));
create trigger bloquear_eliminado before insert or update on public.fotos for each row execute function public.vida_em_dia_bloquear_eliminado();
create policy conta_ativa on public.fotos as restrictive for all to authenticated using(public.vida_em_dia_conta_ativa()) with check(public.vida_em_dia_conta_ativa());
create policy conta_ativa_storage on storage.objects as restrictive for all to authenticated using(public.vida_em_dia_conta_ativa()) with check(public.vida_em_dia_conta_ativa());
-- Mesmo unico molde de INSERT dinamico, allowlist literal e identificador %I da RPC original.
create or replace function public.vida_em_dia_enviar(tabela_nome text,registros jsonb) returns void language plpgsql security invoker set search_path='' as $$
begin
 if auth.uid() is null then raise exception 'Login necessario';end if;
 if tabela_nome <> all(array['exercicios','fichas','ficha_exercicios','treinos','treino_exercicios','series_treino','cardio_sessoes','medidas_corporais','atividade_diaria','feriados','refeicoes_dia','alimentos_favoritos','combos_refeicao','agua_dia','consumo_diario_meta','configuracoes','fotos']) then raise exception 'Tabela invalida';end if;
 if jsonb_typeof(registros)<>'array' or jsonb_array_length(registros)>100 then raise exception 'Lote invalido';end if;
 execute format('insert into public.%I as destino(id,user_id,criado_em,atualizado_em,apagado_em,eliminado_em,dados)
 select id,user_id,criado_em,atualizado_em,apagado_em,eliminado_em,dados from jsonb_to_recordset($1) as r(id text,user_id uuid,criado_em timestamptz,atualizado_em timestamptz,apagado_em timestamptz,eliminado_em timestamptz,dados jsonb)
 on conflict(user_id,id) do update set criado_em=excluded.criado_em,atualizado_em=excluded.atualizado_em,apagado_em=excluded.apagado_em,eliminado_em=excluded.eliminado_em,dados=excluded.dados
 where destino.eliminado_em is not null or excluded.eliminado_em is not null or excluded.atualizado_em>destino.atualizado_em',tabela_nome) using registros;
end $$;
create function public.vida_em_dia_eliminar(tabela_nome text,registro_id text) returns void language plpgsql security invoker set search_path='' as $$
declare dono uuid=auth.uid();ja boolean;agora timestamptz=clock_timestamp();filho record;
begin
 if dono is null then raise exception 'Login necessario';end if;
 if registro_id is null or length(registro_id)=0 or length(registro_id)>200 then raise exception 'ID invalido';end if;
 -- DML estatico: nenhum novo SQL dinamico para escolher tabelas.
 case tabela_nome
 when 'exercicios' then select eliminado_em is not null into ja from public.exercicios where user_id=dono and id=registro_id;
 when 'fichas' then select eliminado_em is not null into ja from public.fichas where user_id=dono and id=registro_id;
 when 'ficha_exercicios' then select eliminado_em is not null into ja from public.ficha_exercicios where user_id=dono and id=registro_id;
 when 'treinos' then select eliminado_em is not null into ja from public.treinos where user_id=dono and id=registro_id;
 when 'treino_exercicios' then select eliminado_em is not null into ja from public.treino_exercicios where user_id=dono and id=registro_id;
 when 'series_treino' then select eliminado_em is not null into ja from public.series_treino where user_id=dono and id=registro_id;
 when 'cardio_sessoes' then select eliminado_em is not null into ja from public.cardio_sessoes where user_id=dono and id=registro_id;
 when 'medidas_corporais' then select eliminado_em is not null into ja from public.medidas_corporais where user_id=dono and id=registro_id;
 when 'atividade_diaria' then select eliminado_em is not null into ja from public.atividade_diaria where user_id=dono and id=registro_id;
 when 'feriados' then select eliminado_em is not null into ja from public.feriados where user_id=dono and id=registro_id;
 when 'refeicoes_dia' then select eliminado_em is not null into ja from public.refeicoes_dia where user_id=dono and id=registro_id;
 when 'alimentos_favoritos' then select eliminado_em is not null into ja from public.alimentos_favoritos where user_id=dono and id=registro_id;
 when 'combos_refeicao' then select eliminado_em is not null into ja from public.combos_refeicao where user_id=dono and id=registro_id;
 when 'agua_dia' then select eliminado_em is not null into ja from public.agua_dia where user_id=dono and id=registro_id;
 when 'consumo_diario_meta' then select eliminado_em is not null into ja from public.consumo_diario_meta where user_id=dono and id=registro_id;
 when 'configuracoes' then select eliminado_em is not null into ja from public.configuracoes where user_id=dono and id=registro_id;
 when 'fotos' then select eliminado_em is not null into ja from public.fotos where user_id=dono and id=registro_id;
 else raise exception 'Tabela invalida';end case;
 if ja then return;end if;
 if tabela_nome='fichas' then
 for filho in select id from public.ficha_exercicios where user_id=dono and eliminado_em is null and dados->>'ficha_id'=registro_id loop perform public.vida_em_dia_eliminar('ficha_exercicios',filho.id);end loop;
 end if;
 if tabela_nome='exercicios' then
 for filho in select id from public.ficha_exercicios where user_id=dono and eliminado_em is null and dados->>'exercicio_id'=registro_id loop perform public.vida_em_dia_eliminar('ficha_exercicios',filho.id);end loop;
 for filho in select id from public.treino_exercicios where user_id=dono and eliminado_em is null and dados->>'exercicio_id'=registro_id loop perform public.vida_em_dia_eliminar('treino_exercicios',filho.id);end loop;
 for filho in select id from public.series_treino where user_id=dono and eliminado_em is null and dados->>'exercicio_id'=registro_id loop perform public.vida_em_dia_eliminar('series_treino',filho.id);end loop;
 for filho in select id from public.cardio_sessoes where user_id=dono and eliminado_em is null and dados->>'exercicio_id'=registro_id loop perform public.vida_em_dia_eliminar('cardio_sessoes',filho.id);end loop;
 for filho in select id from public.fotos where user_id=dono and eliminado_em is null and dados->>'exercicio_id'=registro_id loop perform public.vida_em_dia_eliminar('fotos',filho.id);end loop;
 end if;
 if tabela_nome='treinos' then
 for filho in select id from public.treino_exercicios where user_id=dono and eliminado_em is null and dados->>'treino_id'=registro_id loop perform public.vida_em_dia_eliminar('treino_exercicios',filho.id);end loop;
 for filho in select id from public.series_treino where user_id=dono and eliminado_em is null and dados->>'treino_id'=registro_id loop perform public.vida_em_dia_eliminar('series_treino',filho.id);end loop;
 for filho in select id from public.cardio_sessoes where user_id=dono and eliminado_em is null and dados->>'treino_id'=registro_id loop perform public.vida_em_dia_eliminar('cardio_sessoes',filho.id);end loop;
 end if;
 if tabela_nome='medidas_corporais' then
 for filho in select id from public.fotos where user_id=dono and eliminado_em is null and dados->>'medida_id'=registro_id loop perform public.vida_em_dia_eliminar('fotos',filho.id);end loop;
 end if;
 begin
 perform public.vida_em_dia_enviar(tabela_nome,jsonb_build_array(jsonb_build_object('id',registro_id,'user_id',dono,'criado_em',agora,'atualizado_em',agora,'apagado_em',agora,'eliminado_em',agora,'dados',jsonb_build_object('id',registro_id,'user_id',dono))));
 exception when no_data_found then null; -- Concorrencia: tombstone ja confirmado e imutavel.
 end;
end $$;
revoke all on function public.vida_em_dia_eliminar(text,text) from public,anon;
grant execute on function public.vida_em_dia_eliminar(text,text) to authenticated;
-- Limite atomico: cinco tentativas a cada quinze minutos, inclusive senhas incorretas.
create function public.vida_em_dia_tentar_exclusao(dono uuid) returns boolean language plpgsql security invoker set search_path='' as $$
declare n integer;
begin
 insert into public.vida_em_dia_tentativas_exclusao as t(user_id,tentativas) values(dono,1) on conflict(user_id) do update set
 tentativas=case when t.inicio<=clock_timestamp()-interval '15 minutes' then 1 else t.tentativas+1 end,
 inicio=case when t.inicio<=clock_timestamp()-interval '15 minutes' then clock_timestamp() else t.inicio end returning tentativas into n;
 return n<=5;
end $$;
create function public.vida_em_dia_apagar_linhas_conta(dono uuid) returns void language plpgsql security invoker set search_path='' as $$begin
 delete from public.exercicios where user_id=dono;
 delete from public.fichas where user_id=dono;
 delete from public.ficha_exercicios where user_id=dono;
 delete from public.treinos where user_id=dono;
 delete from public.treino_exercicios where user_id=dono;
 delete from public.series_treino where user_id=dono;
 delete from public.cardio_sessoes where user_id=dono;
 delete from public.medidas_corporais where user_id=dono;
 delete from public.atividade_diaria where user_id=dono;
 delete from public.feriados where user_id=dono;
 delete from public.refeicoes_dia where user_id=dono;
 delete from public.alimentos_favoritos where user_id=dono;
 delete from public.combos_refeicao where user_id=dono;
 delete from public.agua_dia where user_id=dono;
 delete from public.consumo_diario_meta where user_id=dono;
 delete from public.configuracoes where user_id=dono;
 delete from public.fotos where user_id=dono;
delete from public.vida_em_dia_remocoes_storage where user_id=dono;
end $$;
create function public.vida_em_dia_purgar() returns void language plpgsql security invoker set search_path='' as $$begin
 update public.exercicios set eliminado_em=clock_timestamp() where eliminado_em is null and apagado_em<=clock_timestamp()-make_interval(days=>public.vida_em_dia_retencao_dias());
 update public.fichas set eliminado_em=clock_timestamp() where eliminado_em is null and apagado_em<=clock_timestamp()-make_interval(days=>public.vida_em_dia_retencao_dias());
 update public.ficha_exercicios set eliminado_em=clock_timestamp() where eliminado_em is null and apagado_em<=clock_timestamp()-make_interval(days=>public.vida_em_dia_retencao_dias());
 update public.treinos set eliminado_em=clock_timestamp() where eliminado_em is null and apagado_em<=clock_timestamp()-make_interval(days=>public.vida_em_dia_retencao_dias());
 update public.treino_exercicios set eliminado_em=clock_timestamp() where eliminado_em is null and apagado_em<=clock_timestamp()-make_interval(days=>public.vida_em_dia_retencao_dias());
 update public.series_treino set eliminado_em=clock_timestamp() where eliminado_em is null and apagado_em<=clock_timestamp()-make_interval(days=>public.vida_em_dia_retencao_dias());
 update public.cardio_sessoes set eliminado_em=clock_timestamp() where eliminado_em is null and apagado_em<=clock_timestamp()-make_interval(days=>public.vida_em_dia_retencao_dias());
 update public.medidas_corporais set eliminado_em=clock_timestamp() where eliminado_em is null and apagado_em<=clock_timestamp()-make_interval(days=>public.vida_em_dia_retencao_dias());
 update public.atividade_diaria set eliminado_em=clock_timestamp() where eliminado_em is null and apagado_em<=clock_timestamp()-make_interval(days=>public.vida_em_dia_retencao_dias());
 update public.feriados set eliminado_em=clock_timestamp() where eliminado_em is null and apagado_em<=clock_timestamp()-make_interval(days=>public.vida_em_dia_retencao_dias());
 update public.refeicoes_dia set eliminado_em=clock_timestamp() where eliminado_em is null and apagado_em<=clock_timestamp()-make_interval(days=>public.vida_em_dia_retencao_dias());
 update public.alimentos_favoritos set eliminado_em=clock_timestamp() where eliminado_em is null and apagado_em<=clock_timestamp()-make_interval(days=>public.vida_em_dia_retencao_dias());
 update public.combos_refeicao set eliminado_em=clock_timestamp() where eliminado_em is null and apagado_em<=clock_timestamp()-make_interval(days=>public.vida_em_dia_retencao_dias());
 update public.agua_dia set eliminado_em=clock_timestamp() where eliminado_em is null and apagado_em<=clock_timestamp()-make_interval(days=>public.vida_em_dia_retencao_dias());
 update public.consumo_diario_meta set eliminado_em=clock_timestamp() where eliminado_em is null and apagado_em<=clock_timestamp()-make_interval(days=>public.vida_em_dia_retencao_dias());
 update public.configuracoes set eliminado_em=clock_timestamp() where eliminado_em is null and apagado_em<=clock_timestamp()-make_interval(days=>public.vida_em_dia_retencao_dias());
 update public.fotos set eliminado_em=clock_timestamp() where eliminado_em is null and apagado_em<=clock_timestamp()-make_interval(days=>public.vida_em_dia_retencao_dias());
update public.ficha_exercicios as f set eliminado_em=clock_timestamp() where f.eliminado_em is null and exists(select 1 from public.fichas as p where p.user_id=f.user_id and p.id=f.dados->>'ficha_id' and p.eliminado_em is not null);
update public.ficha_exercicios as f set eliminado_em=clock_timestamp() where f.eliminado_em is null and exists(select 1 from public.exercicios as p where p.user_id=f.user_id and p.id=f.dados->>'exercicio_id' and p.eliminado_em is not null);
update public.treino_exercicios as f set eliminado_em=clock_timestamp() where f.eliminado_em is null and exists(select 1 from public.treinos as p where p.user_id=f.user_id and p.id=f.dados->>'treino_id' and p.eliminado_em is not null);
update public.treino_exercicios as f set eliminado_em=clock_timestamp() where f.eliminado_em is null and exists(select 1 from public.exercicios as p where p.user_id=f.user_id and p.id=f.dados->>'exercicio_id' and p.eliminado_em is not null);
update public.series_treino as f set eliminado_em=clock_timestamp() where f.eliminado_em is null and exists(select 1 from public.treinos as p where p.user_id=f.user_id and p.id=f.dados->>'treino_id' and p.eliminado_em is not null);
update public.series_treino as f set eliminado_em=clock_timestamp() where f.eliminado_em is null and exists(select 1 from public.exercicios as p where p.user_id=f.user_id and p.id=f.dados->>'exercicio_id' and p.eliminado_em is not null);
update public.cardio_sessoes as f set eliminado_em=clock_timestamp() where f.eliminado_em is null and exists(select 1 from public.treinos as p where p.user_id=f.user_id and p.id=f.dados->>'treino_id' and p.eliminado_em is not null);
update public.cardio_sessoes as f set eliminado_em=clock_timestamp() where f.eliminado_em is null and exists(select 1 from public.exercicios as p where p.user_id=f.user_id and p.id=f.dados->>'exercicio_id' and p.eliminado_em is not null);
update public.fotos as f set eliminado_em=clock_timestamp() where f.eliminado_em is null and exists(select 1 from public.medidas_corporais as p where p.user_id=f.user_id and p.id=f.dados->>'medida_id' and p.eliminado_em is not null);
update public.fotos as f set eliminado_em=clock_timestamp() where f.eliminado_em is null and exists(select 1 from public.exercicios as p where p.user_id=f.user_id and p.id=f.dados->>'exercicio_id' and p.eliminado_em is not null);
end $$;
revoke all on function public.vida_em_dia_tentar_exclusao(uuid),public.vida_em_dia_apagar_linhas_conta(uuid),public.vida_em_dia_purgar() from public,anon,authenticated;
grant execute on function public.vida_em_dia_tentar_exclusao(uuid),public.vida_em_dia_apagar_linhas_conta(uuid),public.vida_em_dia_purgar() to service_role;
grant all on public.vida_em_dia_tentativas_exclusao,public.vida_em_dia_exclusao_conta,public.vida_em_dia_remocoes_storage to service_role;
-- Nao instalar extensoes implicitamente. Aplicacao deve conferir pg_cron no STAGING.
-- O job SQL purga conteudo; o endpoint agendado remove objetos pela Storage API.
do $$begin
 if exists(select 1 from pg_extension where extname='pg_cron') then
  perform cron.schedule('vida-em-dia-purga','17 3 * * *','select public.vida_em_dia_purgar()');
 end if;
end $$;
commit;
