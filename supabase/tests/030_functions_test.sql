BEGIN;
\ir helpers.inc
SELECT no_plan();
SELECT omh_test.seed_standard();

SELECT ok(
  (SELECT bool_and(prosecdef AND array_to_string(proconfig, ',') LIKE '%search_path=%')
   FROM pg_proc p
   JOIN pg_namespace n ON n.oid = p.pronamespace
   WHERE (n.nspname = 'private' AND p.proname IN ('is_community_member', 'trg_append_activity_log'))
      OR (n.nspname = 'public' AND p.proname IN (
        'create_community', 'join_community', 'leave_community', 'withdraw_account'
      ))),
  'M-06'
);
SELECT ok(
  NOT has_function_privilege('anon', 'public.create_community(text,text)', 'EXECUTE')
  AND NOT has_function_privilege('anon', 'public.join_community(text)', 'EXECUTE')
  AND NOT has_function_privilege('anon', 'public.leave_community(uuid)', 'EXECUTE')
  AND NOT has_function_privilege('anon', 'public.withdraw_account()', 'EXECUTE'),
  'M-07'
);
SELECT ok(
  has_function_privilege('authenticated', 'public.create_community(text,text)', 'EXECUTE')
  AND has_function_privilege('authenticated', 'public.join_community(text)', 'EXECUTE')
  AND has_function_privilege('authenticated', 'public.leave_community(uuid)', 'EXECUTE')
  AND has_function_privilege('authenticated', 'public.withdraw_account()', 'EXECUTE'),
  'M-08'
);
SELECT ok(
  NOT has_function_privilege('anon', 'private.is_community_member(uuid)', 'EXECUTE'),
  'M-09'
);
SELECT ok(
  has_function_privilege('authenticated', 'private.is_community_member(uuid)', 'EXECUTE'),
  'M-09b'
);
SELECT ok(
  NOT EXISTS (
    SELECT 1
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    JOIN unnest(COALESCE(p.proargnames, '{}')) a ON true
    WHERE n.nspname IN ('public', 'private')
      AND p.proname IN ('create_community', 'join_community', 'leave_community', 'withdraw_account', 'is_community_member')
      AND lower(a) IN ('user_id', 'auth_user_id', 'uid', 'p_user_id', 'p_auth_user_id', 'p_uid')
  )
  AND EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'private' AND p.proname = 'is_community_member' AND p.prosrc ~* 'auth\.uid\s*\('
  )
  AND (
    SELECT bool_and(p.prosrc ~* 'auth\.uid\s*\(')
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname IN ('create_community', 'join_community', 'leave_community', 'withdraw_account')
  ),
  'M-10'
);

SELECT omh_test.set_auth(omh_test.auth_a());
SET LOCAL ROLE authenticated;
SELECT is(
  private.is_community_member(omh_test.community_1()),
  true,
  'F-helper-01'
);
RESET ROLE;
SELECT omh_test.set_auth(omh_test.auth_b());
SET LOCAL ROLE authenticated;
SELECT is(private.is_community_member(omh_test.community_1()), false, 'F-helper-02');
RESET ROLE;
SELECT omh_test.set_auth(omh_test.auth_l());
SET LOCAL ROLE authenticated;
SELECT is(private.is_community_member(omh_test.community_1()), false, 'F-helper-03');
RESET ROLE;

SELECT omh_test.set_auth(omh_test.auth_a());
SET LOCAL ROLE authenticated;
CREATE TEMP TABLE omh_created_community ON COMMIT DROP AS
SELECT public.create_community('新規グループ') AS id;
SELECT is(
  (SELECT id FROM omh_created_community),
  (SELECT id FROM public.communities WHERE name = '新規グループ'),
  'F-create-01'
);
SELECT is(
  (SELECT count(*)::int FROM public.community_memberships m
   JOIN public.communities c ON c.id = m.community_id
   WHERE c.name = '新規グループ'),
  1,
  'F-create-01 sole member'
);
SELECT throws_ok(
  $q$INSERT INTO public.communities (name) VALUES ('直接')$q$,
  '42501',
  NULL,
  'F-create-03'
);
RESET ROLE;
SET LOCAL ROLE anon;
SELECT throws_ok($q$SELECT public.create_community('x')$q$, '42501', NULL, 'F-create-02');
RESET ROLE;

