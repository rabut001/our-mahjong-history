-- Phase 3-4: テーブル・制約・FK・trigger。RLS / RPC は後続 migration。

CREATE SCHEMA private;
COMMENT ON SCHEMA private IS 'Internal helpers and triggers. Not exposed via PostgREST.';
REVOKE ALL ON SCHEMA private FROM PUBLIC;

CREATE TYPE public.tie_handling AS ENUM ('kamicha', 'split', 'manual');
CREATE TYPE public.seat AS ENUM ('east', 'south', 'west', 'north');
CREATE TYPE public.activity_action AS ENUM ('insert', 'update', 'delete');

-- ---------------------------------------------------------------------------
-- 共通 trigger
-- ---------------------------------------------------------------------------

CREATE FUNCTION private.nullify_if_blank(value text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE WHEN value IS NULL OR btrim(value) = '' THEN NULL ELSE value END;
$$;

CREATE FUNCTION private.tg_set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE FUNCTION private.trg_append_activity_log()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  log_entity_type text;
  log_entity_id uuid;
  actor uuid;
  row_id uuid;
  row_participant_id uuid;
BEGIN
  IF pg_trigger_depth() > 1 THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  SELECT p.id
  INTO actor
  FROM public.profiles p
  WHERE p.auth_user_id = auth.uid()
    AND p.withdrawn_at IS NULL;

  IF actor IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  IF TG_OP = 'DELETE' THEN
    row_id := OLD.id;
  ELSE
    row_id := NEW.id;
  END IF;

  CASE TG_TABLE_NAME
    WHEN 'communities' THEN
      log_entity_type := 'community';
      log_entity_id := row_id;
    WHEN 'community_memberships' THEN
      log_entity_type := 'community';
      log_entity_id := COALESCE(NEW.community_id, OLD.community_id);
    WHEN 'community_rules' THEN
      log_entity_type := 'community';
      log_entity_id := COALESCE(NEW.community_id, OLD.community_id);
    WHEN 'community_invite_codes' THEN
      log_entity_type := 'community';
      log_entity_id := COALESCE(NEW.community_id, OLD.community_id);
    WHEN 'tournaments' THEN
      log_entity_type := 'tournament';
      log_entity_id := row_id;
    WHEN 'tournament_rules' THEN
      log_entity_type := 'tournament';
      log_entity_id := COALESCE(NEW.tournament_id, OLD.tournament_id);
    WHEN 'tournament_participants' THEN
      log_entity_type := 'tournament';
      log_entity_id := COALESCE(NEW.tournament_id, OLD.tournament_id);
    WHEN 'tournament_point_adjustments' THEN
      log_entity_type := 'tournament';
      row_participant_id := COALESCE(NEW.tournament_participant_id, OLD.tournament_participant_id);
      SELECT tp.tournament_id
      INTO log_entity_id
      FROM public.tournament_participants tp
      WHERE tp.id = row_participant_id;
    WHEN 'matches' THEN
      log_entity_type := 'match';
      log_entity_id := row_id;
    WHEN 'match_results' THEN
      log_entity_type := 'match';
      log_entity_id := COALESCE(NEW.match_id, OLD.match_id);
      IF TG_OP = 'DELETE' AND NOT EXISTS (
        SELECT 1 FROM public.matches m WHERE m.id = OLD.match_id
      ) THEN
        RETURN OLD;
      END IF;
    ELSE
      RAISE EXCEPTION 'activity log: unknown table %', TG_TABLE_NAME;
  END CASE;

  IF log_entity_id IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  INSERT INTO public.activity_logs (entity_type, entity_id, action, actor_user_id)
  VALUES (
    log_entity_type,
    log_entity_id,
    CASE TG_OP
      WHEN 'INSERT' THEN 'insert'::public.activity_action
      WHEN 'UPDATE' THEN 'update'::public.activity_action
      WHEN 'DELETE' THEN 'delete'::public.activity_action
    END,
    actor
  );

  RETURN COALESCE(NEW, OLD);
END;
$$;

REVOKE ALL ON FUNCTION private.trg_append_activity_log() FROM PUBLIC;

CREATE FUNCTION private.trg_delete_community_if_last_member()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.community_memberships
    WHERE community_id = OLD.community_id
  ) THEN
    RETURN OLD;
  END IF;

  DELETE FROM public.matches
  WHERE tournament_id IN (
    SELECT id FROM public.tournaments WHERE community_id = OLD.community_id
  );

  DELETE FROM public.tournament_participants
  WHERE tournament_id IN (
    SELECT id FROM public.tournaments WHERE community_id = OLD.community_id
  );

  DELETE FROM public.tournament_rules
  WHERE tournament_id IN (
    SELECT id FROM public.tournaments WHERE community_id = OLD.community_id
  );

  DELETE FROM public.tournaments
  WHERE community_id = OLD.community_id;

  DELETE FROM public.community_rules
  WHERE community_id = OLD.community_id;

  DELETE FROM public.communities
  WHERE id = OLD.community_id;

  RETURN OLD;
