-- SOMENTE LEITURA. Executar no SQL Editor de CADA projeto e guardar o resultado
-- em registro operacional restrito. Não lê registros pessoais, Auth users,
-- chaves, secrets, payloads de funções ou comandos do agendador.
-- Usa catálogos PostgreSQL e metadados de Storage. Nenhuma correção automática.

-- 1. Todas as tabelas public sem RLS (triagem, incluindo tabelas de extensões).
SELECT n.nspname AS esquema, c.relname AS tabela, c.relrowsecurity AS rls,
       pg_catalog.pg_get_userbyid(c.relowner) AS proprietario
FROM pg_catalog.pg_class c
JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relkind IN ('r', 'p') AND NOT c.relrowsecurity
ORDER BY c.relname;

-- 2. Existência e RLS das 17 tabelas e dos três controles esperados.
SELECT e.nome AS tabela, c.oid IS NOT NULL AS existe,
       coalesce(c.relrowsecurity, false) AS rls_ligada
FROM unnest(ARRAY['exercicios','fichas','ficha_exercicios','treinos',
 'treino_exercicios','series_treino','cardio_sessoes','medidas_corporais',
 'atividade_diaria','feriados','refeicoes_dia','alimentos_favoritos',
 'combos_refeicao','agua_dia','consumo_diario_meta','configuracoes','fotos',
 'vida_em_dia_remocoes_storage','vida_em_dia_exclusao_conta',
 'vida_em_dia_tentativas_exclusao']::text[]) AS e(nome)
LEFT JOIN pg_catalog.pg_namespace n ON n.nspname = 'public'
LEFT JOIN pg_catalog.pg_class c ON c.relnamespace = n.oid AND c.relname = e.nome AND c.relkind IN ('r','p')
ORDER BY e.nome;

-- 3. Políticas completas por tabela (não confundir policy PUBLIC com schema public).
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_catalog.pg_policies
WHERE schemaname IN ('public', 'storage')
ORDER BY schemaname, tablename, policyname;

-- 4. Sinais para revisão: TO PUBLIC ou expressão literalmente TRUE.
-- A triagem não prova ausência de outras tautologias ou de políticas inseguras.
SELECT schemaname, tablename, policyname, roles, cmd, qual, with_check,
       roles::text[] @> ARRAY['public']::text[] AS para_public,
       lower(regexp_replace(coalesce(qual,''), '[[:space:]()]', '', 'g')) = 'true' AS using_true,
       lower(regexp_replace(coalesce(with_check,''), '[[:space:]()]', '', 'g')) = 'true' AS check_true
FROM pg_catalog.pg_policies
WHERE schemaname IN ('public','storage') AND (
 roles::text[] @> ARRAY['public']::text[] OR
 lower(regexp_replace(coalesce(qual,''), '[[:space:]()]', '', 'g')) = 'true' OR
 lower(regexp_replace(coalesce(with_check,''), '[[:space:]()]', '', 'g')) = 'true')
ORDER BY schemaname, tablename, policyname;

-- 5. Privilégios efetivos, incluindo herança/PUBLIC. DELETE/TRUNCATE devem ser
-- falsos no schema public para os dois papéis. Storage.objects é caso distinto:
-- DELETE permite a Storage API sob RLS e não deve ser usado por SQL manual.
SELECT n.nspname AS esquema, c.relname AS tabela, r.rolname AS papel,
       pg_catalog.has_table_privilege(r.oid,c.oid,'SELECT') AS pode_select,
       pg_catalog.has_table_privilege(r.oid,c.oid,'INSERT') AS pode_insert,
       pg_catalog.has_table_privilege(r.oid,c.oid,'UPDATE') AS pode_update,
       pg_catalog.has_table_privilege(r.oid,c.oid,'DELETE') AS pode_delete,
       pg_catalog.has_table_privilege(r.oid,c.oid,'TRUNCATE') AS pode_truncate,
       n.nspname = 'public' AND (
         pg_catalog.has_table_privilege(r.oid,c.oid,'DELETE') OR
         pg_catalog.has_table_privilege(r.oid,c.oid,'TRUNCATE')) AS revisar_exclusao_cliente
FROM pg_catalog.pg_class c
JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace
CROSS JOIN pg_catalog.pg_roles r
WHERE n.nspname IN ('public','storage') AND c.relkind IN ('r','p')
  AND r.rolname IN ('anon','authenticated')
ORDER BY n.nspname,c.relname,r.rolname;

