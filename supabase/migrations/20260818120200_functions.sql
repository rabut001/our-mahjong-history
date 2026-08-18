-- Phase 3-6: 麻雀グループ作成・参加・離脱・退会。呼び出し人 ID は引数に取らない。

CREATE FUNCTION private.normalize_invite_code(code text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT replace(replace(replace(upper(code), 'I', '1'), 'L', '1'), 'O', '0')
$$;

REVOKE ALL ON FUNCTION private.normalize_invite_code(text) FROM PUBLIC;

CREATE FUNCTION public.create_community(name text, comment text DEFAULT NULL)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  actor uuid;
  new_id uuid;
BEGIN
  actor := private.current_active_profile_id();
  IF actor IS NULL OR auth.uid() IS NULL THEN
    RAISE EXCEPTION 'ログイン中の利用中プロフィールが必要です'
      USING ERRCODE = '42501';
  END IF;

  INSERT INTO public.communities (name, comment)
  VALUES (name, comment)
  RETURNING id INTO new_id;

  INSERT INTO public.community_memberships (community_id, user_id)
  VALUES (new_id, actor);

  RETURN new_id;
END;
$$;

CREATE FUNCTION public.join_community(code text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  actor uuid;
  normalized text;
  invite public.community_invite_codes%ROWTYPE;
BEGIN
  actor := private.current_active_profile_id();
  IF actor IS NULL OR auth.uid() IS NULL THEN
    RAISE EXCEPTION 'ログイン中の利用中プロフィールが必要です'
      USING ERRCODE = '42501';
  END IF;

  normalized := private.normalize_invite_code(code);

  SELECT *
  INTO invite
  FROM public.community_invite_codes c
  WHERE c.code = normalized;

  IF invite.id IS NULL THEN
    RAISE EXCEPTION '招待コードが無効です'
      USING ERRCODE = 'P0002';
  END IF;

  IF (timezone('Asia/Tokyo', now()))::date
     > (timezone('Asia/Tokyo', invite.expires_at))::date THEN
    RAISE EXCEPTION '招待コードの期限が切れています'
      USING ERRCODE = 'P0002';
  END IF;

  INSERT INTO public.community_memberships (community_id, user_id)
  VALUES (invite.community_id, actor)
  ON CONFLICT (community_id, user_id) DO NOTHING;

  RETURN invite.community_id;
END;
$$;

CREATE FUNCTION public.leave_community(community_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  actor uuid;
  deleted integer;
BEGIN
  actor := private.current_active_profile_id();
  IF actor IS NULL OR auth.uid() IS NULL THEN
    RAISE EXCEPTION 'ログイン中の利用中プロフィールが必要です'
      USING ERRCODE = '42501';
  END IF;

  DELETE FROM public.community_memberships m
  WHERE m.community_id = leave_community.community_id
    AND m.user_id = actor;

  GET DIAGNOSTICS deleted = ROW_COUNT;
  IF deleted = 0 THEN
    RAISE EXCEPTION '所属していない麻雀グループからは離脱できない'
      USING ERRCODE = 'P0002';
  END IF;
END;
$$;

CREATE FUNCTION public.withdraw_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  actor uuid;
BEGIN
  actor := private.current_active_profile_id();
  IF actor IS NULL OR auth.uid() IS NULL THEN
    RAISE EXCEPTION 'ログイン中の利用中プロフィールが必要です'
      USING ERRCODE = '42501';
  END IF;

  PERFORM set_config('omh.withdrawing', 'on', true);

  UPDATE public.profiles
  SET
    display_name = '退会済みユーザ',
    comment = NULL,
    avatar_url = NULL,
    withdrawn_at = now(),
    auth_user_id = NULL
  WHERE id = actor;

  DELETE FROM public.community_memberships
  WHERE user_id = actor;
END;
$$;

REVOKE ALL ON FUNCTION public.create_community(text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.join_community(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.leave_community(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.withdraw_account() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.create_community(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.join_community(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.leave_community(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.withdraw_account() TO authenticated;
