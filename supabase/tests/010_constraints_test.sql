BEGIN;
\ir helpers.inc
SELECT no_plan();
SELECT omh_test.seed_standard();

-- C-profiles
SELECT throws_ok(
  format(
    $q$INSERT INTO public.profiles (auth_user_id, display_name) VALUES (%L, 'dup')$q$,
    omh_test.auth_a()
  ),
  '23505',
  NULL,
  'C-profiles-01'
);
SELECT throws_ok(
  $q$INSERT INTO public.profiles (auth_user_id, display_name) VALUES (NULL, 'x')$q$,
  '23514',
  NULL,
  'C-profiles-02 null auth'
);
SELECT omh_test.insert_auth_user('a0000000-0000-4000-8000-000000000099', 'p02@example.com');
SELECT throws_ok(
  format(
    $q$INSERT INTO public.profiles (auth_user_id, display_name, withdrawn_at) VALUES (%L, 'x', now())$q$,
    'a0000000-0000-4000-8000-000000000099'
  ),
  '23514',
  NULL,
  'C-profiles-02 withdrawn while active-shaped'
);
SELECT omh_test.insert_auth_user('a0000000-0000-4000-8000-000000000098', 'p03@example.com');
SELECT throws_ok(
  format(
    $q$INSERT INTO public.profiles (auth_user_id, display_name, withdrawn_at) VALUES (%L, '退会済みユーザ', now())$q$,
    'a0000000-0000-4000-8000-000000000098'
  ),
  '23514',
  NULL,
  'C-profiles-03 tombstone with auth'
);
SELECT throws_ok(
  $q$INSERT INTO public.profiles (display_name, withdrawn_at) VALUES ('退会済みユーザ', NULL)$q$,
  '23514',
  NULL,
  'C-profiles-03 tombstone without withdrawn_at'
);
SELECT throws_ok(
  $q$INSERT INTO public.profiles (display_name, withdrawn_at) VALUES ('まだ名前', now())$q$,
  '23514',
  NULL,
  'C-profiles-03 tombstone wrong name'
);
SELECT throws_ok(
  format(
    $q$UPDATE public.profiles SET display_name = '退会済みユーザ' WHERE id = %L$q$,
    omh_test.profile_a()
  ),
  '23514',
  NULL,
  'C-profiles-04'
);
SELECT lives_ok(
  $q$
    INSERT INTO public.profiles (display_name, withdrawn_at) VALUES ('退会済みユーザ', now());
    INSERT INTO public.profiles (display_name, withdrawn_at) VALUES ('退会済みユーザ', now());
  $q$,
  'C-profiles-05'
);

-- C-communities / C-fk-04
SELECT omh_test.set_auth(omh_test.auth_a());
SET LOCAL ROLE authenticated;
SELECT throws_ok(
  format($q$DELETE FROM public.communities WHERE id = %L$q$, omh_test.community_1()),
  '23503',
  NULL,
  'C-communities-01'
);
SELECT throws_ok(
  format($q$DELETE FROM public.communities WHERE id = %L$q$, omh_test.community_1()),
  '23503',
  NULL,
  'C-fk-04'
);
RESET ROLE;

INSERT INTO public.communities (id, name)
VALUES ('c0000000-0000-4000-8000-0000000000aa', '空グループ');
INSERT INTO public.community_memberships (community_id, user_id)
VALUES ('c0000000-0000-4000-8000-0000000000aa', omh_test.profile_a());
INSERT INTO public.community_invite_codes (community_id, code, expires_at, created_by)
VALUES (
  'c0000000-0000-4000-8000-0000000000aa',
  'ZZZZZZZZZZ',
  now() + interval '7 days',
  omh_test.profile_a()
);

SELECT omh_test.set_auth(omh_test.auth_a());
SET LOCAL ROLE authenticated;
SELECT lives_ok(
  $q$DELETE FROM public.communities WHERE id = 'c0000000-0000-4000-8000-0000000000aa'$q$,
  'C-communities-02'
);
RESET ROLE;
SELECT is(
  (SELECT count(*)::int FROM public.community_memberships
   WHERE community_id = 'c0000000-0000-4000-8000-0000000000aa'),
  0,
  'C-communities-02 memberships cascaded'
);
SELECT is(
  (SELECT count(*)::int FROM public.community_invite_codes
   WHERE community_id = 'c0000000-0000-4000-8000-0000000000aa'),
  0,
  'C-communities-02 invites cascaded'
);

