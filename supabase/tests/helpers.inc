-- pgTAP 共通。各 *_test.sql から \ir する。ROLLBACK で消える。

DROP SCHEMA IF EXISTS omh_test CASCADE;
CREATE SCHEMA omh_test;

CREATE FUNCTION omh_test.set_auth(auth_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  IF auth_id IS NULL THEN
    PERFORM set_config('request.jwt.claim.sub', '', true);
    PERFORM set_config('request.jwt.claims', '', true);
  ELSE
    PERFORM set_config('request.jwt.claim.sub', auth_id::text, true);
    PERFORM set_config(
      'request.jwt.claims',
      json_build_object(
        'sub', auth_id::text,
        'role', 'authenticated',
        'aud', 'authenticated'
      )::text,
      true
    );
  END IF;
END;
$$;

-- keep_profile: true なら handle_new_user が付けた profiles を残す（F-signup-01）。
-- 既定は消す。フィクスチャは profiles.id を固定したいため。
CREATE FUNCTION omh_test.insert_auth_user(
  id uuid,
  email text,
  keep_profile boolean DEFAULT false
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    is_sso_user,
    is_anonymous
  ) VALUES (
    id,
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    email,
    now(),
    now(),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,
    false,
    false,
    false
  );
  IF NOT keep_profile THEN
    DELETE FROM public.profiles WHERE auth_user_id = insert_auth_user.id;
  END IF;
END;
$$;

CREATE FUNCTION omh_test.insert_active_profile(id uuid, auth_id uuid, display_name text)
RETURNS void
LANGUAGE sql
AS $$
  INSERT INTO public.profiles (id, auth_user_id, display_name)
  VALUES (id, auth_id, display_name);
$$;

CREATE FUNCTION omh_test.insert_tombstone_profile(id uuid)
RETURNS void
LANGUAGE sql
AS $$
  INSERT INTO public.profiles (id, auth_user_id, display_name, withdrawn_at, comment, avatar_url)
  VALUES (id, NULL, '退会済みユーザ', now(), NULL, NULL);
$$;

-- 四麻・ウマありの既定値
CREATE FUNCTION omh_test.insert_community_rule(id uuid, community_id uuid, name text)
RETURNS void
LANGUAGE sql
AS $$
  INSERT INTO public.community_rules (
    id, community_id, name, player_count, starting_score, return_score,
    oka_tie_handling, uma_enabled, uma_tie_handling, uma_points_1, uma_points_2,
    tobi_enabled, yakitori_enabled, rate
  ) VALUES (
    id, community_id, name, 4, 25000, 30000,
    'kamicha', true, 'kamicha', 20, 10,
    false, false, 1
  );
$$;

CREATE FUNCTION omh_test.insert_tournament_rule(id uuid, tournament_id uuid, name text)
RETURNS void
LANGUAGE sql
AS $$
  INSERT INTO public.tournament_rules (
    id, tournament_id, name, player_count, starting_score, return_score,
    oka_tie_handling, uma_enabled, uma_tie_handling, uma_points_1, uma_points_2,
    tobi_enabled, yakitori_enabled, rate
  ) VALUES (
    id, tournament_id, name, 4, 25000, 30000,
    'kamicha', true, 'kamicha', 20, 10,
    false, false, 1
  );
$$;

CREATE FUNCTION omh_test.insert_match_result(
  id uuid,
  match_id uuid,
  participant_id uuid,
  seat public.seat,
  score integer DEFAULT 25000,
  rank integer DEFAULT 1
)
RETURNS void
LANGUAGE sql
AS $$
  INSERT INTO public.match_results (
    id, match_id, tournament_participant_id, seat, score,
    base_points, uma_points, tobi_points, yakitori_points,
    other_points_1, other_points_2, other_points_3, other_points_4, other_points_5,
    manual_points_1, manual_points_2, manual_points_3,
    points, rank
  ) VALUES (
    id, match_id, participant_id, seat, score,
    0, 0, 0, 0,
    0, 0, 0, 0, 0,
    0, 0, 0,
    0, rank
  );
$$;

-- 固定 ID のフィクスチャと、それに紐づく途中作成データだけ消す。
CREATE FUNCTION omh_test.cleanup_standard()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  auth_ids uuid[] := ARRAY[
    'a0000000-0000-4000-8000-000000000001'::uuid,
    'a0000000-0000-4000-8000-000000000002'::uuid,
    'a0000000-0000-4000-8000-000000000003'::uuid,
    'a0000000-0000-4000-8000-000000000004'::uuid,
    'a0000000-0000-4000-8000-000000000005'::uuid,
    'a0000000-0000-4000-8000-00000000000a'::uuid
  ];
  profile_ids uuid[] := ARRAY[
    'b0000000-0000-4000-8000-000000000001'::uuid,
    'b0000000-0000-4000-8000-000000000002'::uuid,
    'b0000000-0000-4000-8000-000000000003'::uuid,
    'b0000000-0000-4000-8000-000000000004'::uuid,
    'b0000000-0000-4000-8000-000000000005'::uuid,
    'b0000000-0000-4000-8000-00000000000a'::uuid
  ];
  fixture_communities uuid[] := ARRAY[
    'c0000000-0000-4000-8000-000000000001'::uuid,
    'c0000000-0000-4000-8000-000000000002'::uuid
  ];
  target_communities uuid[];
BEGIN
  BEGIN
    ALTER TABLE public.community_memberships
      DISABLE TRIGGER trg_zzz_delete_community_if_last_member;

    SELECT coalesce(array_agg(DISTINCT cid), '{}'::uuid[])
    INTO target_communities
    FROM (
      SELECT unnest(fixture_communities) AS cid
      UNION
      SELECT community_id
      FROM public.community_memberships
      WHERE user_id = ANY (profile_ids)
    ) s;

    DELETE FROM public.match_results
    WHERE match_id IN (
        SELECT m.id
        FROM public.matches m
        JOIN public.tournaments t ON t.id = m.tournament_id
        WHERE t.community_id = ANY (target_communities)
      )
      OR tournament_participant_id IN (
        SELECT tp.id
        FROM public.tournament_participants tp
        WHERE tp.user_id = ANY (profile_ids)
           OR tp.tournament_id IN (
             SELECT id FROM public.tournaments WHERE community_id = ANY (target_communities)
           )
      );

    DELETE FROM public.matches
    WHERE tournament_id IN (
      SELECT id FROM public.tournaments WHERE community_id = ANY (target_communities)
    );

    DELETE FROM public.tournament_point_adjustments
    WHERE tournament_participant_id IN (
      SELECT tp.id
      FROM public.tournament_participants tp
      WHERE tp.user_id = ANY (profile_ids)
         OR tp.tournament_id IN (
           SELECT id FROM public.tournaments WHERE community_id = ANY (target_communities)
         )
    );

    DELETE FROM public.tournament_participants
    WHERE user_id = ANY (profile_ids)
       OR tournament_id IN (
         SELECT id FROM public.tournaments WHERE community_id = ANY (target_communities)
       );

    DELETE FROM public.tournament_rules
    WHERE tournament_id IN (
      SELECT id FROM public.tournaments WHERE community_id = ANY (target_communities)
    );

    DELETE FROM public.tournaments
    WHERE community_id = ANY (target_communities);

    DELETE FROM public.community_rules
    WHERE community_id = ANY (target_communities);

    DELETE FROM public.community_invite_codes
    WHERE community_id = ANY (target_communities)
       OR created_by = ANY (profile_ids);

    DELETE FROM public.community_memberships
    WHERE community_id = ANY (target_communities)
       OR user_id = ANY (profile_ids);

    DELETE FROM public.communities
    WHERE id = ANY (target_communities);

    DELETE FROM public.activity_logs
    WHERE actor_user_id = ANY (profile_ids)
       OR entity_id = ANY (target_communities);

    DELETE FROM public.profiles
    WHERE id = ANY (profile_ids)
       OR auth_user_id = ANY (auth_ids);

    DELETE FROM auth.users
    WHERE id = ANY (auth_ids);

    ALTER TABLE public.community_memberships
      ENABLE TRIGGER trg_zzz_delete_community_if_last_member;
  EXCEPTION
    WHEN OTHERS THEN
      ALTER TABLE public.community_memberships
        ENABLE TRIGGER trg_zzz_delete_community_if_last_member;
      RAISE;
  END;
END;
$$;

-- 標準フィクスチャ（RLS / 関数 / 配下 CRUD）
-- A,C = グループ1。B = グループ2。L = グループ1離脱済み。T = 墓石（グループ1の大会参加者）。
CREATE FUNCTION omh_test.seed_standard()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  auth_a uuid := 'a0000000-0000-4000-8000-000000000001';
  auth_b uuid := 'a0000000-0000-4000-8000-000000000002';
  auth_c uuid := 'a0000000-0000-4000-8000-000000000003';
  auth_l uuid := 'a0000000-0000-4000-8000-000000000004';
  auth_t uuid := 'a0000000-0000-4000-8000-000000000005';
  profile_a uuid := 'b0000000-0000-4000-8000-000000000001';
  profile_b uuid := 'b0000000-0000-4000-8000-000000000002';
  profile_c uuid := 'b0000000-0000-4000-8000-000000000003';
  profile_l uuid := 'b0000000-0000-4000-8000-000000000004';
  profile_t uuid := 'b0000000-0000-4000-8000-000000000005';
  community_1 uuid := 'c0000000-0000-4000-8000-000000000001';
  community_2 uuid := 'c0000000-0000-4000-8000-000000000002';
  rule_1 uuid := 'd0000000-0000-4000-8000-000000000001';
  tournament_1 uuid := 'e0000000-0000-4000-8000-000000000001';
  t_rule_used uuid := 'f0000000-0000-4000-8000-000000000001';
  t_rule_free uuid := 'f0000000-0000-4000-8000-000000000002';
  part_a uuid := '11000000-0000-4000-8000-000000000001';
  part_c uuid := '11000000-0000-4000-8000-000000000003';
  part_l uuid := '11000000-0000-4000-8000-000000000004';
  part_t uuid := '11000000-0000-4000-8000-000000000005';
  part_guest uuid := '11000000-0000-4000-8000-000000000006';
  match_1 uuid := '12000000-0000-4000-8000-000000000001';
BEGIN
  PERFORM omh_test.cleanup_standard();

  PERFORM omh_test.insert_auth_user(auth_a, 'a@example.com');
  PERFORM omh_test.insert_auth_user(auth_b, 'b@example.com');
  PERFORM omh_test.insert_auth_user(auth_c, 'c@example.com');
  PERFORM omh_test.insert_auth_user(auth_l, 'l@example.com');
  PERFORM omh_test.insert_auth_user(auth_t, 't@example.com');

  PERFORM omh_test.insert_active_profile(profile_a, auth_a, 'A');
  PERFORM omh_test.insert_active_profile(profile_b, auth_b, 'B');
  PERFORM omh_test.insert_active_profile(profile_c, auth_c, 'C');
  PERFORM omh_test.insert_active_profile(profile_l, auth_l, 'L');
  PERFORM omh_test.insert_active_profile(profile_t, auth_t, 'T');

  INSERT INTO public.communities (id, name) VALUES
    (community_1, 'グループ1'),
    (community_2, 'グループ2');

  INSERT INTO public.community_memberships (community_id, user_id) VALUES
    (community_1, profile_a),
    (community_1, profile_c),
    (community_1, profile_l),
    (community_1, profile_t),
    (community_2, profile_b);

  PERFORM omh_test.insert_community_rule(rule_1, community_1, '四麻標準');

  INSERT INTO public.tournaments (id, community_id, held_on, name)
  VALUES (tournament_1, community_1, DATE '2026-08-01', '夏大会');

  PERFORM omh_test.insert_tournament_rule(t_rule_used, tournament_1, '使用中');
  PERFORM omh_test.insert_tournament_rule(t_rule_free, tournament_1, '未使用');

  INSERT INTO public.tournament_participants (id, tournament_id, user_id)
  VALUES
    (part_a, tournament_1, profile_a),
    (part_c, tournament_1, profile_c),
    (part_l, tournament_1, profile_l),
    (part_t, tournament_1, profile_t);

  INSERT INTO public.tournament_participants (id, tournament_id, guest_display_name)
  VALUES (part_guest, tournament_1, 'ゲスト太郎');

  INSERT INTO public.matches (id, tournament_id, tournament_rule_id)
  VALUES (match_1, tournament_1, t_rule_used);

  PERFORM omh_test.insert_match_result(
    '13000000-0000-4000-8000-000000000001', match_1, part_a, 'east', 25000, 1
  );
  PERFORM omh_test.insert_match_result(
    '13000000-0000-4000-8000-000000000002', match_1, part_c, 'south', 25000, 2
  );
  PERFORM omh_test.insert_match_result(
    '13000000-0000-4000-8000-000000000003', match_1, part_l, 'west', 25000, 3
  );
  PERFORM omh_test.insert_match_result(
    '13000000-0000-4000-8000-000000000004', match_1, part_t, 'north', 25000, 4
  );

  INSERT INTO public.tournament_point_adjustments (
    tournament_participant_id,
    adjustment_points_1, adjustment_points_2, adjustment_points_3,
    adjustment_points_4, adjustment_points_5
  ) VALUES (part_a, 1, 0, 0, 0, 0);

  INSERT INTO public.community_invite_codes (community_id, code, expires_at, created_by)
  VALUES (
    community_1,
    'ABCDEFGHJK',
    timestamptz '2099-12-31 15:00:00+09',
    profile_a
  );

  -- T を墓石にし、L と T のメンバーシップを外す（大会参加者行は残す）
  PERFORM set_config('omh.withdrawing', 'on', true);
  UPDATE public.profiles
  SET
    display_name = '退会済みユーザ',
    comment = NULL,
    avatar_url = NULL,
    withdrawn_at = now(),
    auth_user_id = NULL
  WHERE id = profile_t;
  PERFORM set_config('omh.withdrawing', '', true);

  DELETE FROM public.community_memberships
  WHERE community_id = community_1
    AND user_id IN (profile_l, profile_t);
END;
$$;

CREATE FUNCTION omh_test.auth_a() RETURNS uuid LANGUAGE sql IMMUTABLE AS $$ SELECT 'a0000000-0000-4000-8000-000000000001'::uuid $$;
CREATE FUNCTION omh_test.auth_b() RETURNS uuid LANGUAGE sql IMMUTABLE AS $$ SELECT 'a0000000-0000-4000-8000-000000000002'::uuid $$;
CREATE FUNCTION omh_test.auth_c() RETURNS uuid LANGUAGE sql IMMUTABLE AS $$ SELECT 'a0000000-0000-4000-8000-000000000003'::uuid $$;
CREATE FUNCTION omh_test.auth_l() RETURNS uuid LANGUAGE sql IMMUTABLE AS $$ SELECT 'a0000000-0000-4000-8000-000000000004'::uuid $$;
CREATE FUNCTION omh_test.profile_a() RETURNS uuid LANGUAGE sql IMMUTABLE AS $$ SELECT 'b0000000-0000-4000-8000-000000000001'::uuid $$;
CREATE FUNCTION omh_test.profile_b() RETURNS uuid LANGUAGE sql IMMUTABLE AS $$ SELECT 'b0000000-0000-4000-8000-000000000002'::uuid $$;
CREATE FUNCTION omh_test.profile_c() RETURNS uuid LANGUAGE sql IMMUTABLE AS $$ SELECT 'b0000000-0000-4000-8000-000000000003'::uuid $$;
CREATE FUNCTION omh_test.profile_l() RETURNS uuid LANGUAGE sql IMMUTABLE AS $$ SELECT 'b0000000-0000-4000-8000-000000000004'::uuid $$;
CREATE FUNCTION omh_test.profile_t() RETURNS uuid LANGUAGE sql IMMUTABLE AS $$ SELECT 'b0000000-0000-4000-8000-000000000005'::uuid $$;
CREATE FUNCTION omh_test.community_1() RETURNS uuid LANGUAGE sql IMMUTABLE AS $$ SELECT 'c0000000-0000-4000-8000-000000000001'::uuid $$;
CREATE FUNCTION omh_test.community_2() RETURNS uuid LANGUAGE sql IMMUTABLE AS $$ SELECT 'c0000000-0000-4000-8000-000000000002'::uuid $$;
CREATE FUNCTION omh_test.rule_1() RETURNS uuid LANGUAGE sql IMMUTABLE AS $$ SELECT 'd0000000-0000-4000-8000-000000000001'::uuid $$;
CREATE FUNCTION omh_test.tournament_1() RETURNS uuid LANGUAGE sql IMMUTABLE AS $$ SELECT 'e0000000-0000-4000-8000-000000000001'::uuid $$;
CREATE FUNCTION omh_test.t_rule_used() RETURNS uuid LANGUAGE sql IMMUTABLE AS $$ SELECT 'f0000000-0000-4000-8000-000000000001'::uuid $$;
CREATE FUNCTION omh_test.t_rule_free() RETURNS uuid LANGUAGE sql IMMUTABLE AS $$ SELECT 'f0000000-0000-4000-8000-000000000002'::uuid $$;
CREATE FUNCTION omh_test.part_a() RETURNS uuid LANGUAGE sql IMMUTABLE AS $$ SELECT '11000000-0000-4000-8000-000000000001'::uuid $$;
CREATE FUNCTION omh_test.part_c() RETURNS uuid LANGUAGE sql IMMUTABLE AS $$ SELECT '11000000-0000-4000-8000-000000000003'::uuid $$;
CREATE FUNCTION omh_test.part_l() RETURNS uuid LANGUAGE sql IMMUTABLE AS $$ SELECT '11000000-0000-4000-8000-000000000004'::uuid $$;
CREATE FUNCTION omh_test.part_t() RETURNS uuid LANGUAGE sql IMMUTABLE AS $$ SELECT '11000000-0000-4000-8000-000000000005'::uuid $$;
CREATE FUNCTION omh_test.part_guest() RETURNS uuid LANGUAGE sql IMMUTABLE AS $$ SELECT '11000000-0000-4000-8000-000000000006'::uuid $$;
CREATE FUNCTION omh_test.match_1() RETURNS uuid LANGUAGE sql IMMUTABLE AS $$ SELECT '12000000-0000-4000-8000-000000000001'::uuid $$;
GRANT USAGE ON SCHEMA omh_test TO authenticated, anon;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA omh_test TO authenticated, anon;

