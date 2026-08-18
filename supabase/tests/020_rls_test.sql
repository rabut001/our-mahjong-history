BEGIN;
\ir helpers.inc
SELECT no_plan();
SELECT omh_test.seed_standard();

-- メタ
SELECT ok(
  (SELECT bool_and(c.relrowsecurity)
   FROM pg_class c
   JOIN pg_namespace n ON n.oid = c.relnamespace
   WHERE n.nspname = 'public'
     AND c.relname IN (
       'profiles', 'communities', 'community_memberships', 'community_rules',
       'community_invite_codes', 'tournaments', 'tournament_rules',
       'tournament_participants', 'tournament_point_adjustments',
       'matches', 'match_results', 'activity_logs'
     )),
  'M-01'
);
SELECT ok(
  (SELECT bool_and(cnt >= 1)
   FROM (
     SELECT c.relname, count(p.polname) AS cnt
     FROM pg_class c
     JOIN pg_namespace n ON n.oid = c.relnamespace
     LEFT JOIN pg_policy p ON p.polrelid = c.oid
     WHERE n.nspname = 'public'
       AND c.relname IN (
         'profiles', 'communities', 'community_memberships', 'community_rules',
         'community_invite_codes', 'tournaments', 'tournament_rules',
         'tournament_participants', 'tournament_point_adjustments',
         'matches', 'match_results'
       )
     GROUP BY c.relname
   ) s),
  'M-02'
);
SELECT is(
  (SELECT count(*)::int FROM pg_policy p
   JOIN pg_class c ON c.oid = p.polrelid
   JOIN pg_namespace n ON n.oid = c.relnamespace
   WHERE n.nspname = 'public' AND c.relname = 'activity_logs'),
  0,
  'M-02b'
);
SELECT ok(
  NOT has_table_privilege('anon', 'public.activity_logs', 'SELECT')
  AND NOT has_table_privilege('authenticated', 'public.activity_logs', 'SELECT')
  AND NOT has_table_privilege('anon', 'public.activity_logs', 'INSERT')
  AND NOT has_table_privilege('authenticated', 'public.activity_logs', 'INSERT')
  AND NOT has_table_privilege('anon', 'public.activity_logs', 'UPDATE')
  AND NOT has_table_privilege('authenticated', 'public.activity_logs', 'UPDATE')
  AND NOT has_table_privilege('anon', 'public.activity_logs', 'DELETE')
  AND NOT has_table_privilege('authenticated', 'public.activity_logs', 'DELETE'),
  'M-03'
);
SELECT ok(
  NOT has_function_privilege('anon', 'private.trg_append_activity_log()', 'EXECUTE')
  AND NOT has_function_privilege('authenticated', 'private.trg_append_activity_log()', 'EXECUTE'),
  'M-04'
);
SELECT ok(
  NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'activity_logs' AND column_name = 'community_id'
  )
  AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'community_id'
  )
  AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'match_results' AND column_name = 'community_id'
  ),
  'M-11'
);

