-- Phase 3-5: 所属判定ヘルパーと全業務テーブルの RLS / GRANT。

CREATE FUNCTION private.current_active_profile_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id
  FROM public.profiles p
  WHERE p.auth_user_id = auth.uid()
    AND p.withdrawn_at IS NULL
$$;

REVOKE ALL ON FUNCTION private.current_active_profile_id() FROM PUBLIC;

CREATE FUNCTION private.is_community_member(community_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.community_memberships m
    JOIN public.profiles p ON p.id = m.user_id
    WHERE m.community_id = is_community_member.community_id
      AND p.auth_user_id = auth.uid()
      AND p.withdrawn_at IS NULL
  )
$$;

REVOKE ALL ON FUNCTION private.is_community_member(uuid) FROM PUBLIC;
GRANT USAGE ON SCHEMA private TO authenticated;
GRANT EXECUTE ON FUNCTION private.is_community_member(uuid) TO authenticated;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_invite_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_point_adjustments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- profiles: SELECT (1)(2)(3)。INSERT / DELETE なし。UPDATE は本人のみ。
CREATE POLICY profiles_select ON public.profiles
  FOR SELECT TO authenticated
  USING (
    auth_user_id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.community_memberships m
      WHERE m.user_id = profiles.id
        AND private.is_community_member(m.community_id)
    )
    OR EXISTS (
      SELECT 1
      FROM public.tournament_participants tp
      JOIN public.tournaments t ON t.id = tp.tournament_id
      WHERE tp.user_id = profiles.id
        AND private.is_community_member(t.community_id)
    )
  );

CREATE POLICY profiles_update ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth_user_id = auth.uid())
  WITH CHECK (auth_user_id = auth.uid());

CREATE POLICY communities_select ON public.communities
  FOR SELECT TO authenticated
  USING (private.is_community_member(id));

CREATE POLICY communities_update ON public.communities
  FOR UPDATE TO authenticated
  USING (private.is_community_member(id))
  WITH CHECK (private.is_community_member(id));

CREATE POLICY communities_delete ON public.communities
  FOR DELETE TO authenticated
  USING (private.is_community_member(id));

CREATE POLICY community_memberships_select ON public.community_memberships
  FOR SELECT TO authenticated
  USING (private.is_community_member(community_id));

CREATE POLICY community_memberships_delete ON public.community_memberships
  FOR DELETE TO authenticated
  USING (private.is_community_member(community_id));

CREATE POLICY community_rules_all ON public.community_rules
  FOR ALL TO authenticated
  USING (private.is_community_member(community_id))
  WITH CHECK (private.is_community_member(community_id));

CREATE POLICY community_invite_codes_all ON public.community_invite_codes
  FOR ALL TO authenticated
  USING (private.is_community_member(community_id))
  WITH CHECK (private.is_community_member(community_id));

CREATE POLICY tournaments_all ON public.tournaments
  FOR ALL TO authenticated
  USING (private.is_community_member(community_id))
  WITH CHECK (private.is_community_member(community_id));

CREATE POLICY tournament_rules_all ON public.tournament_rules
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.tournaments t
      WHERE t.id = tournament_rules.tournament_id
        AND private.is_community_member(t.community_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.tournaments t
      WHERE t.id = tournament_rules.tournament_id
        AND private.is_community_member(t.community_id)
    )
  );

CREATE POLICY tournament_participants_all ON public.tournament_participants
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.tournaments t
      WHERE t.id = tournament_participants.tournament_id
        AND private.is_community_member(t.community_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.tournaments t
      WHERE t.id = tournament_participants.tournament_id
        AND private.is_community_member(t.community_id)
    )
  );

CREATE POLICY tournament_point_adjustments_all ON public.tournament_point_adjustments
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.tournament_participants tp
      JOIN public.tournaments t ON t.id = tp.tournament_id
      WHERE tp.id = tournament_point_adjustments.tournament_participant_id
        AND private.is_community_member(t.community_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.tournament_participants tp
      JOIN public.tournaments t ON t.id = tp.tournament_id
      WHERE tp.id = tournament_point_adjustments.tournament_participant_id
        AND private.is_community_member(t.community_id)
    )
  );

CREATE POLICY matches_all ON public.matches
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.tournaments t
      WHERE t.id = matches.tournament_id
        AND private.is_community_member(t.community_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.tournaments t
      WHERE t.id = matches.tournament_id
        AND private.is_community_member(t.community_id)
    )
  );

CREATE POLICY match_results_all ON public.match_results
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.matches m
      JOIN public.tournaments t ON t.id = m.tournament_id
      WHERE m.id = match_results.match_id
        AND private.is_community_member(t.community_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.matches m
      JOIN public.tournaments t ON t.id = m.tournament_id
      WHERE m.id = match_results.match_id
        AND private.is_community_member(t.community_id)
    )
  );

REVOKE ALL ON ALL TABLES IN SCHEMA public FROM PUBLIC, anon, authenticated;

GRANT SELECT ON public.profiles TO authenticated;
GRANT UPDATE (display_name, comment, avatar_url, updated_at) ON public.profiles TO authenticated;

GRANT SELECT, UPDATE, DELETE ON public.communities TO authenticated;
GRANT SELECT, DELETE ON public.community_memberships TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.community_rules TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.community_invite_codes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tournaments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tournament_rules TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tournament_participants TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tournament_point_adjustments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.matches TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.match_results TO authenticated;

GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT USAGE ON SCHEMA private TO service_role;
GRANT EXECUTE ON FUNCTION private.is_community_member(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION private.current_active_profile_id() TO service_role;