INSERT INTO public.communities (id, name)
VALUES ('c0000000-0000-4000-8000-0000000000cd', 'ログ残グループ');
INSERT INTO public.community_memberships (community_id, user_id)
VALUES ('c0000000-0000-4000-8000-0000000000cd', omh_test.profile_a());
INSERT INTO public.activity_logs (id, entity_type, entity_id, action, actor_user_id)
VALUES (
  '14000000-0000-4000-8000-0000000000cd',
  'community',
  'c0000000-0000-4000-8000-0000000000cd',
  'insert',
  omh_test.profile_a()
);
SELECT omh_test.set_auth(omh_test.auth_a());
SET LOCAL ROLE authenticated;
SELECT lives_ok(
  $q$DELETE FROM public.communities WHERE id = 'c0000000-0000-4000-8000-0000000000cd'$q$,
  'C-communities-03 delete'
);
RESET ROLE;
SELECT is(
  (SELECT count(*)::int FROM public.communities WHERE id = 'c0000000-0000-4000-8000-0000000000cd'),
  0,
  'C-communities-03 community gone'
);
SELECT is(
  (SELECT count(*)::int FROM public.activity_logs
   WHERE id = '14000000-0000-4000-8000-0000000000cd'),
  1,
  'C-communities-03'
);

-- C-memberships
SELECT throws_ok(
  format(
    $q$INSERT INTO public.community_memberships (community_id, user_id) VALUES (%L, %L)$q$,
    omh_test.community_1(),
    omh_test.profile_a()
  ),
  '23505',
  NULL,
  'C-memberships-01'
);

INSERT INTO public.communities (id, name)
VALUES ('c0000000-0000-4000-8000-0000000000bb', '最後の1人');
INSERT INTO public.community_memberships (community_id, user_id)
VALUES ('c0000000-0000-4000-8000-0000000000bb', omh_test.profile_a());
INSERT INTO public.tournaments (id, community_id, held_on, name)
VALUES ('e0000000-0000-4000-8000-0000000000bb', 'c0000000-0000-4000-8000-0000000000bb', DATE '2026-01-01', '残大会');
SELECT omh_test.insert_tournament_rule(
  'f0000000-0000-4000-8000-0000000000bb',
  'e0000000-0000-4000-8000-0000000000bb',
  '残ルール'
);
INSERT INTO public.matches (id, tournament_id, tournament_rule_id)
VALUES (
  '12000000-0000-4000-8000-0000000000bb',
  'e0000000-0000-4000-8000-0000000000bb',
  'f0000000-0000-4000-8000-0000000000bb'
);
INSERT INTO public.activity_logs (entity_type, entity_id, action, actor_user_id)
VALUES
  ('community', 'c0000000-0000-4000-8000-0000000000bb', 'insert', omh_test.profile_a()),
  ('tournament', 'e0000000-0000-4000-8000-0000000000bb', 'insert', omh_test.profile_a()),
  ('match', '12000000-0000-4000-8000-0000000000bb', 'insert', omh_test.profile_a());
CREATE TEMP TABLE omh_c_logs_03 ON COMMIT DROP AS
SELECT id
FROM public.activity_logs
WHERE entity_id IN (
  'c0000000-0000-4000-8000-0000000000bb',
  'e0000000-0000-4000-8000-0000000000bb',
  '12000000-0000-4000-8000-0000000000bb'
);

SELECT omh_test.set_auth(omh_test.auth_a());
SET LOCAL ROLE authenticated;
SELECT lives_ok(
  $q$DELETE FROM public.community_memberships
     WHERE community_id = 'c0000000-0000-4000-8000-0000000000bb'
       AND user_id = 'b0000000-0000-4000-8000-000000000001'$q$,
  'C-memberships-02'
);
RESET ROLE;
SELECT is(
  (SELECT count(*)::int FROM public.communities WHERE id = 'c0000000-0000-4000-8000-0000000000bb'),
  0,
  'C-memberships-02 community gone'
);
SELECT is(
  (SELECT count(*)::int FROM public.matches WHERE id = '12000000-0000-4000-8000-0000000000bb'),
  0,
  'C-memberships-02 orphans gone'
);
SELECT is(
  (SELECT count(*)::int FROM public.activity_logs a
   JOIN omh_c_logs_03 s ON s.id = a.id),
  (SELECT count(*)::int FROM omh_c_logs_03),
  'C-logs-03'
);
SELECT is(
  (SELECT count(*)::int FROM public.activity_logs a
   JOIN omh_c_logs_03 s ON s.id = a.id),
  (SELECT count(*)::int FROM omh_c_logs_03),
  'C-fk-05 logs remain'
);