-- 未ログイン
SET LOCAL ROLE anon;
SELECT throws_ok('SELECT * FROM public.profiles', '42501', NULL, 'R-anon-profiles');
SELECT throws_ok('SELECT * FROM public.communities', '42501', NULL, 'R-anon-communities');
SELECT throws_ok('SELECT * FROM public.community_memberships', '42501', NULL, 'R-anon-memberships');
SELECT throws_ok('SELECT * FROM public.community_rules', '42501', NULL, 'R-anon-community_rules');
SELECT throws_ok('SELECT * FROM public.community_invite_codes', '42501', NULL, 'R-anon-invite');
SELECT throws_ok('SELECT * FROM public.tournaments', '42501', NULL, 'R-anon-tournaments');
SELECT throws_ok('SELECT * FROM public.tournament_rules', '42501', NULL, 'R-anon-tournament_rules');
SELECT throws_ok('SELECT * FROM public.tournament_participants', '42501', NULL, 'R-anon-participants');
SELECT throws_ok('SELECT * FROM public.tournament_point_adjustments', '42501', NULL, 'R-anon-adjustments');
SELECT throws_ok('SELECT * FROM public.matches', '42501', NULL, 'R-anon-matches');
SELECT throws_ok('SELECT * FROM public.match_results', '42501', NULL, 'R-anon-match_results');
SELECT throws_ok('SELECT * FROM public.activity_logs', '42501', NULL, 'R-anon-logs');
SELECT throws_ok(
  $q$INSERT INTO public.profiles (display_name) VALUES ('anon')$q$,
  '42501', NULL, 'R-anon-profiles insert'
);
SELECT throws_ok(
  $q$INSERT INTO public.communities (name) VALUES ('anon')$q$,
  '42501', NULL, 'R-anon-communities insert'
);
SELECT throws_ok(
  $q$INSERT INTO public.community_memberships (community_id, user_id)
     VALUES ('c0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000001')$q$,
  '42501', NULL, 'R-anon-memberships insert'
);
SELECT throws_ok(
  $q$INSERT INTO public.community_rules (
       community_id, name, player_count, starting_score, return_score,
       oka_tie_handling, uma_enabled, tobi_enabled, yakitori_enabled, rate
     ) VALUES ('c0000000-0000-4000-8000-000000000001', 'anon', 3, 25000, 30000, 'kamicha', false, false, false, 1)$q$,
  '42501', NULL, 'R-anon-community_rules insert'
);
SELECT throws_ok(
  $q$INSERT INTO public.community_invite_codes (community_id, code, expires_at, created_by)
     VALUES ('c0000000-0000-4000-8000-000000000001', 'AAAAAAAAAA', now() + interval '1 day', 'b0000000-0000-4000-8000-000000000001')$q$,
  '42501', NULL, 'R-anon-invite insert'
);
SELECT throws_ok(
  $q$INSERT INTO public.tournaments (community_id, held_on, name)
     VALUES ('c0000000-0000-4000-8000-000000000001', DATE '2026-01-01', 'anon')$q$,
  '42501', NULL, 'R-anon-tournaments insert'
);
SELECT throws_ok(
  $q$INSERT INTO public.tournament_rules (
       tournament_id, name, player_count, starting_score, return_score,
       oka_tie_handling, uma_enabled, tobi_enabled, yakitori_enabled, rate
     ) VALUES ('e0000000-0000-4000-8000-000000000001', 'anon', 3, 25000, 30000, 'kamicha', false, false, false, 1)$q$,
  '42501', NULL, 'R-anon-tournament_rules insert'
);
SELECT throws_ok(
  $q$INSERT INTO public.tournament_participants (tournament_id, guest_display_name)
     VALUES ('e0000000-0000-4000-8000-000000000001', 'anonゲスト')$q$,
  '42501', NULL, 'R-anon-participants insert'
);
SELECT throws_ok(
  $q$INSERT INTO public.tournament_point_adjustments (
       tournament_participant_id, adjustment_points_1, adjustment_points_2, adjustment_points_3,
       adjustment_points_4, adjustment_points_5
     ) VALUES ('11000000-0000-4000-8000-000000000001', 0, 0, 0, 0, 0)$q$,
  '42501', NULL, 'R-anon-adjustments insert'
);
SELECT throws_ok(
  $q$INSERT INTO public.matches (tournament_id, tournament_rule_id)
     VALUES ('e0000000-0000-4000-8000-000000000001', 'f0000000-0000-4000-8000-000000000001')$q$,
  '42501', NULL, 'R-anon-matches insert'
);
SELECT throws_ok(
  $q$INSERT INTO public.match_results (
       match_id, tournament_participant_id, seat, score,
       base_points, uma_points, tobi_points, yakitori_points,
       other_points_1, other_points_2, other_points_3, other_points_4, other_points_5,
       manual_points_1, manual_points_2, manual_points_3, points, rank
     ) VALUES (
       '12000000-0000-4000-8000-000000000001', '11000000-0000-4000-8000-000000000001',
       'east', 25000, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1
     )$q$,
  '42501', NULL, 'R-anon-match_results insert'
);
SELECT throws_ok(
  $q$INSERT INTO public.activity_logs (entity_type, entity_id, action, actor_user_id)
     VALUES ('community', 'c0000000-0000-4000-8000-000000000001', 'insert', 'b0000000-0000-4000-8000-000000000001')$q$,
  '42501', NULL, 'R-anon-logs insert'
);
SELECT ok(
  NOT EXISTS (
    SELECT 1
    FROM unnest(ARRAY[
      'profiles', 'communities', 'community_memberships', 'community_rules',
      'community_invite_codes', 'tournaments', 'tournament_rules',
      'tournament_participants', 'tournament_point_adjustments',
      'matches', 'match_results', 'activity_logs'
    ]) t(rel)
    CROSS JOIN unnest(ARRAY['SELECT', 'INSERT', 'UPDATE', 'DELETE']) p(priv)
    WHERE has_table_privilege('anon', format('public.%s', t.rel), p.priv)
  ),
  'M-05'
);
SELECT throws_ok('SELECT public.create_community(''x'')', '42501', NULL, 'M-05 rpc');
RESET ROLE;

-- profiles
SELECT omh_test.set_auth(omh_test.auth_a());
SET LOCAL ROLE authenticated;
SELECT is((SELECT display_name FROM public.profiles WHERE id = omh_test.profile_a()), 'A', 'R-profiles-01');
SELECT is((SELECT display_name FROM public.profiles WHERE id = omh_test.profile_c()), 'C', 'R-profiles-02');
SELECT is((SELECT count(*)::int FROM public.profiles WHERE id = omh_test.profile_b()), 0, 'R-profiles-03');
SELECT is((SELECT display_name FROM public.profiles WHERE id = omh_test.profile_l()), 'L', 'R-profiles-04');
SELECT is((SELECT display_name FROM public.profiles WHERE id = omh_test.profile_t()), '退会済みユーザ', 'R-profiles-05');
RESET ROLE;
SELECT omh_test.set_auth(omh_test.auth_b());
SET LOCAL ROLE authenticated;
SELECT is((SELECT count(*)::int FROM public.profiles WHERE id = omh_test.profile_a()), 0, 'R-profiles-06');
RESET ROLE;
SELECT omh_test.set_auth(omh_test.auth_a());
SET LOCAL ROLE authenticated;
SELECT lives_ok(
  format($q$UPDATE public.profiles SET display_name = 'A2', comment = 'hi' WHERE id = %L$q$, omh_test.profile_a()),
  'R-profiles-07'
);
SELECT is((SELECT count(*)::int FROM public.profiles WHERE id = omh_test.profile_c() AND display_name = 'hack'), 0, 'R-profiles-08 prep');
UPDATE public.profiles SET display_name = 'hack' WHERE id = omh_test.profile_c();
SELECT is((SELECT display_name FROM public.profiles WHERE id = omh_test.profile_c()), 'C', 'R-profiles-08');
SELECT throws_ok(
  format($q$UPDATE public.profiles SET withdrawn_at = now() WHERE id = %L$q$, omh_test.profile_a()),
  '42501',
  NULL,
  'R-profiles-09'
);
SELECT throws_ok(
  format($q$UPDATE public.profiles SET auth_user_id = NULL WHERE id = %L$q$, omh_test.profile_a()),
  '42501',
  NULL,
  'R-profiles-10'
);
SELECT throws_ok(
  format($q$UPDATE public.profiles SET display_name = '退会済みユーザ' WHERE id = %L$q$, omh_test.profile_a()),
  '23514',
  NULL,
  'R-profiles-11'
);
SELECT throws_ok(
  $q$INSERT INTO public.profiles (auth_user_id, display_name) VALUES ('a0000000-0000-4000-8000-000000000077', 'X')$q$,
  '42501',
  NULL,
  'R-profiles-12'
);
SELECT throws_ok(
  format($q$DELETE FROM public.profiles WHERE id = %L$q$, omh_test.profile_a()),
  '42501',
  NULL,
  'R-profiles-13'
);
RESET ROLE;
SELECT omh_test.set_auth(omh_test.auth_l());
SET LOCAL ROLE authenticated;
SELECT is((SELECT display_name FROM public.profiles WHERE id = omh_test.profile_l()), 'L', 'R-profiles-14 self');
SELECT lives_ok(
  format($q$UPDATE public.profiles SET comment = 'L comment' WHERE id = %L$q$, omh_test.profile_l()),
  'R-profiles-14 update self'
);
SELECT is((SELECT count(*)::int FROM public.profiles WHERE id = omh_test.profile_c()), 0, 'R-profiles-14 C hidden');
SELECT is((SELECT count(*)::int FROM public.profiles WHERE id = omh_test.profile_t()), 0, 'R-profiles-14 T hidden');
RESET ROLE;

