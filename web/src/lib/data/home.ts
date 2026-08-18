import { createClient } from "@/lib/supabase/server";
import { toProfile } from "@/lib/data/mappers";
import { countFromEmbed } from "@/lib/data/helpers";
import type { HomeCommunity, HomePageData } from "@/lib/data/types";

export async function getHomePageData(): Promise<HomePageData | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return null;
  }

  const { data: profileRow, error: profileError } = await supabase
    .from("profiles")
    .select("id, display_name, comment, avatar_url")
    .eq("auth_user_id", user.id)
    .is("withdrawn_at", null)
    .maybeSingle();

  if (profileError) {
    throw new Error("プロフィールを取得できませんでした。");
  }

  const { data: communityRows, error: communityError } = await supabase
    .from("communities")
    .select("id, name, community_memberships(count)")
    .order("created_at", { ascending: false });

  if (communityError) {
    throw new Error("麻雀グループを取得できませんでした。");
  }

  const communities: HomeCommunity[] = (communityRows ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    memberCount: countFromEmbed(row.community_memberships),
  }));

  return {
    profile: profileRow ? toProfile(profileRow) : null,
    communities,
  };
}