END;
$$;

REVOKE ALL ON FUNCTION private.trg_delete_community_if_last_member() FROM PUBLIC;

CREATE FUNCTION private.trg_protect_profile_tombstone()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE'
     AND current_setting('omh.withdrawing', true) IS DISTINCT FROM 'on'
     AND (
       NEW.withdrawn_at IS DISTINCT FROM OLD.withdrawn_at
       OR NEW.auth_user_id IS DISTINCT FROM OLD.auth_user_id
     ) THEN
    RAISE EXCEPTION 'withdrawn_at / auth_user_id は withdraw_account のみが変更できる'
      USING ERRCODE = '42501';
  END IF;

  NEW.comment := private.nullify_if_blank(NEW.comment);
  NEW.avatar_url := private.nullify_if_blank(NEW.avatar_url);
  RETURN NEW;
END;
$$;

CREATE FUNCTION private.trg_uppercase_invite_code()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.code := upper(NEW.code);
  RETURN NEW;
END;
$$;

CREATE FUNCTION private.trg_prevent_used_tournament_rule_update()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.matches m WHERE m.tournament_rule_id = NEW.id
  ) THEN
    RAISE EXCEPTION '試合で使用中の大会ルールは修正できない'
      USING ERRCODE = 'P0001';
  END IF;
  RETURN NEW;
END;
$$;

CREATE FUNCTION private.trg_participant_must_be_current_member()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  parent_community uuid;
BEGIN
  IF NEW.user_id IS NULL THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' AND NEW.user_id IS NOT DISTINCT FROM OLD.user_id THEN
    RETURN NEW;
  END IF;

  SELECT t.community_id
  INTO parent_community
  FROM public.tournaments t
  WHERE t.id = NEW.tournament_id;

  IF NOT EXISTS (
    SELECT 1
    FROM public.community_memberships m
    JOIN public.profiles p ON p.id = m.user_id
    WHERE m.community_id = parent_community
      AND m.user_id = NEW.user_id
      AND p.withdrawn_at IS NULL
      AND p.auth_user_id IS NOT NULL
  ) THEN
    RAISE EXCEPTION '大会参加者の user_id は当該麻雀グループの現メンバーであること'
      USING ERRCODE = 'P0001';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION private.trg_participant_must_be_current_member() FROM PUBLIC;

-- ---------------------------------------------------------------------------
-- テーブル
-- ---------------------------------------------------------------------------

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id uuid UNIQUE REFERENCES auth.users (id) ON DELETE SET NULL,
  display_name text NOT NULL,
  comment text,
  avatar_url text,
  withdrawn_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT profiles_active_or_tombstone_chk CHECK (
    (
      auth_user_id IS NOT NULL
      AND withdrawn_at IS NULL
      AND display_name <> '退会済みユーザ'
    )
    OR (
      auth_user_id IS NULL
      AND withdrawn_at IS NOT NULL
      AND display_name = '退会済みユーザ'
    )
  )
);

CREATE TABLE public.communities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  comment text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.community_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id uuid NOT NULL REFERENCES public.communities (id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE RESTRICT,
  joined_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT community_memberships_community_user_key UNIQUE (community_id, user_id)
);