-- communities
SELECT omh_test.set_auth(omh_test.auth_a());
SET LOCAL ROLE authenticated;
SELECT is((SELECT array_agg(id ORDER BY id) FROM public.communities), ARRAY[omh_test.community_1()], 'R-communities-01');
RESET ROLE;
SELECT omh_test.set_auth(omh_test.auth_b());
SET LOCAL ROLE authenticated;
SELECT is((SELECT count(*)::int FROM public.communities WHERE id = omh_test.community_1()), 0, 'R-communities-02');
RESET ROLE;
SELECT omh_test.set_auth(omh_test.auth_a());
SET LOCAL ROLE authenticated;
SELECT throws_ok(
  format($q$INSERT INTO public.communities (name) VALUES ('直接')$q$),
  '42501',
  NULL,
  'R-communities-03'
);
RESET ROLE;
SELECT omh_test.set_auth(omh_test.auth_a());
SET LOCAL ROLE authenticated;
SELECT lives_ok(
  format($q$UPDATE public.communities SET name = 'G1b' WHERE id = %L$q$, omh_test.community_1()),
  'R-communities-04'
);
RESET ROLE;
SELECT omh_test.set_auth(omh_test.auth_b());
SET LOCAL ROLE authenticated;
UPDATE public.communities SET name = 'hack' WHERE id = omh_test.community_1();
SELECT is((SELECT name FROM public.communities WHERE id = omh_test.community_2()), 'グループ2', 'R-communities-05 no write to g1');
RESET ROLE;
SELECT is((SELECT name FROM public.communities WHERE id = omh_test.community_1()), 'G1b', 'R-communities-05 unchanged');

INSERT INTO public.communities (id, name) VALUES ('c0000000-0000-4000-8000-0000000000ae', '空A');
INSERT INTO public.community_memberships (community_id, user_id)
VALUES ('c0000000-0000-4000-8000-0000000000ae', omh_test.profile_a());
SELECT omh_test.set_auth(omh_test.auth_a());
SET LOCAL ROLE authenticated;
SELECT lives_ok(
  $q$DELETE FROM public.communities WHERE id = 'c0000000-0000-4000-8000-0000000000ae'$q$,
  'R-communities-06'
);
SELECT throws_ok(
  format($q$DELETE FROM public.communities WHERE id = %L$q$, omh_test.community_1()),
  '23503',
  NULL,
  'R-communities-07'
);
RESET ROLE;
SELECT omh_test.set_auth(omh_test.auth_l());
SET LOCAL ROLE authenticated;
SELECT is((SELECT count(*)::int FROM public.communities WHERE id = omh_test.community_1()), 0, 'R-communities-08');
UPDATE public.communities SET name = 'Lhack' WHERE id = omh_test.community_1();
SELECT is((SELECT count(*)::int FROM public.communities WHERE id = omh_test.community_1()), 0, 'R-communities-08 no update seen');
DELETE FROM public.communities WHERE id = omh_test.community_1();
SELECT is((SELECT count(*)::int FROM public.communities WHERE id = omh_test.community_1()), 0, 'R-communities-08 no delete seen');
RESET ROLE;
SELECT is((SELECT name FROM public.communities WHERE id = omh_test.community_1()), 'G1b', 'R-communities-08 unchanged');