SELECT omh_test.set_auth(omh_test.auth_a());
SET LOCAL ROLE authenticated;
SELECT is(
  (SELECT count(*)::int FROM public.community_memberships
   WHERE community_id = (
     SELECT id FROM public.communities WHERE name = '新規グループ'
   ) AND user_id = omh_test.profile_a()),
  1,
  'F-create-04'
);
RESET ROLE;

SELECT omh_test.set_auth(omh_test.auth_b());
SET LOCAL ROLE authenticated;
SELECT is(
  public.join_community('ABCDEFGHJK'),
  omh_test.community_1(),
  'F-join-01'
);
SELECT is(
  public.join_community('ABCDEFGHJK'),
  omh_test.community_1(),
  'F-join-02'
);
SELECT is(
  (SELECT count(*)::int FROM public.community_memberships
   WHERE community_id = omh_test.community_1() AND user_id = omh_test.profile_b()),
  1,
  'F-join-02 no extra row'
);
SELECT throws_ok($q$SELECT public.join_community('ZZZZZZZZZZ')$q$, 'P0002', NULL, 'F-join-04');
SELECT throws_ok($q$SELECT public.join_community('short')$q$, 'P0002', NULL, 'F-join-05');
SELECT is(
  public.join_community('abcdefghjk'),
  omh_test.community_1(),
  'F-join-06 lower'
);
RESET ROLE;
INSERT INTO public.communities (id, name) VALUES ('c0000000-0000-4000-8000-0000000000e6', '別名');
INSERT INTO public.community_memberships (community_id, user_id)
VALUES ('c0000000-0000-4000-8000-0000000000e6', omh_test.profile_a());
INSERT INTO public.community_invite_codes (community_id, code, expires_at, created_by)
VALUES (
  'c0000000-0000-4000-8000-0000000000e6',
  '01CDEFGHJK',
  now() + interval '7 days',
  omh_test.profile_a()
);
SELECT omh_test.set_auth(omh_test.auth_b());
SET LOCAL ROLE authenticated;
SELECT is(
  public.join_community('oicdefghjk'),
  'c0000000-0000-4000-8000-0000000000e6'::uuid,
  'F-join-06 aliases'
);
SELECT throws_ok(
  format(
    $q$INSERT INTO public.community_memberships (community_id, user_id) VALUES (%L, %L)$q$,
    omh_test.community_1(),
    omh_test.profile_b()
  ),
  '42501',
  NULL,
  'F-join-08'
);
RESET ROLE;
SET LOCAL ROLE anon;
SELECT throws_ok($q$SELECT public.join_community('ABCDEFGHJK')$q$, '42501', NULL, 'F-join-07');
RESET ROLE;

RESET ROLE;
INSERT INTO public.communities (id, name) VALUES ('c0000000-0000-4000-8000-0000000000e3', '期限当日');
INSERT INTO public.community_memberships (community_id, user_id)
VALUES ('c0000000-0000-4000-8000-0000000000e3', omh_test.profile_a());
INSERT INTO public.community_invite_codes (community_id, code, expires_at, created_by)
VALUES (
  'c0000000-0000-4000-8000-0000000000e3',
  'T0DAY12345',
  ((timezone('Asia/Tokyo', now()))::date + time '00:00:00') AT TIME ZONE 'Asia/Tokyo',
  omh_test.profile_a()
);
INSERT INTO public.communities (id, name) VALUES ('c0000000-0000-4000-8000-0000000000e9', '期限切れ');
INSERT INTO public.community_memberships (community_id, user_id)
VALUES ('c0000000-0000-4000-8000-0000000000e9', omh_test.profile_a());
INSERT INTO public.community_invite_codes (community_id, code, expires_at, created_by)
VALUES (
  'c0000000-0000-4000-8000-0000000000e9',
  'XPRD000001',
  now() - interval '2 days',
  omh_test.profile_a()
);

SELECT omh_test.set_auth(omh_test.auth_b());
SET LOCAL ROLE authenticated;
SELECT is(
  public.join_community('T0DAY12345'),
  'c0000000-0000-4000-8000-0000000000e3'::uuid,
  'F-join-03'
);
SELECT throws_ok($q$SELECT public.join_community('XPRD000001')$q$, 'P0002', NULL, 'F-join-09');
RESET ROLE;