SELECT omh_test.set_auth(omh_test.auth_a());
SET LOCAL ROLE authenticated;
SELECT lives_ok(
  format(
    $q$DELETE FROM public.community_memberships WHERE community_id = %L AND user_id = %L$q$,
    omh_test.community_1(),
    omh_test.profile_c()
  ),
  'C-memberships-03'
);
RESET ROLE;
SELECT is(
  (SELECT count(*)::int FROM public.communities WHERE id = omh_test.community_1()),
  1,
  'C-memberships-03 community remains'
);
SELECT is(
  (SELECT user_id FROM public.tournament_participants WHERE id = omh_test.part_c()),
  omh_test.profile_c(),
  'C-memberships-03 participant remains'
);
-- 以降の RLS 用に C を戻す
INSERT INTO public.community_memberships (community_id, user_id)
VALUES (omh_test.community_1(), omh_test.profile_c());

-- ルール共通
SELECT throws_ok(
  format(
    $q$UPDATE public.community_rules SET player_count = 2 WHERE id = %L$q$,
    omh_test.rule_1()
  ),
  '23514',
  NULL,
  'C-community_rules-01'
);
SELECT throws_ok(
  format(
    $q$UPDATE public.tournament_rules SET player_count = 5 WHERE id = %L$q$,
    omh_test.t_rule_free()
  ),
  '23514',
  NULL,
  'C-tournament_rules-01'
);
SELECT throws_ok(
  format(
    $q$INSERT INTO public.community_rules (
         community_id, name, player_count, starting_score, return_score,
         oka_tie_handling, uma_enabled, uma_tie_handling, uma_points_1, uma_points_2,
         tobi_enabled, yakitori_enabled, rate
       ) VALUES (%L, '四麻標準', 4, 25000, 30000, 'kamicha', true, 'kamicha', 20, 10, false, false, 1)$q$,
    omh_test.community_1()
  ),
  '23505',
  NULL,
  'C-community_rules-02'
);
SELECT throws_ok(
  format(
    $q$INSERT INTO public.tournament_rules (
         tournament_id, name, player_count, starting_score, return_score,
         oka_tie_handling, uma_enabled, uma_tie_handling, uma_points_1, uma_points_2,
         tobi_enabled, yakitori_enabled, rate
       ) VALUES (%L, '使用中', 4, 25000, 30000, 'kamicha', true, 'kamicha', 20, 10, false, false, 1)$q$,
    omh_test.tournament_1()
  ),
  '23505',
  NULL,
  'C-tournament_rules-02'
);
SELECT throws_ok(
  format(
    $q$UPDATE public.community_rules SET uma_enabled = false, uma_points_1 = 10 WHERE id = %L$q$,
    omh_test.rule_1()
  ),
  '23514',
  NULL,
  'C-community_rules-03'
);
SELECT throws_ok(
  format(
    $q$UPDATE public.tournament_rules SET uma_enabled = false, uma_tie_handling = 'split' WHERE id = %L$q$,
    omh_test.t_rule_free()
  ),
  '23514',
  NULL,
  'C-tournament_rules-03'
);
SELECT throws_ok(
  format(
    $q$UPDATE public.community_rules SET uma_points_1 = NULL WHERE id = %L$q$,
    omh_test.rule_1()
  ),
  '23514',
  NULL,
  'C-community_rules-04'
);
SELECT throws_ok(
  format(
    $q$UPDATE public.tournament_rules SET uma_tie_handling = NULL WHERE id = %L$q$,
    omh_test.t_rule_free()
  ),
  '23514',
  NULL,
  'C-tournament_rules-04'
);
SELECT throws_ok(
  format(
    $q$UPDATE public.community_rules SET uma_points_2 = NULL WHERE id = %L$q$,
    omh_test.rule_1()
  ),
  '23514',
  NULL,
  'C-community_rules-05'
);
SELECT throws_ok(
  format(
    $q$UPDATE public.tournament_rules SET uma_points_2 = NULL WHERE id = %L$q$,
    omh_test.t_rule_free()
  ),
  '23514',
  NULL,
  'C-tournament_rules-05'
);
SELECT throws_ok(
  format(
    $q$UPDATE public.community_rules SET player_count = 3, uma_points_2 = 10 WHERE id = %L$q$,
    omh_test.rule_1()
  ),
  '23514',
  NULL,
  'C-community_rules-06'
);
SELECT throws_ok(
  format(
    $q$UPDATE public.tournament_rules SET player_count = 3, uma_points_2 = 5 WHERE id = %L$q$,
    omh_test.t_rule_free()
  ),
  '23514',
  NULL,
  'C-tournament_rules-06'
);
SELECT throws_ok(
  format(
    $q$UPDATE public.community_rules SET rate = -1 WHERE id = %L$q$,
    omh_test.rule_1()
  ),
  '23514',
  NULL,
  'C-community_rules-07'
);
SELECT throws_ok(
  format(
    $q$UPDATE public.tournament_rules SET rate = -0.1 WHERE id = %L$q$,
    omh_test.t_rule_free()
  ),
  '23514',
  NULL,
  'C-tournament_rules-07'
);
SELECT throws_ok(
  format(
    $q$UPDATE public.community_rules SET oka_tie_handling = 'bogus' WHERE id = %L$q$,
    omh_test.rule_1()
  ),
  '22P02',
  NULL,
  'C-community_rules-08'
);
SELECT throws_ok(
  format(
    $q$UPDATE public.tournament_rules SET oka_tie_handling = 'bogus' WHERE id = %L$q$,
    omh_test.t_rule_free()
  ),
  '22P02',
  NULL,
  'C-tournament_rules-08'
);
SELECT throws_ok(
  format(
    $q$UPDATE public.community_rules SET uma_tie_handling = 'bogus' WHERE id = %L$q$,
    omh_test.rule_1()
  ),
  '22P02',
  NULL,
  'C-community_rules-09'
);
SELECT throws_ok(
  format(
    $q$UPDATE public.tournament_rules SET uma_tie_handling = 'bogus' WHERE id = %L$q$,
    omh_test.t_rule_free()
  ),
  '22P02',
  NULL,
  'C-tournament_rules-09'
);