-- memberships
SELECT omh_test.set_auth(omh_test.auth_a());
SET LOCAL ROLE authenticated;
SELECT is(
  (SELECT count(*)::int FROM public.community_memberships WHERE community_id = omh_test.community_1()),
  2,
  'R-memberships-01'
);
RESET ROLE;
SELECT omh_test.set_auth(omh_test.auth_b());
SET LOCAL ROLE authenticated;
SELECT is((SELECT count(*)::int FROM public.community_memberships WHERE community_id = omh_test.community_1()), 0, 'R-memberships-02');
SELECT throws_ok(
  format(
    $q$INSERT INTO public.community_memberships (community_id, user_id) VALUES (%L, %L)$q$,
    omh_test.community_1(),
    omh_test.profile_b()
  ),
  '42501',
  NULL,
  'R-memberships-03'
);
RESET ROLE;
SELECT omh_test.set_auth(omh_test.auth_a());
SET LOCAL ROLE authenticated;
SELECT throws_ok(
  format(
    $q$INSERT INTO public.community_memberships (community_id, user_id) VALUES (%L, %L)$q$,
    omh_test.community_1(),
    omh_test.profile_l()
  ),
  '42501',
  NULL,
  'R-memberships-04'
);
SELECT throws_ok(
  format($q$UPDATE public.community_memberships SET joined_at = now() WHERE community_id = %L$q$, omh_test.community_1()),
  '42501',
  NULL,
  'R-memberships-05'
);
SELECT lives_ok(
  format(
    $q$DELETE FROM public.community_memberships WHERE community_id = %L AND user_id = %L$q$,
    omh_test.community_1(),
    omh_test.profile_c()
  ),
  'R-memberships-06'
);
RESET ROLE;
SELECT is((SELECT count(*)::int FROM public.profiles WHERE id = omh_test.profile_c()), 1, 'R-memberships-06 profile remains');
SELECT is(
  (SELECT count(*)::int FROM public.tournament_participants WHERE id = omh_test.part_c()),
  1,
  'R-memberships-06 participant remains'
);
INSERT INTO public.community_memberships (community_id, user_id)
VALUES (omh_test.community_1(), omh_test.profile_c());
SELECT omh_test.set_auth(omh_test.auth_b());
SET LOCAL ROLE authenticated;
SELECT is(
  (SELECT count(*)::int FROM public.community_memberships
   WHERE community_id = omh_test.community_1() AND user_id = omh_test.profile_a()),
  0,
  'R-memberships-07 cannot see to delete'
);
RESET ROLE;
SELECT omh_test.set_auth(omh_test.auth_a());
SET LOCAL ROLE authenticated;
SELECT lives_ok(
  format(
    $q$DELETE FROM public.community_memberships WHERE community_id = %L AND user_id = %L$q$,
    omh_test.community_1(),
    omh_test.profile_a()
  ),
  'R-memberships-08'
);
RESET ROLE;
INSERT INTO public.community_memberships (community_id, user_id)
VALUES (omh_test.community_1(), omh_test.profile_a());
SELECT omh_test.set_auth(omh_test.auth_l());
SET LOCAL ROLE authenticated;
SELECT is((SELECT count(*)::int FROM public.community_memberships WHERE community_id = omh_test.community_1()), 0, 'R-memberships-09');
RESET ROLE;

-- 配下
SELECT omh_test.set_auth(omh_test.auth_a());
SET LOCAL ROLE authenticated;
SELECT is((SELECT count(*)::int FROM public.community_rules WHERE community_id = omh_test.community_1()) > 0, true, 'R-community_rules-01');
SELECT lives_ok(
  format(
    $q$INSERT INTO public.community_rules (
         id, community_id, name, player_count, starting_score, return_score,
         oka_tie_handling, uma_enabled, tobi_enabled, yakitori_enabled, rate
       ) VALUES ('d0000000-0000-4000-8000-0000000000ae', %L, '追加', 3, 25000, 30000, 'kamicha', false, false, false, 1)$q$,
    omh_test.community_1()
  ),
  'R-community_rules-03 insert'
);
SELECT is(
  (SELECT count(*)::int FROM public.community_rules WHERE id = 'd0000000-0000-4000-8000-0000000000ae'),
  1,
  'R-community_rules-03 inserted'
);
SELECT lives_ok(
  $q$UPDATE public.community_rules SET notes = 'n' WHERE id = 'd0000000-0000-4000-8000-0000000000ae'$q$,
  'R-community_rules-03 update'
);
SELECT is(
  (SELECT notes FROM public.community_rules WHERE id = 'd0000000-0000-4000-8000-0000000000ae'),
  'n',
  'R-community_rules-03 updated'
);
SELECT lives_ok(
  $q$DELETE FROM public.community_rules WHERE id = 'd0000000-0000-4000-8000-0000000000ae'$q$,
  'R-community_rules-03 delete'
);
SELECT is(
  (SELECT count(*)::int FROM public.community_rules WHERE id = 'd0000000-0000-4000-8000-0000000000ae'),
  0,
  'R-community_rules-03 deleted'
);
RESET ROLE;
SELECT omh_test.set_auth(omh_test.auth_b());
SET LOCAL ROLE authenticated;
SELECT is((SELECT count(*)::int FROM public.community_rules WHERE community_id = omh_test.community_1()), 0, 'R-community_rules-02');
SELECT throws_ok(
  format(
    $q$INSERT INTO public.community_rules (
         community_id, name, player_count, starting_score, return_score,
         oka_tie_handling, uma_enabled, tobi_enabled, yakitori_enabled, rate
       ) VALUES (%L, 'B', 3, 25000, 30000, 'kamicha', false, false, false, 1)$q$,
    omh_test.community_1()
  ),
  '42501',
  NULL,
  'R-community_rules-04'
);
RESET ROLE;
SELECT omh_test.set_auth(omh_test.auth_l());
SET LOCAL ROLE authenticated;
SELECT is((SELECT count(*)::int FROM public.community_rules WHERE community_id = omh_test.community_1()), 0, 'R-community_rules-05');
SELECT throws_ok(
  format(
    $q$INSERT INTO public.community_rules (
         community_id, name, player_count, starting_score, return_score,
         oka_tie_handling, uma_enabled, tobi_enabled, yakitori_enabled, rate
       ) VALUES (%L, 'L', 3, 25000, 30000, 'kamicha', false, false, false, 1)$q$,
    omh_test.community_1()
  ),
  '42501',
  NULL,
  'R-community_rules-05 insert'
);
RESET ROLE;