-- 6. Imutabilidade nas 17 tabelas: presença, habilitação normal e BEFORE UPDATE.
SELECT c.relname AS tabela, t.tgname AS trigger,
       coalesce(t.tgenabled IN ('O','A'),false) AS habilitado,
       coalesce((t.tgtype & 2)=2 AND (t.tgtype & 16)=16,false) AS before_update,
       p.proname AS funcao, p.prosecdef AS security_definer,
       pg_catalog.pg_get_triggerdef(t.oid,true) AS definicao
FROM pg_catalog.pg_class c
JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace
LEFT JOIN pg_catalog.pg_trigger t ON t.tgrelid=c.oid AND NOT t.tgisinternal AND t.tgname='bloquear_eliminado'
LEFT JOIN pg_catalog.pg_proc p ON p.oid=t.tgfoid
WHERE n.nspname='public' AND c.relkind IN ('r','p') AND c.relname=ANY(ARRAY[
 'exercicios','fichas','ficha_exercicios','treinos','treino_exercicios',
 'series_treino','cardio_sessoes','medidas_corporais','atividade_diaria','feriados',
 'refeicoes_dia','alimentos_favoritos','combos_refeicao','agua_dia',
 'consumo_diario_meta','configuracoes','fotos'])
ORDER BY c.relname;

-- 7. CHECK mínimo e convalidated. Ausência ou NOT VALID pendente bloqueia liberação.
SELECT c.relname AS tabela, k.conname AS restricao,
       coalesce(k.convalidated,false) AS validada,
       pg_catalog.pg_get_constraintdef(k.oid,true) AS definicao
FROM pg_catalog.pg_class c
JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace
LEFT JOIN pg_catalog.pg_constraint k ON k.conrelid=c.oid AND k.contype='c' AND k.conname='tombstone_minimo'
WHERE n.nspname='public' AND c.relkind IN ('r','p') AND c.relname=ANY(ARRAY[
 'exercicios','fichas','ficha_exercicios','treinos','treino_exercicios',
 'series_treino','cardio_sessoes','medidas_corporais','atividade_diaria','feriados',
 'refeicoes_dia','alimentos_favoritos','combos_refeicao','agua_dia',
 'consumo_diario_meta','configuracoes','fotos'])
ORDER BY c.relname;

-- 8. Bucket de fotos: apenas metadados, nunca listar objetos ou caminhos de usuários.
SELECT id, public AS publico, file_size_limit, allowed_mime_types
FROM storage.buckets
WHERE id='fotos-vida-em-dia';

-- 9. Funções SECURITY DEFINER de aplicação/plataforma, sem expor seus corpos.
-- Esperada em public: vida_em_dia_conta_ativa, com search_path vazio e escopo uid.
SELECT n.nspname AS esquema, p.proname AS funcao,
       pg_catalog.pg_get_function_identity_arguments(p.oid) AS argumentos,
       pg_catalog.pg_get_userbyid(p.proowner) AS proprietario,
       (SELECT string_agg(v,', ') FROM unnest(p.proconfig) AS x(v) WHERE v LIKE 'search_path=%') AS search_path,
       p.proacl AS privilegios
FROM pg_catalog.pg_proc p
JOIN pg_catalog.pg_namespace n ON n.oid=p.pronamespace
WHERE p.prosecdef AND n.nspname NOT IN ('pg_catalog','information_schema')
  AND n.nspname NOT LIKE 'pg_toast%'
ORDER BY n.nspname,p.proname;

-- 10. Disponibilidade não significa instalação. Não instala nem agenda nada.
SELECT EXISTS(SELECT 1 FROM pg_catalog.pg_extension WHERE extname='pg_cron') AS pg_cron_instalado,
       (SELECT extversion FROM pg_catalog.pg_extension WHERE extname='pg_cron') AS versao_instalada,
       EXISTS(SELECT 1 FROM pg_catalog.pg_available_extensions WHERE name='pg_cron') AS disponivel_para_instalar;

-- 11. FKs para Auth, sem consultar auth.users. Conferir ON DELETE CASCADE.
SELECT n.nspname AS esquema, c.relname AS tabela, k.conname,
       k.convalidated AS validada, k.confdeltype='c' AS delete_cascade,
       pg_catalog.pg_get_constraintdef(k.oid,true) AS definicao
FROM pg_catalog.pg_constraint k
JOIN pg_catalog.pg_class c ON c.oid=k.conrelid
JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace
WHERE k.contype='f' AND k.confrelid=pg_catalog.to_regclass('auth.users') AND n.nspname='public'
ORDER BY c.relname,k.conname;

-- 12. Os papéis de cliente não devem ser superuser nem contornar RLS.
SELECT rolname, rolsuper, rolbypassrls
FROM pg_catalog.pg_roles
WHERE rolname IN ('anon','authenticated')
ORDER BY rolname;