CREATE TABLE public.community_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id uuid NOT NULL REFERENCES public.communities (id) ON DELETE RESTRICT,
  name text NOT NULL,
  player_count integer NOT NULL,
  starting_score integer NOT NULL,
  return_score integer NOT NULL,
  oka_tie_handling public.tie_handling NOT NULL,
  uma_enabled boolean NOT NULL,
  uma_tie_handling public.tie_handling,
  uma_points_1 integer,
  uma_points_2 integer,
  tobi_enabled boolean NOT NULL,
  yakitori_enabled boolean NOT NULL,
  other_points_1_name text,
  other_points_2_name text,
  other_points_3_name text,
  other_points_4_name text,
  other_points_5_name text,
  rate numeric NOT NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT community_rules_community_name_key UNIQUE (community_id, name),
  CONSTRAINT community_rules_player_count_chk CHECK (player_count IN (3, 4)),
  CONSTRAINT community_rules_rate_chk CHECK (rate >= 0),
  CONSTRAINT community_rules_uma_disabled_cols_chk CHECK (
    uma_enabled
    OR (
      uma_tie_handling IS NULL
      AND uma_points_1 IS NULL
      AND uma_points_2 IS NULL
    )
  ),
  CONSTRAINT community_rules_uma_enabled_required_chk CHECK (
    NOT uma_enabled
    OR (
      uma_tie_handling IS NOT NULL
      AND uma_points_1 IS NOT NULL
    )
  ),
  CONSTRAINT community_rules_uma_points_2_chk CHECK (
    NOT uma_enabled
    OR (player_count = 4 AND uma_points_2 IS NOT NULL)
    OR (player_count = 3 AND uma_points_2 IS NULL)
  )
);

CREATE TABLE public.tournaments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id uuid NOT NULL REFERENCES public.communities (id) ON DELETE RESTRICT,
  held_on date NOT NULL,
  name text NOT NULL,
  adjustment_points_1_title text,
  adjustment_points_2_title text,
  adjustment_points_3_title text,
  adjustment_points_4_title text,
  adjustment_points_5_title text,
  memo text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.tournament_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid NOT NULL REFERENCES public.tournaments (id) ON DELETE RESTRICT,
  name text NOT NULL,
  player_count integer NOT NULL,
  starting_score integer NOT NULL,
  return_score integer NOT NULL,
  oka_tie_handling public.tie_handling NOT NULL,
  uma_enabled boolean NOT NULL,
  uma_tie_handling public.tie_handling,
  uma_points_1 integer,
  uma_points_2 integer,
  tobi_enabled boolean NOT NULL,
  yakitori_enabled boolean NOT NULL,
  other_points_1_name text,
  other_points_2_name text,
  other_points_3_name text,
  other_points_4_name text,
  other_points_5_name text,
  rate numeric NOT NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT tournament_rules_tournament_name_key UNIQUE (tournament_id, name),
  CONSTRAINT tournament_rules_id_tournament_key UNIQUE (id, tournament_id),
  CONSTRAINT tournament_rules_player_count_chk CHECK (player_count IN (3, 4)),
  CONSTRAINT tournament_rules_rate_chk CHECK (rate >= 0),
  CONSTRAINT tournament_rules_uma_disabled_cols_chk CHECK (
    uma_enabled
    OR (
      uma_tie_handling IS NULL
      AND uma_points_1 IS NULL
      AND uma_points_2 IS NULL
    )
  ),
  CONSTRAINT tournament_rules_uma_enabled_required_chk CHECK (
    NOT uma_enabled
    OR (
      uma_tie_handling IS NOT NULL
      AND uma_points_1 IS NOT NULL
    )
  ),
  CONSTRAINT tournament_rules_uma_points_2_chk CHECK (
    NOT uma_enabled
    OR (player_count = 4 AND uma_points_2 IS NOT NULL)
    OR (player_count = 3 AND uma_points_2 IS NULL)
  )
);

CREATE TABLE public.tournament_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid NOT NULL REFERENCES public.tournaments (id) ON DELETE RESTRICT,
  user_id uuid REFERENCES public.profiles (id) ON DELETE RESTRICT,
  guest_display_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT tournament_participants_member_xor_guest_chk CHECK (
    (user_id IS NOT NULL AND guest_display_name IS NULL)
    OR (user_id IS NULL AND guest_display_name IS NOT NULL)
  ),
  CONSTRAINT tournament_participants_guest_name_chk CHECK (
    guest_display_name IS NULL OR length(btrim(guest_display_name)) > 0
  )
);

CREATE UNIQUE INDEX tournament_participants_tournament_user_key
  ON public.tournament_participants (tournament_id, user_id)
  WHERE user_id IS NOT NULL;

CREATE UNIQUE INDEX tournament_participants_tournament_guest_key
  ON public.tournament_participants (tournament_id, guest_display_name)
  WHERE guest_display_name IS NOT NULL;