SELECT omh_test.set_auth(omh_test.auth_a());
SET LOCAL ROLE authenticated;
SELECT is((SELECT code FROM public.community_invite_codes WHERE community_id = omh_test.community_1()), 'ABCDEFGHJK', 'R-invite-01');
RESET ROLE;
SELECT omh_test.set_auth(omh_test.auth_b());
SET LOCAL ROLE authenticated;
SELECT is((SELECT count(*)::int FROM public.community_invite_codes), 0, 'R-invite-02');
SELECT is((SELECT count(*)::int FROM public.community_invite_codes WHERE code = 'ABCDEFGHJK'), 0, 'R-invite-03');
SELECT throws_ok(
  format(
    $q$INSERT INTO public.community_invite_codes (community_id, code, expires_at, created_by)
       VALUES (%L, 'BBBBBBBBBB', now() + interval '1 day', %L)$q$,
    omh_test.community_1(), omh_test.profile_b()
  ),
  '42501',
  NULL,
  'R-invite-05'
);
RESET ROLE;
SELECT omh_test.set_auth(omh_test.auth_a());
SET LOCAL ROLE authenticated;
SELECT lives_ok(
  format(
    $q$DELETE FROM public.community_invite_codes WHERE community_id = %L$q$,
    omh_test.community_1()
  ),
  'R-invite-04 delete'
);
SELECT is(
  (SELECT count(*)::int FROM public.community_invite_codes WHERE community_id = omh_test.community_1()),
  0,
  'R-invite-04 deleted'
);
SELECT lives_ok(
  format(
    $q$INSERT INTO public.community_invite_codes (community_id, code, expires_at, created_by)
       VALUES (%L, 'ABCDEFGHJM', now() + interval '1 day', %L)$q$,
    omh_test.community_1(), omh_test.profile_a()
  ),
  'R-invite-04 insert'
);
SELECT is(
  (SELECT code FROM public.community_invite_codes WHERE community_id = omh_test.community_1()),
  'ABCDEFGHJM',
  'R-invite-04 replaced'
);
RESET ROLE;
SELECT omh_test.set_auth(omh_test.auth_l());
SET LOCAL ROLE authenticated;
SELECT is((SELECT count(*)::int FROM public.community_invite_codes), 0, 'R-invite-06');
RESET ROLE;

SELECT omh_test.set_auth(omh_test.auth_a());
SET LOCAL ROLE authenticated;
SELECT is((SELECT count(*)::int FROM public.tournaments WHERE community_id = omh_test.community_1()) > 0, true, 'R-tournaments-01');
SELECT lives_ok(
  $q$INSERT INTO public.tournaments (id, community_id, held_on, name)
     VALUES ('e0000000-0000-4000-8000-0000000000ae', 'c0000000-0000-4000-8000-000000000001', DATE '2026-08-08', 'CRUD大会')$q$,
  'R-tournaments-03 insert'
);
SELECT is(
  (SELECT name FROM public.tournaments WHERE id = 'e0000000-0000-4000-8000-0000000000ae'),
  'CRUD大会',
  'R-tournaments-03 inserted'
);
SELECT lives_ok(
  $q$UPDATE public.tournaments SET memo = 'm' WHERE id = 'e0000000-0000-4000-8000-0000000000ae'$q$,
  'R-tournaments-03 update'
);
SELECT is(
  (SELECT memo FROM public.tournaments WHERE id = 'e0000000-0000-4000-8000-0000000000ae'),
  'm',
  'R-tournaments-03 updated'
);
SELECT lives_ok(
  $q$DELETE FROM public.tournaments WHERE id = 'e0000000-0000-4000-8000-0000000000ae'$q$,
  'R-tournaments-03 delete'
);
SELECT is(
  (SELECT count(*)::int FROM public.tournaments WHERE id = 'e0000000-0000-4000-8000-0000000000ae'),
  0,
  'R-tournaments-03 deleted'
);
RESET ROLE;
SELECT omh_test.set_auth(omh_test.auth_b());
SET LOCAL ROLE authenticated;
SELECT is((SELECT count(*)::int FROM public.tournaments WHERE community_id = omh_test.community_1()), 0, 'R-tournaments-02');
SELECT throws_ok(
  format($q$INSERT INTO public.tournaments (community_id, held_on, name) VALUES (%L, DATE '2026-01-01', 'B')$q$, omh_test.community_1()),
  '42501',
  NULL,
  'R-tournaments-04'
);
RESET ROLE;
SELECT omh_test.set_auth(omh_test.auth_l());
SET LOCAL ROLE authenticated;
SELECT is((SELECT count(*)::int FROM public.tournaments WHERE community_id = omh_test.community_1()), 0, 'R-tournaments-05');
SELECT throws_ok(
  format($q$INSERT INTO public.tournaments (community_id, held_on, name) VALUES (%L, DATE '2026-01-01', 'L')$q$, omh_test.community_1()),
  '42501',
  NULL,
  'R-tournaments-05 insert'
);
RESET ROLE;

