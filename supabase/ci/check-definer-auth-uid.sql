-- public / private の SECURITY DEFINER（sql / plpgsql）をすべて検査。
-- 除外は omh.auth_uid_exclude（schema.function または function。空なら除外なし）。
-- 対象が 0 件なら NOTICE して終了（成功）。

do $$
declare
  excluded text[] := coalesce(
    string_to_array(nullif(current_setting('omh.auth_uid_exclude', true), ''), ','),
    '{}'::text[]
  );
  forbidden text[] := string_to_array(current_setting('omh.forbidden_arg_names', true), ',');
  rec record;
  found int := 0;
  bad_args text[];
  problems text[] := '{}';
  src text;
  qual text;
begin
  if forbidden is null or cardinality(forbidden) = 0 then
    raise exception 'omh.forbidden_arg_names is empty';
  end if;

  for rec in
    select n.nspname as schema_name,
           p.proname as function_name,
           p.prosrc as source,
           coalesce(p.proargnames, '{}'::text[]) as arg_names
    from pg_catalog.pg_proc p
    join pg_catalog.pg_namespace n on n.oid = p.pronamespace
    join pg_catalog.pg_language l on l.oid = p.prolang
    where n.nspname in ('public', 'private')
      and p.prosecdef
      and l.lanname in ('sql', 'plpgsql')
      and not p.prorettype = 'trigger'::regtype
    order by 1, 2
  loop
    qual := rec.schema_name || '.' || rec.function_name;
    if rec.function_name = any (excluded) or qual = any (excluded) then
      continue;
    end if;

    found := found + 1;
    src := rec.source;
    bad_args := array(
      select a
      from unnest(rec.arg_names) as a
      where lower(a) = any (select lower(x) from unnest(forbidden) as x)
    );
    if cardinality(bad_args) > 0 then
      problems := problems || format(
        '%s: ユーザー ID の引数は禁止です (%s)',
        qual,
        array_to_string(bad_args, ', ')
      );
    end if;
    if src is null or src !~* 'auth\.uid\s*\(' then
      problems := problems || format(
        '%s: 本体で auth.uid() を使っていません',
        qual
      );
    end if;
  end loop;

  if found = 0 then
    raise notice 'check-definer-auth-uid: SECURITY DEFINER がまだ無いのでスキップ';
    return;
  end if;

  if cardinality(problems) > 0 then
    raise exception '%', array_to_string(problems, E'\n');
  end if;

  raise notice 'check-definer-auth-uid: % 件 OK', found;
end
$$;