SELECT omh_test.set_auth(omh_test.auth_a());
SET LOCAL ROLE authenticated;
SELECT lives_ok(
  format($q$SELECT public.leave_community(%L)$q$, omh_test.community_1()),
  'F-leave-01'
);
RESET ROLE;
SELECT is(
  (SELECT count(*)::int FROM public.community_memberships
   WHERE community_id = omh_test.community_1() AND user_id = omh_test.profile_a()),
  0,
  'F-leave-01 A gone'
);
SELECT is((SELECT count(*)::int FROM public.communities WHERE id = omh_test.community_1()), 1, 'F-leave-01 community remains');
SELECT omh_test.set_auth(omh_test.auth_a());
SET LOCAL ROLE authenticated;
SELECT is(
  (SELECT count(*)::int FROM public.tournaments WHERE community_id = omh_test.community_1()),
  0,
  'F-leave-01 cannot read'
);
RESET ROLE;
INSERT INTO public.community_memberships (community_id, user_id)
VALUES (omh_test.community_1(), omh_test.profile_a());

RESET ROLE;
DELETE FROM public.community_memberships
WHERE community_id = omh_test.community_1() AND user_id = omh_test.profile_b();
SELECT omh_test.set_auth(omh_test.auth_b());
SET LOCAL ROLE authenticated;
SELECT throws_ok(
  format($q$SELECT public.leave_community(%L)$q$, omh_test.community_1()),
  'P0002',
  NULL,
  'F-leave-03'
);
SELECT is(
  (SELECT count(*)::int FROM public.community_memberships WHERE user_id = omh_test.profile_b() AND community_id = omh_test.community_2()),
  1,
  'F-leave-05 B remains in own group'
);
RESET ROLE;
SELECT omh_test.set_auth(omh_test.auth_a());
SET LOCAL ROLE authenticated;
SELECT throws_ok(
  format($q$SELECT public.leave_community(%L)$q$, omh_test.community_2()),
  'P0002',
  NULL,
  'F-leave-05 A cannot remove B'
);
RESET ROLE;
SET LOCAL ROLE anon;
SELECT throws_ok(
  format($q$SELECT public.leave_community(%L)$q$, omh_test.community_1()),
  '42501',
  NULL,
  'F-leave-04'
);
RESET ROLE;

DELETE FROM public.community_memberships
WHERE community_id = omh_test.community_1() AND user_id = omh_test.profile_c();
SELECT omh_test.set_auth(omh_test.auth_a());
SET LOCAL ROLE authenticated;
SELECT lives_ok(
  format($q$SELECT public.leave_community(%L)$q$, omh_test.community_1()),
  'F-leave-02'
);
RESET ROLE;
SELECT is((SELECT count(*)::int FROM public.communities WHERE id = omh_test.community_1()), 0, 'F-leave-02 gone');

-- withdraw: 新しいグループで C を残す
INSERT INTO public.communities (id, name) VALUES ('c0000000-0000-4000-8000-0000000000d1', '退会用');
INSERT INTO public.community_memberships (community_id, user_id) VALUES
  ('c0000000-0000-4000-8000-0000000000d1', omh_test.profile_a()),
  ('c0000000-0000-4000-8000-0000000000d1', omh_test.profile_c());
INSERT INTO public.tournaments (id, community_id, held_on, name)
VALUES ('e0000000-0000-4000-8000-0000000000d1', 'c0000000-0000-4000-8000-0000000000d1', DATE '2026-08-01', '退会大会');
INSERT INTO public.tournament_participants (tournament_id, user_id)
VALUES ('e0000000-0000-4000-8000-0000000000d1', omh_test.profile_a());
UPDATE public.profiles
SET comment = '残すな', avatar_url = 'https://example.com/a.png'
WHERE id = omh_test.profile_a();