SELECT omh_test.set_auth(omh_test.auth_a());
SET LOCAL ROLE authenticated;
SELECT is((SELECT count(*)::int FROM public.tournament_rules WHERE tournament_id = omh_test.tournament_1()) > 0, true, 'R-tournament_rules-01');
SELECT lives_ok(
  format(
    $q$
      INSERT INTO public.tournament_rules (
        id, tournament_id, name, player_count, starting_score, return_score,
        oka_tie_handling, uma_enabled, tobi_enabled, yakitori_enabled, rate
      ) VALUES ('f0000000-0000-4000-8000-0000000000ae', %L, 'CRUD未使用', 3, 25000, 30000, 'kamicha', false, false, false, 1);
    $q$,
    omh_test.tournament_1()
  ),
  'R-tournament_rules-03 insert'
);
SELECT is(
  (SELECT count(*)::int FROM public.tournament_rules WHERE id = 'f0000000-0000-4000-8000-0000000000ae'),
  1,
  'R-tournament_rules-03 inserted'
);
SELECT lives_ok(
  format($q$UPDATE public.tournament_rules SET notes = 'ok' WHERE id = %L$q$, omh_test.t_rule_free()),
  'R-tournament_rules-03 update'
);
SELECT is(
  (SELECT notes FROM public.tournament_rules WHERE id = omh_test.t_rule_free()),
  'ok',
  'R-tournament_rules-03 updated'
);
SELECT lives_ok(
  $q$DELETE FROM public.tournament_rules WHERE id = 'f0000000-0000-4000-8000-0000000000ae'$q$,
  'R-tournament_rules-03 delete'
);
SELECT is(
  (SELECT count(*)::int FROM public.tournament_rules WHERE id = 'f0000000-0000-4000-8000-0000000000ae'),
  0,
  'R-tournament_rules-03 deleted'
);
RESET ROLE;
SELECT omh_test.set_auth(omh_test.auth_b());
SET LOCAL ROLE authenticated;
SELECT is((SELECT count(*)::int FROM public.tournament_rules), 0, 'R-tournament_rules-02');
SELECT throws_ok(
  format(
    $q$INSERT INTO public.tournament_rules (
         tournament_id, name, player_count, starting_score, return_score,
         oka_tie_handling, uma_enabled, tobi_enabled, yakitori_enabled, rate
       ) VALUES (%L, 'B', 3, 25000, 30000, 'kamicha', false, false, false, 1)$q$,
    omh_test.tournament_1()
  ),
  '42501',
  NULL,
  'R-tournament_rules-04'
);
RESET ROLE;
SELECT omh_test.set_auth(omh_test.auth_l());
SET LOCAL ROLE authenticated;
SELECT is((SELECT count(*)::int FROM public.tournament_rules), 0, 'R-tournament_rules-05');
SELECT throws_ok(
  format(
    $q$INSERT INTO public.tournament_rules (
         tournament_id, name, player_count, starting_score, return_score,
         oka_tie_handling, uma_enabled, tobi_enabled, yakitori_enabled, rate
       ) VALUES (%L, 'L', 3, 25000, 30000, 'kamicha', false, false, false, 1)$q$,
    omh_test.tournament_1()
  ),
  '42501',
  NULL,
  'R-tournament_rules-05 insert'
);
RESET ROLE;

SELECT omh_test.set_auth(omh_test.auth_a());
SET LOCAL ROLE authenticated;
SELECT is((SELECT count(*)::int FROM public.tournament_participants WHERE tournament_id = omh_test.tournament_1()), 5, 'R-participants-01');
SELECT lives_ok(
  format($q$INSERT INTO public.tournament_participants (tournament_id, guest_display_name) VALUES (%L, '新ゲスト')$q$, omh_test.tournament_1()),
  'R-participants-03 guest'
);
RESET ROLE;
SELECT omh_test.insert_auth_user('a0000000-0000-4000-8000-00000000000d', 'd@example.com');
SELECT omh_test.insert_active_profile(
  'b0000000-0000-4000-8000-00000000000d',
  'a0000000-0000-4000-8000-00000000000d',
  'D'
);
INSERT INTO public.community_memberships (community_id, user_id)
VALUES (omh_test.community_1(), 'b0000000-0000-4000-8000-00000000000d');
SELECT omh_test.set_auth(omh_test.auth_a());
SET LOCAL ROLE authenticated;
SELECT lives_ok(
  $q$INSERT INTO public.tournament_participants (tournament_id, user_id)
     VALUES ('e0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-00000000000d')$q$,
  'R-participants-03 member'
);
SELECT is(
  (SELECT count(*)::int FROM public.tournament_participants
   WHERE tournament_id = omh_test.tournament_1()
     AND user_id = 'b0000000-0000-4000-8000-00000000000d'),
  1,
  'R-participants-03 member inserted'
);
SELECT throws_ok(
  format($q$INSERT INTO public.tournament_participants (tournament_id, user_id) VALUES (%L, %L)$q$, omh_test.tournament_1(), omh_test.profile_b()),
  'P0001',
  NULL,
  'R-participants-06'
);
SELECT throws_ok(
  format($q$UPDATE public.tournament_rules SET notes = 'used' WHERE id = %L$q$, omh_test.t_rule_used()),
  'P0001',
  NULL,
  'R-participants-07'
);
RESET ROLE;
SELECT omh_test.set_auth(omh_test.auth_b());
SET LOCAL ROLE authenticated;
SELECT is((SELECT count(*)::int FROM public.tournament_participants), 0, 'R-participants-02');
SELECT throws_ok(
  format($q$INSERT INTO public.tournament_participants (tournament_id, guest_display_name) VALUES (%L, 'Bゲスト')$q$, omh_test.tournament_1()),
  '42501',
  NULL,
  'R-participants-04'
);
RESET ROLE;
SELECT omh_test.set_auth(omh_test.auth_l());
SET LOCAL ROLE authenticated;
SELECT is((SELECT count(*)::int FROM public.tournament_participants), 0, 'R-participants-05');
SELECT throws_ok(
  format($q$INSERT INTO public.tournament_participants (tournament_id, guest_display_name) VALUES (%L, 'Lゲスト')$q$, omh_test.tournament_1()),
  '42501',
  NULL,
  'R-participants-05 insert'
);
RESET ROLE;