SELECT omh_test.set_auth(omh_test.auth_a());
SET LOCAL ROLE authenticated;
SELECT throws_ok(
  format($q$UPDATE public.tournament_rules SET notes = 'used' WHERE id = %L$q$, omh_test.t_rule_used()),
  'P0001',
  NULL,
  'C-tournament_rules-10'
);
SELECT throws_ok(
  format($q$DELETE FROM public.tournament_rules WHERE id = %L$q$, omh_test.t_rule_used()),
  '23503',
  NULL,
  'C-tournament_rules-11'
);
SELECT throws_ok(
  format($q$DELETE FROM public.tournament_rules WHERE id = %L$q$, omh_test.t_rule_used()),
  '23503',
  NULL,
  'C-fk-02'
);
SELECT lives_ok(
  format($q$UPDATE public.tournament_rules SET notes = 'free' WHERE id = %L$q$, omh_test.t_rule_free()),
  'C-tournament_rules-12 update'
);
SELECT lives_ok(
  format($q$DELETE FROM public.tournament_rules WHERE id = %L$q$, omh_test.t_rule_free()),
  'C-tournament_rules-12 delete'
);
RESET ROLE;
SELECT omh_test.insert_tournament_rule(omh_test.t_rule_free(), omh_test.tournament_1(), '未使用');

-- tournaments
SELECT lives_ok(
  format(
    $q$INSERT INTO public.tournaments (community_id, held_on, name) VALUES (%L, DATE '2026-08-02', '夏大会')$q$,
    omh_test.community_1()
  ),
  'C-tournaments-01'
);
SELECT throws_ok(
  format($q$DELETE FROM public.tournaments WHERE id = %L$q$, omh_test.tournament_1()),
  '23503',
  NULL,
  'C-tournaments-02'
);
SELECT throws_ok(
  format($q$DELETE FROM public.tournaments WHERE id = %L$q$, omh_test.tournament_1()),
  '23503',
  NULL,
  'C-fk-03'
);
INSERT INTO public.tournaments (id, community_id, held_on, name)
VALUES ('e0000000-0000-4000-8000-0000000000cc', omh_test.community_1(), DATE '2026-02-02', '空大会');
SELECT lives_ok(
  $q$DELETE FROM public.tournaments WHERE id = 'e0000000-0000-4000-8000-0000000000cc'$q$,
  'C-tournaments-03'
);

