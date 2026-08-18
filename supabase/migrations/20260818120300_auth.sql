-- Phase 3-7: Auth 登録時に利用中 profiles を付ける。画面は触らない。

CREATE FUNCTION private.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_display_name text;
  new_avatar_url text;
  provider text;
BEGIN
  new_display_name := private.nullify_if_blank(NEW.raw_user_meta_data->>'display_name');
  IF new_display_name IS NULL THEN
    new_display_name := private.nullify_if_blank(NEW.raw_user_meta_data->>'full_name');
  END IF;
  IF new_display_name IS NULL THEN
    new_display_name := private.nullify_if_blank(NEW.raw_user_meta_data->>'name');
  END IF;
  IF new_display_name IS NULL THEN
    new_display_name := private.nullify_if_blank(split_part(COALESCE(NEW.email, ''), '@', 1));
  END IF;
  IF new_display_name IS NULL OR new_display_name = '退会済みユーザ' THEN
    RAISE EXCEPTION '登録時の表示名が決まりません'
      USING ERRCODE = 'P0001';
  END IF;

  provider := COALESCE(NEW.raw_app_meta_data->>'provider', 'email');
  IF provider IS DISTINCT FROM 'email' THEN
    new_avatar_url := private.nullify_if_blank(NEW.raw_user_meta_data->>'avatar_url');
    IF new_avatar_url IS NULL THEN
      new_avatar_url := private.nullify_if_blank(NEW.raw_user_meta_data->>'picture');
    END IF;
  END IF;

  INSERT INTO public.profiles (auth_user_id, display_name, avatar_url)
  VALUES (NEW.id, new_display_name, new_avatar_url);

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION private.handle_new_user() FROM PUBLIC;

CREATE TRIGGER trg_handle_new_user
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION private.handle_new_user();