SELECT omh_test.set_auth(omh_test.auth_a());
SET LOCAL ROLE authenticated;
SELECT is((SELECT count(*)::int FROM public.tournament_point_adjustments) > 0, true, 'R-adjustments-01');
SELECT lives_ok(
  format(
    $q$INSERT INTO public.tournament_point_adjustments (
         tournament_participant_id, adjustment_points_1, adjustment_points_2, adjustment_points_3,
         adjustment_points_4, adjustment_points_5
       ) VALUES (%L, 0, 0, 0, 0, 0)$q$,
    omh_test.part_guest()
  ),
  'R-adjustments-03 insert'
);
SELECT is(
  (SELECT count(*)::int FROM public.tournament_point_adjustments WHERE tournament_participant_id = omh_test.part_guest()),
  1,
  'R-adjustments-03 inserted'
);
SELECT lives_ok(
  format(
    $q$UPDATE public.tournament_point_adjustments SET adjustment_points_1 = 2 WHERE tournament_participant_id = %L$q$,
    omh_test.part_guest()
  ),
  'R-adjustments-03 update'
);
SELECT is(
  (SELECT adjustment_points_1 FROM public.tournament_point_adjustments WHERE tournament_participant_id = omh_test.part_guest()),
  2::numeric,
  'R-adjustments-03 updated'
);
SELECT lives_ok(
  format(
    $q$DELETE FROM public.tournament_point_adjustments WHERE tournament_participant_id = %L$q$,
    omh_test.part_guest()
  ),
  'R-adjustments-03 delete'
);
SELECT is(
  (SELECT count(*)::int FROM public.tournament_point_adjustments WHERE tournament_participant_id = omh_test.part_guest()),
  0,
  'R-adjustments-03 deleted'
);
RESET ROLE;
SELECT omh_test.set_auth(omh_test.auth_b());
SET LOCAL ROLE authenticated;
SELECT is((SELECT count(*)::int FROM public.tournament_point_adjustments), 0, 'R-adjustments-02');
SELECT throws_ok(
  format(
    $q$INSERT INTO public.tournament_point_adjustments (
         tournament_participant_id, adjustment_points_1, adjustment_points_2, adjustment_points_3,
         adjustment_points_4, adjustment_points_5
       ) VALUES (%L, 0, 0, 0, 0, 0)$q$,
    omh_test.part_a()
  ),
  '42501',
  NULL,
  'R-adjustments-04'
);
RESET ROLE;
SELECT omh_test.set_auth(omh_test.auth_l());
SET LOCAL ROLE authenticated;
SELECT is((SELECT count(*)::int FROM public.tournament_point_adjustments), 0, 'R-adjustments-05');
SELECT throws_ok(
  format(
    $q$INSERT INTO public.tournament_point_adjustments (
         tournament_participant_id, adjustment_points_1, adjustment_points_2, adjustment_points_3,
         adjustment_points_4, adjustment_points_5
       ) VALUES (%L, 0, 0, 0, 0, 0)$q$,
    omh_test.part_a()
  ),
  '42501',
  NULL,
  'R-adjustments-05 insert'
);
RESET ROLE;

SELECT omh_test.set_auth(omh_test.auth_a());
SET LOCAL ROLE authenticated;
SELECT is((SELECT count(*)::int FROM public.matches WHERE tournament_id = omh_test.tournament_1()) > 0, true, 'R-matches-01');
SELECT lives_ok(
  $q$INSERT INTO public.matches (id, tournament_id, tournament_rule_id)
     VALUES ('12000000-0000-4000-8000-0000000000ae', 'e0000000-0000-4000-8000-000000000001', 'f0000000-0000-4000-8000-000000000001')$q$,
  'R-matches-03 insert'
);
SELECT is(
  (SELECT count(*)::int FROM public.matches WHERE id = '12000000-0000-4000-8000-0000000000ae'),
  1,
  'R-matches-03 inserted'
);
SELECT lives_ok(
  $q$UPDATE public.matches SET comment = 'c' WHERE id = '12000000-0000-4000-8000-0000000000ae'$q$,
  'R-matches-03 update'
);
SELECT is(
  (SELECT comment FROM public.matches WHERE id = '12000000-0000-4000-8000-0000000000ae'),
  'c',
  'R-matches-03 updated'
);
SELECT lives_ok(
  $q$DELETE FROM public.matches WHERE id = '12000000-0000-4000-8000-0000000000ae'$q$,
  'R-matches-03 delete'
);
SELECT is(
  (SELECT count(*)::int FROM public.matches WHERE id = '12000000-0000-4000-8000-0000000000ae'),
  0,
  'R-matches-03 deleted'
);
RESET ROLE;
SELECT omh_test.set_auth(omh_test.auth_b());
SET LOCAL ROLE authenticated;
SELECT is((SELECT count(*)::int FROM public.matches), 0, 'R-matches-02');
SELECT throws_ok(
  format($q$INSERT INTO public.matches (tournament_id, tournament_rule_id) VALUES (%L, %L)$q$, omh_test.tournament_1(), omh_test.t_rule_used()),
  '42501',
  NULL,
  'R-matches-04'
);
RESET ROLE;
SELECT omh_test.set_auth(omh_test.auth_l());
SET LOCAL ROLE authenticated;
SELECT is((SELECT count(*)::int FROM public.matches), 0, 'R-matches-05');
SELECT throws_ok(
  format($q$INSERT INTO public.matches (tournament_id, tournament_rule_id) VALUES (%L, %L)$q$, omh_test.tournament_1(), omh_test.t_rule_used()),
  '42501',
  NULL,
  'R-matches-05 insert'
);
RESET ROLE;