CREATE TABLE public.tournament_point_adjustments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_participant_id uuid NOT NULL UNIQUE
    REFERENCES public.tournament_participants (id) ON DELETE CASCADE,
  adjustment_points_1 numeric NOT NULL,
  adjustment_points_2 numeric NOT NULL,
  adjustment_points_3 numeric NOT NULL,
  adjustment_points_4 numeric NOT NULL,
  adjustment_points_5 numeric NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid NOT NULL REFERENCES public.tournaments (id) ON DELETE RESTRICT,
  tournament_rule_id uuid NOT NULL,
  manual_points_1_title text,
  manual_points_2_title text,
  manual_points_3_title text,
  comment text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT matches_rule_same_tournament_fk
    FOREIGN KEY (tournament_rule_id, tournament_id)
    REFERENCES public.tournament_rules (id, tournament_id)
    ON DELETE RESTRICT
);

CREATE TABLE public.match_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid NOT NULL REFERENCES public.matches (id) ON DELETE CASCADE,
  tournament_participant_id uuid NOT NULL
    REFERENCES public.tournament_participants (id) ON DELETE RESTRICT,
  seat public.seat NOT NULL,
  score integer NOT NULL,
  base_points numeric NOT NULL,
  uma_points numeric NOT NULL,
  tobi_points numeric NOT NULL,
  yakitori_points numeric NOT NULL,
  other_points_1 numeric NOT NULL,
  other_points_2 numeric NOT NULL,
  other_points_3 numeric NOT NULL,
  other_points_4 numeric NOT NULL,
  other_points_5 numeric NOT NULL,
  manual_points_1 numeric NOT NULL,
  manual_points_2 numeric NOT NULL,
  manual_points_3 numeric NOT NULL,
  points numeric NOT NULL,
  rank integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT match_results_match_participant_key UNIQUE (match_id, tournament_participant_id),
  CONSTRAINT match_results_match_seat_key UNIQUE (match_id, seat),
  CONSTRAINT match_results_rank_chk CHECK (rank >= 1)
);

CREATE FUNCTION private.trg_match_result_same_tournament()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF (
    SELECT m.tournament_id FROM public.matches m WHERE m.id = NEW.match_id
  ) IS DISTINCT FROM (
    SELECT tp.tournament_id
    FROM public.tournament_participants tp
    WHERE tp.id = NEW.tournament_participant_id
  ) THEN
    RAISE EXCEPTION '試合結果の参加者は同じ大会のものであること'
      USING ERRCODE = 'P0001';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TABLE public.community_invite_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id uuid NOT NULL UNIQUE REFERENCES public.communities (id) ON DELETE CASCADE,
  code text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  created_by uuid NOT NULL REFERENCES public.profiles (id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT community_invite_codes_code_chk CHECK (code ~ '^[0-9A-HJKMNP-TV-Z]{10}$')
);

CREATE TABLE public.activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  action public.activity_action NOT NULL,
  actor_user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX community_memberships_user_id_idx ON public.community_memberships (user_id);
CREATE INDEX tournaments_community_id_idx ON public.tournaments (community_id);
CREATE INDEX matches_tournament_id_idx ON public.matches (tournament_id);
CREATE INDEX match_results_match_id_idx ON public.match_results (match_id);
CREATE INDEX activity_logs_entity_idx ON public.activity_logs (entity_type, entity_id);

-- ---------------------------------------------------------------------------
-- 行トリガー
-- ---------------------------------------------------------------------------

CREATE TRIGGER trg_profiles_protect_tombstone
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION private.trg_protect_profile_tombstone();

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION private.tg_set_updated_at();

CREATE TRIGGER trg_communities_updated_at
  BEFORE UPDATE ON public.communities
  FOR EACH ROW
  EXECUTE FUNCTION private.tg_set_updated_at();

CREATE TRIGGER trg_community_rules_updated_at
  BEFORE UPDATE ON public.community_rules
  FOR EACH ROW
  EXECUTE FUNCTION private.tg_set_updated_at();

CREATE TRIGGER trg_tournaments_updated_at
  BEFORE UPDATE ON public.tournaments
  FOR EACH ROW
  EXECUTE FUNCTION private.tg_set_updated_at();

CREATE TRIGGER trg_tournament_rules_block_used_update
  BEFORE UPDATE ON public.tournament_rules
  FOR EACH ROW
  EXECUTE FUNCTION private.trg_prevent_used_tournament_rule_update();

