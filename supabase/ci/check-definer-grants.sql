-- public/private の SECURITY DEFINER に対する anon / authenticated の EXECUTE。
-- supabase db advisors の 0028/0029 は pgrst.db_schemas 依存で、CLI 接続では空になり見逃す。
-- 除外は omh.advisor_0029_allow（関数名、カンマ区切り）。anon は除外しない。

do $$
declare
  allowed text[] := coalesce(
    string_to_array(nullif(current_setting('omh.advisor_0029_allow', true), ''), ','),
    '{}'::text[]
  );
  rec record;
  problems text[] := '{}';
  found int := 0;
  qual text;
begin
  for rec in
    select n.nspname as schema_name,
           p.proname as function_name,
           pg_catalog.pg_get_function_identity_arguments(p.oid) as args,
           pg_catalog.has_function_privilege('anon', p.oid, 'EXECUTE') as anon_exec,
           pg_catalog.has_function_privilege('authenticated', p.oid, 'EXECUTE') as auth_exec
    from pg_catalog.pg_proc p
    join pg_catalog.pg_namespace n on n.oid = p.pronamespace
    join pg_catalog.pg_language l on l.oid = p.prolang
    where n.nspname in ('public', 'private')
      and p.prosecdef
      and l.lanname in ('sql', 'plpgsql')
      and p.prorettype <> 'trigger'::regtype
    order by 1, 2
  loop
    found := found + 1;
    qual := format('%s.%s(%s)', rec.schema_name, rec.function_name, rec.args);
    if rec.anon_exec then
      problems := problems || format('%s: anon が DEFINER を EXECUTE できる', qual);
    end if;
    if rec.auth_exec and rec.function_name <> all (allowed) then
      problems := problems || format(
        '%s: authenticated が DEFINER を EXECUTE できる（0029 許可リスト外）',
        qual
      );
    end if;
  end loop;

  if found = 0 then
    raise notice 'check-definer-grants: SECURITY DEFINER がまだ無いのでスキップ';
    return;
  end if;

  if cardinality(problems) > 0 then
    raise exception '%', array_to_string(problems, E'\n');
  end if;

  raise notice 'check-definer-grants: % 件 OK', found;
end
$$;