-- participants
SELECT throws_ok(
  format(
    $q$INSERT INTO public.tournament_participants (tournament_id, user_id, guest_display_name) VALUES (%L, %L, '両方')$q$,
    omh_test.tournament_1(),
    omh_test.profile_a()
  ),
  '23514',
  NULL,
  'C-participants-01 both'
);
SELECT throws_ok(
  format(
    $q$INSERT INTO public.tournament_participants (tournament_id) VALUES (%L)$q$,
    omh_test.tournament_1()
  ),
  '23514',
  NULL,
  'C-participants-01 neither'
);
SELECT throws_ok(
  format(
    $q$INSERT INTO public.tournament_participants (tournament_id, user_id) VALUES (%L, %L)$q$,
    omh_test.tournament_1(),
    omh_test.profile_a()
  ),
  '23505',
  NULL,
  'C-participants-02'
);
SELECT throws_ok(
  format(
    $q$INSERT INTO public.tournament_participants (tournament_id, guest_display_name) VALUES (%L, 'ゲスト太郎')$q$,
    omh_test.tournament_1()
  ),
  '23505',
  NULL,
  'C-participants-03'
);
SELECT throws_ok(
  format(
    $q$INSERT INTO public.tournament_participants (tournament_id, guest_display_name) VALUES (%L, '   ')$q$,
    omh_test.tournament_1()
  ),
  '23514',
  NULL,
  'C-participants-04'
);
SELECT throws_ok(
  format(
    $q$INSERT INTO public.tournament_participants (tournament_id, guest_display_name) VALUES (%L, '')$q$,
    omh_test.tournament_1()
  ),
  '23514',
  NULL,
  'C-participants-04 empty'
);
SELECT throws_ok(
  format(
    $q$INSERT INTO public.tournament_participants (tournament_id, user_id) VALUES (%L, %L)$q$,
    omh_test.tournament_1(),
    omh_test.profile_b()
  ),
  'P0001',
  NULL,
  'C-participants-05 B'
);
SELECT throws_ok(
  format(
    $q$INSERT INTO public.tournament_participants (tournament_id, user_id) VALUES (%L, %L)$q$,
    omh_test.tournament_1(),
    omh_test.profile_l()
  ),
  'P0001',
  NULL,
  'C-participants-05 L'
);
SELECT throws_ok(
  format(
    $q$UPDATE public.tournament_participants
       SET user_id = %L, guest_display_name = NULL
       WHERE id = %L$q$,
    omh_test.profile_b(),
    omh_test.part_guest()
  ),
  'P0001',
  NULL,
  'C-participants-05 B update'
);
SELECT throws_ok(
  format(
    $q$UPDATE public.tournament_participants
       SET user_id = %L, guest_display_name = NULL
       WHERE id = %L$q$,
    omh_test.profile_l(),
    omh_test.part_guest()
  ),
  'P0001',
  NULL,
  'C-participants-05 L update'
);
SELECT throws_ok(
  format(
    $q$INSERT INTO public.tournament_participants (tournament_id, user_id) VALUES (%L, %L)$q$,
    omh_test.tournament_1(),
    omh_test.profile_t()
  ),
  'P0001',
  NULL,
  'C-participants-06'
);
SELECT isnt(
  (SELECT user_id FROM public.tournament_participants WHERE id = omh_test.part_l()),
  NULL,
  'C-participants-07'
);
INSERT INTO public.tournament_participants (id, tournament_id, guest_display_name)
VALUES ('11000000-0000-4000-8000-0000000000c8', omh_test.tournament_1(), '外すゲスト');
INSERT INTO public.matches (id, tournament_id, tournament_rule_id)
VALUES ('12000000-0000-4000-8000-0000000000c8', omh_test.tournament_1(), omh_test.t_rule_used());
SELECT omh_test.insert_match_result(
  '13000000-0000-4000-8000-0000000000c8',
  '12000000-0000-4000-8000-0000000000c8',
  '11000000-0000-4000-8000-0000000000c8',
  'east',
  25000,
  1
);
SELECT lives_ok(
  $q$DELETE FROM public.tournament_participants WHERE id = '11000000-0000-4000-8000-0000000000c8'$q$,
  'C-participants-08'
);
SELECT is(
  (SELECT count(*)::int FROM public.match_results
   WHERE id = '13000000-0000-4000-8000-0000000000c8'),
  0,
  'C-fk-01'
);
SELECT is(
  (SELECT count(*)::int FROM public.matches
   WHERE id = '12000000-0000-4000-8000-0000000000c8'),
  1,
  'C-participants-08 match remains'
);
INSERT INTO public.tournament_participants (id, tournament_id, guest_display_name)
VALUES ('11000000-0000-4000-8000-0000000000dd', omh_test.tournament_1(), '消すゲスト');
INSERT INTO public.tournament_point_adjustments (
  tournament_participant_id,
  adjustment_points_1, adjustment_points_2, adjustment_points_3,
  adjustment_points_4, adjustment_points_5
) VALUES ('11000000-0000-4000-8000-0000000000dd', 0, 0, 0, 0, 0);
SELECT lives_ok(
  $q$DELETE FROM public.tournament_participants WHERE id = '11000000-0000-4000-8000-0000000000dd'$q$,
  'C-participants-09'
);
SELECT is(
  (SELECT count(*)::int FROM public.tournament_point_adjustments
   WHERE tournament_participant_id = '11000000-0000-4000-8000-0000000000dd'),
  0,
  'C-participants-09 adjustments cascaded'
);