SELECT omh_test.set_auth(omh_test.auth_a());
SET LOCAL ROLE authenticated;
SELECT lives_ok($q$SELECT public.withdraw_account()$q$, 'F-withdraw-01');
RESET ROLE;
SELECT is((SELECT display_name FROM public.profiles WHERE id = omh_test.profile_a()), '退会済みユーザ', 'F-withdraw-01 name');
SELECT is((SELECT auth_user_id FROM public.profiles WHERE id = omh_test.profile_a()), NULL, 'F-withdraw-01 auth');
SELECT isnt((SELECT withdrawn_at FROM public.profiles WHERE id = omh_test.profile_a()), NULL, 'F-withdraw-01 withdrawn_at');
SELECT is((SELECT comment FROM public.profiles WHERE id = omh_test.profile_a()), NULL, 'F-withdraw-01 comment');
SELECT is((SELECT avatar_url FROM public.profiles WHERE id = omh_test.profile_a()), NULL, 'F-withdraw-01 avatar');
SELECT is(
  (SELECT count(*)::int FROM public.community_memberships WHERE user_id = omh_test.profile_a()),
  0,
  'F-withdraw-01 memberships gone'
);
SELECT is(
  (SELECT user_id FROM public.tournament_participants WHERE tournament_id = 'e0000000-0000-4000-8000-0000000000d1' LIMIT 1),
  omh_test.profile_a(),
  'F-withdraw-01 participant remains'
);
SELECT omh_test.set_auth(omh_test.auth_c());
SET LOCAL ROLE authenticated;
SELECT is(
  (SELECT display_name FROM public.profiles WHERE id = omh_test.profile_a()),
  '退会済みユーザ',
  'F-withdraw-01 C can read tombstone'
);
RESET ROLE;
SELECT is((SELECT count(*)::int FROM auth.users WHERE id = omh_test.auth_a()), 1, 'F-withdraw-06 auth remains');

INSERT INTO public.communities (id, name) VALUES ('c0000000-0000-4000-8000-0000000000d2', '最後退会');
INSERT INTO public.community_memberships (community_id, user_id)
VALUES ('c0000000-0000-4000-8000-0000000000d2', omh_test.profile_c());
SELECT omh_test.set_auth(omh_test.auth_c());
SET LOCAL ROLE authenticated;
SELECT lives_ok($q$SELECT public.withdraw_account()$q$, 'F-withdraw-02');
RESET ROLE;
SELECT is((SELECT count(*)::int FROM public.communities WHERE id = 'c0000000-0000-4000-8000-0000000000d2'), 0, 'F-withdraw-02 group gone');

-- F-withdraw-03: B はグループ2のみ。もう一人のグループを足して最後の1人だけ消える
INSERT INTO public.communities (id, name) VALUES
  ('c0000000-0000-4000-8000-0000000000d3', 'B共有'),
  ('c0000000-0000-4000-8000-0000000000d4', 'B一人');
INSERT INTO public.community_memberships (community_id, user_id) VALUES
  ('c0000000-0000-4000-8000-0000000000d3', omh_test.profile_b()),
  ('c0000000-0000-4000-8000-0000000000d3', omh_test.profile_l()),
  ('c0000000-0000-4000-8000-0000000000d4', omh_test.profile_b());
SELECT omh_test.set_auth(omh_test.auth_b());
SET LOCAL ROLE authenticated;
SELECT lives_ok($q$SELECT public.withdraw_account()$q$, 'F-withdraw-03');
RESET ROLE;
SELECT is((SELECT count(*)::int FROM public.communities WHERE id = 'c0000000-0000-4000-8000-0000000000d3'), 1, 'F-withdraw-03 shared remains');
SELECT is((SELECT count(*)::int FROM public.communities WHERE id = 'c0000000-0000-4000-8000-0000000000d4'), 0, 'F-withdraw-03 solo gone');

SET LOCAL ROLE anon;
SELECT throws_ok($q$SELECT public.withdraw_account()$q$, '42501', NULL, 'F-withdraw-04');
RESET ROLE;

-- F-withdraw-05 直接 UPDATE（利用中の L）
SELECT omh_test.set_auth(omh_test.auth_l());
SET LOCAL ROLE authenticated;
SELECT throws_ok(
  format($q$UPDATE public.profiles SET withdrawn_at = now(), auth_user_id = NULL, display_name = '退会済みユーザ' WHERE id = %L$q$, omh_test.profile_l()),
  '42501',
  NULL,
  'F-withdraw-05'
);
RESET ROLE;

SELECT * FROM finish();
ROLLBACK;