SELECT omh_test.set_auth(omh_test.auth_a());
SET LOCAL ROLE authenticated;
SELECT is((SELECT count(*)::int FROM public.match_results WHERE match_id = omh_test.match_1()) > 0, true, 'R-match_results-01');
SELECT lives_ok(
  $q$INSERT INTO public.matches (id, tournament_id, tournament_rule_id)
     VALUES ('12000000-0000-4000-8000-0000000000af', 'e0000000-0000-4000-8000-000000000001', 'f0000000-0000-4000-8000-000000000001')$q$,
  'R-match_results-03 match'
);
SELECT lives_ok(
  $q$SELECT omh_test.insert_match_result(
       '13000000-0000-4000-8000-0000000000af',
       '12000000-0000-4000-8000-0000000000af',
       '11000000-0000-4000-8000-000000000001',
       'east',
       25000,
       1
     )$q$,
  'R-match_results-03 insert'
);
SELECT is(
  (SELECT score FROM public.match_results WHERE id = '13000000-0000-4000-8000-0000000000af'),
  25000,
  'R-match_results-03 inserted'
);
SELECT lives_ok(
  $q$UPDATE public.match_results SET score = 3 WHERE id = '13000000-0000-4000-8000-0000000000af'$q$,
  'R-match_results-03 update'
);
SELECT is(
  (SELECT score FROM public.match_results WHERE id = '13000000-0000-4000-8000-0000000000af'),
  3,
  'R-match_results-03 updated'
);
SELECT lives_ok(
  $q$DELETE FROM public.match_results WHERE id = '13000000-0000-4000-8000-0000000000af'$q$,
  'R-match_results-03 delete'
);
SELECT is(
  (SELECT count(*)::int FROM public.match_results WHERE id = '13000000-0000-4000-8000-0000000000af'),
  0,
  'R-match_results-03 deleted'
);
SELECT lives_ok(
  $q$DELETE FROM public.matches WHERE id = '12000000-0000-4000-8000-0000000000af'$q$,
  'R-match_results-03 cleanup match'
);
UPDATE public.match_results SET score = 3 WHERE match_id = omh_test.match_1() AND tournament_participant_id = omh_test.part_a();
RESET ROLE;
SELECT omh_test.set_auth(omh_test.auth_b());
SET LOCAL ROLE authenticated;
SELECT is((SELECT count(*)::int FROM public.match_results), 0, 'R-match_results-02');
SELECT lives_ok(
  format($q$UPDATE public.match_results SET score = 9 WHERE match_id = %L$q$, omh_test.match_1()),
  'R-match_results-04'
);
RESET ROLE;
SELECT is((SELECT score FROM public.match_results WHERE match_id = omh_test.match_1() AND tournament_participant_id = omh_test.part_a()), 3, 'R-match_results-04 unchanged');
SELECT omh_test.set_auth(omh_test.auth_l());
SET LOCAL ROLE authenticated;
SELECT is((SELECT count(*)::int FROM public.match_results), 0, 'R-match_results-05');
SELECT throws_ok(
  $q$SELECT omh_test.insert_match_result(
       '13000000-0000-4000-8000-0000000000ee',
       '12000000-0000-4000-8000-000000000001',
       '11000000-0000-4000-8000-000000000001',
       'east',
       25000,
       1
     )$q$,
  '42501',
  NULL,
  'R-match_results-05 insert'
);
RESET ROLE;

-- logs
SELECT omh_test.set_auth(omh_test.auth_a());
SET LOCAL ROLE authenticated;
SELECT throws_ok('SELECT * FROM public.activity_logs', '42501', NULL, 'R-logs-01');
SELECT throws_ok(
  format(
    $q$INSERT INTO public.activity_logs (entity_type, entity_id, action, actor_user_id)
       VALUES ('community', %L, 'insert', %L)$q$,
    omh_test.community_1(), omh_test.profile_a()
  ),
  '42501',
  NULL,
  'R-logs-03'
);
SELECT throws_ok(
  format(
    $q$INSERT INTO public.activity_logs (entity_type, entity_id, action, actor_user_id)
       VALUES ('community', %L, 'insert', %L)$q$,
    omh_test.community_1(), omh_test.profile_c()
  ),
  '42501',
  NULL,
  'R-logs-04'
);
SELECT throws_ok('UPDATE public.activity_logs SET entity_type = ''x''', '42501', NULL, 'R-logs-05');
SELECT throws_ok('DELETE FROM public.activity_logs', '42501', NULL, 'R-logs-05 delete');
RESET ROLE;
SELECT omh_test.set_auth(omh_test.auth_b());
SET LOCAL ROLE authenticated;
SELECT throws_ok('SELECT * FROM public.activity_logs', '42501', NULL, 'R-logs-02');
RESET ROLE;
SET LOCAL ROLE service_role;
SELECT lives_ok('SELECT * FROM public.activity_logs', 'R-logs-06');
SELECT cmp_ok((SELECT count(*)::int FROM public.activity_logs), '>', 0, 'R-logs-06 nonempty');
RESET ROLE;

SELECT * FROM finish();
ROLLBACK;