SELECT throws_ok(
  format(
    $q$INSERT INTO public.tournament_point_adjustments (
         tournament_participant_id,
         adjustment_points_1, adjustment_points_2, adjustment_points_3,
         adjustment_points_4, adjustment_points_5
       ) VALUES (%L, 0, 0, 0, 0, 0)$q$,
    omh_test.part_a()
  ),
  '23505',
  NULL,
  'C-adjustments-01'
);
SELECT throws_ok(
  format(
    $q$INSERT INTO public.tournament_point_adjustments (
         tournament_participant_id,
         adjustment_points_1, adjustment_points_2, adjustment_points_3,
         adjustment_points_4, adjustment_points_5
       ) VALUES (%L, NULL, 0, 0, 0, 0)$q$,
    omh_test.part_guest()
  ),
  '23502',
  NULL,
  'C-adjustments-02'
);

INSERT INTO public.tournaments (id, community_id, held_on, name)
VALUES ('e0000000-0000-4000-8000-0000000000ee', omh_test.community_1(), DATE '2026-03-03', '別大会');
SELECT omh_test.insert_tournament_rule(
  'f0000000-0000-4000-8000-0000000000ee',
  'e0000000-0000-4000-8000-0000000000ee',
  '別ルール'
);
SELECT throws_ok(
  format(
    $q$INSERT INTO public.matches (tournament_id, tournament_rule_id) VALUES (%L, %L)$q$,
    omh_test.tournament_1(),
    'f0000000-0000-4000-8000-0000000000ee'
  ),
  '23503',
  NULL,
  'C-matches-01'
);
SELECT lives_ok(
  format($q$DELETE FROM public.matches WHERE id = %L$q$, omh_test.match_1()),
  'C-matches-02'
);
SELECT is(
  (SELECT count(*)::int FROM public.match_results WHERE match_id = omh_test.match_1()),
  0,
  'C-matches-02 results cascaded'
);
-- 試合を戻す
INSERT INTO public.matches (id, tournament_id, tournament_rule_id)
VALUES (omh_test.match_1(), omh_test.tournament_1(), omh_test.t_rule_used());
SELECT omh_test.insert_match_result('13000000-0000-4000-8000-000000000001', omh_test.match_1(), omh_test.part_a(), 'east', 25000, 1);
SELECT omh_test.insert_match_result('13000000-0000-4000-8000-000000000002', omh_test.match_1(), omh_test.part_c(), 'south', 25000, 2);
SELECT omh_test.insert_match_result('13000000-0000-4000-8000-000000000003', omh_test.match_1(), omh_test.part_l(), 'west', 25000, 3);
SELECT omh_test.insert_match_result('13000000-0000-4000-8000-000000000004', omh_test.match_1(), omh_test.part_t(), 'north', 25000, 4);

INSERT INTO public.tournaments (id, community_id, held_on, name)
VALUES ('e0000000-0000-4000-8000-0000000000ff', omh_test.community_1(), DATE '2026-04-04', 'ルール0');
SELECT throws_ok(
  $q$INSERT INTO public.matches (tournament_id, tournament_rule_id)
     VALUES ('e0000000-0000-4000-8000-0000000000ff', NULL)$q$,
  '23502',
  NULL,
  'C-matches-03'
);

SELECT throws_ok(
  format(
    $q$INSERT INTO public.match_results (
         match_id, tournament_participant_id, seat, score, base_points, uma_points, tobi_points, yakitori_points,
         other_points_1, other_points_2, other_points_3, other_points_4, other_points_5,
         manual_points_1, manual_points_2, manual_points_3, points, rank
       ) VALUES (%L, %L, 'east', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1)$q$,
    omh_test.match_1(),
    omh_test.part_a()
  ),
  '23505',
  NULL,
  'C-match_results-01'
);
SELECT throws_ok(
  format(
    $q$INSERT INTO public.match_results (
         match_id, tournament_participant_id, seat, score, base_points, uma_points, tobi_points, yakitori_points,
         other_points_1, other_points_2, other_points_3, other_points_4, other_points_5,
         manual_points_1, manual_points_2, manual_points_3, points, rank
       ) VALUES (%L, %L, 'east', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1)$q$,
    omh_test.match_1(),
    omh_test.part_guest()
  ),
  '23505',
  NULL,
  'C-match_results-02'
);
INSERT INTO public.tournament_participants (id, tournament_id, guest_display_name)
VALUES ('11000000-0000-4000-8000-0000000000ee', 'e0000000-0000-4000-8000-0000000000ee', '別大会ゲスト');
SELECT throws_ok(
  format(
    $q$INSERT INTO public.match_results (
         match_id, tournament_participant_id, seat, score, base_points, uma_points, tobi_points, yakitori_points,
         other_points_1, other_points_2, other_points_3, other_points_4, other_points_5,
         manual_points_1, manual_points_2, manual_points_3, points, rank
       ) VALUES (%L, '11000000-0000-4000-8000-0000000000ee', 'east', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1)$q$,
    omh_test.match_1()
  ),
  'P0001',
  NULL,
  'C-match_results-03'
);
SELECT throws_ok(
  format(
    $q$INSERT INTO public.match_results (
         match_id, tournament_participant_id, seat, score, base_points, uma_points, tobi_points, yakitori_points,
         other_points_1, other_points_2, other_points_3, other_points_4, other_points_5,
         manual_points_1, manual_points_2, manual_points_3, points, rank
       ) VALUES (%L, %L, 'center', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1)$q$,
    omh_test.match_1(),
    omh_test.part_guest()
  ),
  '22P02',
  NULL,
  'C-match_results-04'
);
SELECT throws_ok(
  format(
    $q$INSERT INTO public.match_results (
         match_id, tournament_participant_id, seat, score, base_points, uma_points, tobi_points, yakitori_points,
         other_points_1, other_points_2, other_points_3, other_points_4, other_points_5,
         manual_points_1, manual_points_2, manual_points_3, points, rank
       ) VALUES (%L, %L, 'east', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0)$q$,
    omh_test.match_1(),
    omh_test.part_guest()
  ),
  '23514',
  NULL,
  'C-match_results-05'
);
SELECT lives_ok(
  format($q$UPDATE public.match_results SET score = 1 WHERE match_id = %L$q$, omh_test.match_1()),
  'C-match_results-06'
);
SELECT is(
  (SELECT (r.starting_score * r.player_count)::int
   FROM public.tournament_rules r
   WHERE r.id = omh_test.t_rule_used()),
  100000,
  'C-match_results-06 starting times players'
);
SELECT isnt(
  (SELECT sum(score)::bigint FROM public.match_results WHERE match_id = omh_test.match_1()),
  100000::bigint,
  'C-match_results-06 sum mismatch allowed'
);