CREATE TRIGGER trg_tournament_rules_updated_at
  BEFORE UPDATE ON public.tournament_rules
  FOR EACH ROW
  EXECUTE FUNCTION private.tg_set_updated_at();

CREATE TRIGGER trg_tournament_participants_current_member
  BEFORE INSERT OR UPDATE ON public.tournament_participants
  FOR EACH ROW
  EXECUTE FUNCTION private.trg_participant_must_be_current_member();

CREATE TRIGGER trg_tournament_participants_updated_at
  BEFORE UPDATE ON public.tournament_participants
  FOR EACH ROW
  EXECUTE FUNCTION private.tg_set_updated_at();

CREATE TRIGGER trg_tournament_point_adjustments_updated_at
  BEFORE UPDATE ON public.tournament_point_adjustments
  FOR EACH ROW
  EXECUTE FUNCTION private.tg_set_updated_at();

CREATE TRIGGER trg_matches_updated_at
  BEFORE UPDATE ON public.matches
  FOR EACH ROW
  EXECUTE FUNCTION private.tg_set_updated_at();

CREATE TRIGGER trg_match_results_same_tournament
  BEFORE INSERT OR UPDATE ON public.match_results
  FOR EACH ROW
  EXECUTE FUNCTION private.trg_match_result_same_tournament();

CREATE TRIGGER trg_match_results_updated_at
  BEFORE UPDATE ON public.match_results
  FOR EACH ROW
  EXECUTE FUNCTION private.tg_set_updated_at();

CREATE TRIGGER trg_invite_uppercase_code
  BEFORE INSERT OR UPDATE ON public.community_invite_codes
  FOR EACH ROW
  EXECUTE FUNCTION private.trg_uppercase_invite_code();

-- 操作ログは名前順で last-member より先（起点の 1 行を残す）
CREATE TRIGGER trg_activity_log_communities
  AFTER INSERT OR UPDATE OR DELETE ON public.communities
  FOR EACH ROW
  EXECUTE FUNCTION private.trg_append_activity_log();

CREATE TRIGGER trg_activity_log_community_memberships
  AFTER INSERT OR UPDATE OR DELETE ON public.community_memberships
  FOR EACH ROW
  EXECUTE FUNCTION private.trg_append_activity_log();

CREATE TRIGGER trg_activity_log_community_rules
  AFTER INSERT OR UPDATE OR DELETE ON public.community_rules
  FOR EACH ROW
  EXECUTE FUNCTION private.trg_append_activity_log();

CREATE TRIGGER trg_activity_log_community_invite_codes
  AFTER INSERT OR UPDATE OR DELETE ON public.community_invite_codes
  FOR EACH ROW
  EXECUTE FUNCTION private.trg_append_activity_log();

CREATE TRIGGER trg_activity_log_tournaments
  AFTER INSERT OR UPDATE OR DELETE ON public.tournaments
  FOR EACH ROW
  EXECUTE FUNCTION private.trg_append_activity_log();

CREATE TRIGGER trg_activity_log_tournament_rules
  AFTER INSERT OR UPDATE OR DELETE ON public.tournament_rules
  FOR EACH ROW
  EXECUTE FUNCTION private.trg_append_activity_log();

CREATE TRIGGER trg_activity_log_tournament_participants
  AFTER INSERT OR UPDATE OR DELETE ON public.tournament_participants
  FOR EACH ROW
  EXECUTE FUNCTION private.trg_append_activity_log();

CREATE TRIGGER trg_activity_log_tournament_point_adjustments
  AFTER INSERT OR UPDATE OR DELETE ON public.tournament_point_adjustments
  FOR EACH ROW
  EXECUTE FUNCTION private.trg_append_activity_log();

CREATE TRIGGER trg_activity_log_matches
  AFTER INSERT OR UPDATE OR DELETE ON public.matches
  FOR EACH ROW
  EXECUTE FUNCTION private.trg_append_activity_log();

CREATE TRIGGER trg_activity_log_match_results
  AFTER INSERT OR UPDATE OR DELETE ON public.match_results
  FOR EACH ROW
  EXECUTE FUNCTION private.trg_append_activity_log();

CREATE TRIGGER trg_zzz_delete_community_if_last_member
  AFTER DELETE ON public.community_memberships
  FOR EACH ROW
  EXECUTE FUNCTION private.trg_delete_community_if_last_member();
