import { createClient } from "@/lib/supabase/server";
import type {
  HomeCommunity,
  HomePageData,
  HomeProfile,
} from "@/lib/data/types";

function toProfile(row: {
  id: string;
  display_name: string;
  comment: string | null;
  avatar_url: string | null;
}): HomeProfile {
  return {
    id: row.id,
    displayName: row.display_name,
    comment: row.comment ?? "",
    avatarUrl: row.avatar_url,
  };
}

function memberCountFromEmbed(value: unknown) {
  if (!Array.isArray(value) || value.length === 0) {
    return 0;
  }
  const first = value[0];
  if (
    typeof first === "object" &&
    first !== null &&
    "count" in first &&
    typeof first.count === "number"
  ) {
    return first.count;
  }
  return 0;
}

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
    memberCount: memberCountFromEmbed(row.community_memberships),
  }));

  return {
    profile: profileRow ? toProfile(profileRow) : null,
    communities,
  };
}