SELECT throws_ok(
  format(
    $q$INSERT INTO public.community_invite_codes (community_id, code, expires_at, created_by)
       VALUES (%L, 'NNNNNNNNNN', now() + interval '1 day', %L)$q$,
    omh_test.community_1(),
    omh_test.profile_a()
  ),
  '23505',
  NULL,
  'C-invite-01'
);
INSERT INTO public.communities (id, name) VALUES ('c0000000-0000-4000-8000-0000000000cc', '招待重複');
INSERT INTO public.community_memberships (community_id, user_id)
VALUES ('c0000000-0000-4000-8000-0000000000cc', omh_test.profile_a());
SELECT throws_ok(
  format(
    $q$INSERT INTO public.community_invite_codes (community_id, code, expires_at, created_by)
       VALUES ('c0000000-0000-4000-8000-0000000000cc', 'ABCDEFGHJK', now() + interval '1 day', %L)$q$,
    omh_test.profile_a()
  ),
  '23505',
  NULL,
  'C-invite-02'
);
SELECT throws_ok(
  format(
    $q$INSERT INTO public.community_invite_codes (community_id, code, expires_at, created_by)
       VALUES ('c0000000-0000-4000-8000-0000000000cc', 'ABCDEFGHJ', now() + interval '1 day', %L)$q$,
    omh_test.profile_a()
  ),
  '23514',
  NULL,
  'C-invite-03'
);
SELECT throws_ok(
  format(
    $q$INSERT INTO public.community_invite_codes (community_id, code, expires_at, created_by)
       VALUES ('c0000000-0000-4000-8000-0000000000cc', 'ABCDEFGHJKM', now() + interval '1 day', %L)$q$,
    omh_test.profile_a()
  ),
  '23514',
  NULL,
  'C-invite-03 11 chars'
);
SELECT throws_ok(
  format(
    $q$INSERT INTO public.community_invite_codes (community_id, code, expires_at, created_by)
       VALUES ('c0000000-0000-4000-8000-0000000000cc', 'ABCDEFGHIJ', now() + interval '1 day', %L)$q$,
    omh_test.profile_a()
  ),
  '23514',
  NULL,
  'C-invite-04'
);
SELECT throws_ok(
  format(
    $q$INSERT INTO public.community_invite_codes (community_id, code, expires_at, created_by)
       VALUES ('c0000000-0000-4000-8000-0000000000cc', 'ABCDEFGHJ!', now() + interval '1 day', %L)$q$,
    omh_test.profile_a()
  ),
  '23514',
  NULL,
  'C-invite-05'
);
SELECT lives_ok(
  format(
    $q$INSERT INTO public.community_invite_codes (community_id, code, expires_at, created_by)
       VALUES ('c0000000-0000-4000-8000-0000000000cc', 'nnpnnpnnpn', now() + interval '1 day', %L)$q$,
    omh_test.profile_a()
  ),
  'C-invite-06 insert'
);
SELECT is(
  (SELECT code FROM public.community_invite_codes WHERE community_id = 'c0000000-0000-4000-8000-0000000000cc'),
  'NNPNNPNNPN',
  'C-invite-06 stored upper'
);
SELECT throws_ok(
  format(
    $q$INSERT INTO public.community_invite_codes (community_id, code, created_by)
       VALUES ('c0000000-0000-4000-8000-0000000000cc', 'ABCDEFGHJM', %L)$q$,
    omh_test.profile_a()
  ),
  '23502',
  NULL,
  'C-invite-07'
);

