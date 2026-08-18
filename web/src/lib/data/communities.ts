import { describePlayerCounts } from "@/lib/domain";
import { requireActiveProfile } from "@/lib/data/auth";
import { countFromEmbed, isUuid } from "@/lib/data/helpers";
import { toProfile } from "@/lib/data/mappers";
import type {
  CommunityDetail,
  CommunityInvite,
  CommunityMember,
  CommunityRuleListItem,
  CommunityTournamentListItem,
  ProfileDetail,
} from "@/lib/data/types";

type MembershipEmbed = {
  user_id: string;
  profiles:
    | {
        id: string;
        display_name: string;
        avatar_url: string | null;
        comment: string | null;
      }
    | {
        id: string;
        display_name: string;
        avatar_url: string | null;
        comment: string | null;
      }[]
    | null;
};

type TournamentEmbed = {
  id: string;
  name: string;
  held_on: string;
  tournament_rules: { player_count: number }[] | null;
  matches: { count: number }[] | null;
};

function embeddedProfile(value: MembershipEmbed["profiles"]) {
  if (!value) {
    return null;
  }
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

export async function getCommunityDetail(
  communityId: string,
): Promise<CommunityDetail | null> {
  if (!isUuid(communityId)) {
    return null;
  }

  const { supabase, profile } = await requireActiveProfile();

  const { data: community, error: communityError } = await supabase
    .from("communities")
    .select("id, name, comment")
    .eq("id", communityId)
    .maybeSingle();

  if (communityError) {
    throw new Error("麻雀グループを取得できませんでした。");
  }
  if (!community) {
    return null;
  }

  const { data: membershipRows, error: memberError } = await supabase
    .from("community_memberships")
    .select("user_id, profiles(id, display_name, avatar_url, comment)")
    .eq("community_id", communityId);

  if (memberError) {
    throw new Error("メンバーを取得できませんでした。");
  }

  const members: CommunityMember[] = (
    (membershipRows ?? []) as MembershipEmbed[]
  )
    .map((row) => {
      const memberProfile = embeddedProfile(row.profiles);
      return {
        userId: row.user_id,
        displayName: memberProfile?.display_name ?? row.user_id,
        avatarUrl: memberProfile?.avatar_url ?? null,
        isCurrentUser: row.user_id === profile.id,
      };
    })
    .sort((a, b) => Number(b.isCurrentUser) - Number(a.isCurrentUser));

  const { data: ruleRows, error: ruleError } = await supabase
    .from("community_rules")
    .select("id, name, player_count")
    .eq("community_id", communityId)
    .order("created_at", { ascending: true });

  if (ruleError) {
    throw new Error("ルールを取得できませんでした。");
  }

  const rules: CommunityRuleListItem[] = (ruleRows ?? []).flatMap((row) => {
    if (row.player_count !== 3 && row.player_count !== 4) {
      return [];
    }
    return [
      {
        id: row.id,
        name: row.name,
        playerCount: row.player_count,
      },
    ];
  });

  const { data: tournamentRows, error: tournamentError } = await supabase
    .from("tournaments")
    .select("id, name, held_on, tournament_rules(player_count), matches(count)")
    .eq("community_id", communityId)
    .order("held_on", { ascending: false });

  if (tournamentError) {
    throw new Error("大会を取得できませんでした。");
  }

  const tournaments: CommunityTournamentListItem[] = (
    (tournamentRows ?? []) as unknown as TournamentEmbed[]
  ).map((row) => ({
    id: row.id,
    name: row.name,
    heldOn: row.held_on,
    ruleLabel: describePlayerCounts(
      (row.tournament_rules ?? []).map((rule) => rule.player_count),
    ),
    matchCount: countFromEmbed(row.matches),
  }));

  return {
    id: community.id,
    name: community.name,
    comment: community.comment ?? "",
    memberCount: members.length,
    members,
    rules,
    tournaments,
  };
}

export async function getCommunityInvite(
  communityId: string,
): Promise<CommunityInvite | null> {
  if (!isUuid(communityId)) {
    return null;
  }

  const { supabase } = await requireActiveProfile();
  const { data, error } = await supabase
    .from("community_invite_codes")
    .select("code, expires_at")
    .eq("community_id", communityId)
    .maybeSingle();

  if (error) {
    throw new Error("招待コードを取得できませんでした。");
  }
  if (!data) {
    return null;
  }
  return {
    code: data.code,
    expiresAt: data.expires_at,
  };
}

export async function getProfileDetail(
  userId: string,
): Promise<ProfileDetail | null> {
  if (!isUuid(userId)) {
    return null;
  }

  const { supabase, profile } = await requireActiveProfile();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, display_name, comment, avatar_url")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw new Error("プロフィールを取得できませんでした。");
  }
  if (!data) {
    return null;
  }

  return {
    ...toProfile(data),
    isCurrentUser: data.id === profile.id,
  };
}

export async function isMemberOfCommunity(
  communityId: string,
  userId: string,
): Promise<boolean> {
  if (!isUuid(communityId) || !isUuid(userId)) {
    return false;
  }

  const { supabase } = await requireActiveProfile();
  const { data, error } = await supabase
    .from("community_memberships")
    .select("id")
    .eq("community_id", communityId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error("メンバーを確認できませんでした。");
  }
  return data !== null;
}

export function communityIdFromPath(from: string | undefined): string | null {
  if (!from || !from.startsWith("/") || from.startsWith("//")) {
    return null;
  }
  const match = from.match(/^\/communities\/([0-9a-f-]{36})(?:\/|$)/i);
  if (!match?.[1] || !isUuid(match[1])) {
    return null;
  }
  return match[1];
}
