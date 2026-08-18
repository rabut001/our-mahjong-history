import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LOGIN_PATH } from "@/lib/supabase/paths";
import { toProfile } from "@/lib/data/mappers";
import type { HomeProfile } from "@/lib/data/types";
import type { User } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

type AppClient = SupabaseClient<Database>;

export async function requireSession(): Promise<{
  supabase: AppClient;
  user: User;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect(LOGIN_PATH);
  }
  return { supabase, user };
}

export async function requireActiveProfile(): Promise<{
  supabase: AppClient;
  user: User;
  profile: HomeProfile;
}> {
  const { supabase, user } = await requireSession();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, display_name, comment, avatar_url")
    .eq("auth_user_id", user.id)
    .is("withdrawn_at", null)
    .maybeSingle();

  if (error) {
    throw new Error("プロフィールを取得できませんでした。");
  }
  if (!data) {
    redirect(LOGIN_PATH);
  }
  return { supabase, user, profile: toProfile(data) };
}