SELECT throws_ok(
  format(
    $q$INSERT INTO public.activity_logs (entity_type, entity_id, action, actor_user_id)
       VALUES ('community', %L, 'patch', %L)$q$,
    omh_test.community_1(),
    omh_test.profile_a()
  ),
  '22P02',
  NULL,
  'C-logs-02'
);

SELECT omh_test.set_auth(omh_test.auth_a());
DELETE FROM public.activity_logs;
SET LOCAL ROLE authenticated;
INSERT INTO public.tournaments (community_id, held_on, name)
VALUES (omh_test.community_1(), DATE '2026-05-05', 'ログ大会');
RESET ROLE;
SELECT is(
  (SELECT count(*)::int FROM public.activity_logs
   WHERE entity_type = 'tournament' AND action = 'insert' AND actor_user_id = omh_test.profile_a()),
  1,
  'C-logs-04'
);

SELECT omh_test.set_auth(omh_test.auth_a());
DELETE FROM public.activity_logs;
SET LOCAL ROLE authenticated;
UPDATE public.match_results SET uma_points = 1 WHERE match_id = omh_test.match_1() AND tournament_participant_id = omh_test.part_a();
RESET ROLE;
SELECT is(
  (SELECT count(*)::int FROM public.activity_logs WHERE entity_type = 'match' AND action = 'update' AND entity_id = omh_test.match_1()),
  1,
  'C-logs-05 type'
);
SELECT is(
  (SELECT count(*)::int FROM public.activity_logs WHERE entity_id = '13000000-0000-4000-8000-000000000001'),
  0,
  'C-logs-05 not result id'
);

SELECT omh_test.set_auth(omh_test.auth_a());
DELETE FROM public.activity_logs;
SET LOCAL ROLE authenticated;
DELETE FROM public.matches WHERE id = omh_test.match_1();
RESET ROLE;
SELECT is(
  (SELECT count(*)::int FROM public.activity_logs WHERE entity_type = 'match' AND action = 'delete' AND entity_id = omh_test.match_1()),
  1,
  'C-logs-06'
);
SELECT is(
  (SELECT count(*)::int FROM public.activity_logs WHERE entity_type = 'match' AND action = 'delete'),
  1,
  'C-logs-06 no cascaded result logs'
);

INSERT INTO public.communities (id, name)
VALUES ('c0000000-0000-4000-8000-00000000000c', 'ログ最後');
INSERT INTO public.community_memberships (community_id, user_id)
VALUES ('c0000000-0000-4000-8000-00000000000c', omh_test.profile_a());
INSERT INTO public.tournaments (id, community_id, held_on, name)
VALUES ('e0000000-0000-4000-8000-00000000000c', 'c0000000-0000-4000-8000-00000000000c', DATE '2026-06-06', 'ログ大会2');
SELECT omh_test.insert_tournament_rule(
  'f0000000-0000-4000-8000-00000000000c',
  'e0000000-0000-4000-8000-00000000000c',
  'ログルール'
);
INSERT INTO public.matches (id, tournament_id, tournament_rule_id)
VALUES (
  '12000000-0000-4000-8000-00000000000c',
  'e0000000-0000-4000-8000-00000000000c',
  'f0000000-0000-4000-8000-00000000000c'
);
SELECT omh_test.set_auth(omh_test.auth_a());
DELETE FROM public.activity_logs;
SET LOCAL ROLE authenticated;
DELETE FROM public.community_memberships
WHERE community_id = 'c0000000-0000-4000-8000-00000000000c';
RESET ROLE;
SELECT cmp_ok(
  (SELECT count(*)::int FROM public.activity_logs),
  '>=',
  1,
  'C-logs-07 origin remains'
);
SELECT is(
  (SELECT count(*)::int FROM public.activity_logs WHERE entity_id = '12000000-0000-4000-8000-00000000000c'),
  0,
  'C-logs-07 no child match logs'
);

SELECT omh_test.set_auth(NULL);
DELETE FROM public.activity_logs;
INSERT INTO public.tournaments (community_id, held_on, name)
VALUES (omh_test.community_1(), DATE '2026-07-07', 'seed大会');
SELECT is(
  (SELECT count(*)::int FROM public.activity_logs),
  0,
  'C-logs-08'
);

SELECT * FROM finish();
ROLLBACK;
