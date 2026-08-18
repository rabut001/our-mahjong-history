import type { ParsedRule, RuleFormData } from "@/lib/domain";
import { requireActiveProfile } from "@/lib/data/auth";
import { isUuid } from "@/lib/data/helpers";

export function toRuleInsert(rule: ParsedRule) {
  return {
    name: rule.name,
    player_count: rule.playerCount,
    starting_score: rule.startingScore,
    return_score: rule.returnScore,
    oka_tie_handling: rule.okaTieHandling,
    uma_enabled: rule.umaEnabled,
    uma_tie_handling: rule.umaTieHandling,
    uma_points_1: rule.umaPoints1,
    uma_points_2: rule.umaPoints2,
    tobi_enabled: rule.tobiEnabled,
    yakitori_enabled: rule.yakitoriEnabled,
    other_points_1_name: rule.otherPoints1Name,
    other_points_2_name: rule.otherPoints2Name,
    other_points_3_name: rule.otherPoints3Name,
    other_points_4_name: rule.otherPoints4Name,
    other_points_5_name: rule.otherPoints5Name,
    rate: rule.rate,
    notes: rule.notes,
  };
}

export function toRuleFormDataFromRow(row: {
  name: string;
  player_count: number;
  starting_score: number;
  return_score: number;
  oka_tie_handling: "kamicha" | "split" | "manual";
  uma_enabled: boolean;
  uma_tie_handling: "kamicha" | "split" | "manual" | null;
  uma_points_1: number | null;
  uma_points_2: number | null;
  tobi_enabled: boolean;
  yakitori_enabled: boolean;
  other_points_1_name: string | null;
  other_points_2_name: string | null;
  other_points_3_name: string | null;
  other_points_4_name: string | null;
  other_points_5_name: string | null;
  rate: number | string;
  notes: string | null;
}): RuleFormData | null {
  if (row.player_count !== 3 && row.player_count !== 4) {
    return null;
  }
  return {
    name: row.name,
    playerCount: row.player_count,
    startingScore: row.starting_score,
    returnScore: row.return_score,
    okaTieHandling: row.oka_tie_handling,
    umaEnabled: row.uma_enabled,
    umaTieHandling: row.uma_tie_handling,
    umaPoints1: row.uma_points_1,
    umaPoints2: row.uma_points_2,
    tobiEnabled: row.tobi_enabled,
    yakitoriEnabled: row.yakitori_enabled,
    otherPoints1Name: row.other_points_1_name ?? "",
    otherPoints2Name: row.other_points_2_name ?? "",
    otherPoints3Name: row.other_points_3_name ?? "",
    otherPoints4Name: row.other_points_4_name ?? "",
    otherPoints5Name: row.other_points_5_name ?? "",
    rate: Number(row.rate),
    notes: row.notes ?? "",
  };
}

const RULE_COLUMNS =
  "id, name, player_count, starting_score, return_score, oka_tie_handling, uma_enabled, uma_tie_handling, uma_points_1, uma_points_2, tobi_enabled, yakitori_enabled, other_points_1_name, other_points_2_name, other_points_3_name, other_points_4_name, other_points_5_name, rate, notes";

export function ruleInsertFromRow(row: {
  name: string;
  player_count: number;
  starting_score: number;
  return_score: number;
  oka_tie_handling: "kamicha" | "split" | "manual";
  uma_enabled: boolean;
  uma_tie_handling: "kamicha" | "split" | "manual" | null;
  uma_points_1: number | null;
  uma_points_2: number | null;
  tobi_enabled: boolean;
  yakitori_enabled: boolean;
  other_points_1_name: string | null;
  other_points_2_name: string | null;
  other_points_3_name: string | null;
  other_points_4_name: string | null;
  other_points_5_name: string | null;
  rate: number | string;
  notes: string | null;
}) {
  return {
    name: row.name,
    player_count: row.player_count,
    starting_score: row.starting_score,
    return_score: row.return_score,
    oka_tie_handling: row.oka_tie_handling,
    uma_enabled: row.uma_enabled,
    uma_tie_handling: row.uma_tie_handling,
    uma_points_1: row.uma_points_1,
    uma_points_2: row.uma_points_2,
    tobi_enabled: row.tobi_enabled,
    yakitori_enabled: row.yakitori_enabled,
    other_points_1_name: row.other_points_1_name,
    other_points_2_name: row.other_points_2_name,
    other_points_3_name: row.other_points_3_name,
    other_points_4_name: row.other_points_4_name,
    other_points_5_name: row.other_points_5_name,
    rate: Number(row.rate),
    notes: row.notes,
  };
}

export async function getCommunityRule(communityId: string, ruleId: string) {
  if (!isUuid(communityId) || !isUuid(ruleId)) {
    return null;
  }
  const { supabase } = await requireActiveProfile();
  const { data, error } = await supabase
    .from("community_rules")
    .select(RULE_COLUMNS)
    .eq("community_id", communityId)
    .eq("id", ruleId)
    .maybeSingle();

  if (error) {
    throw new Error("ルールを取得できませんでした。");
  }
  if (!data) {
    return null;
  }
  const form = toRuleFormDataFromRow(data);
  if (!form) {
    return null;
  }
  return { id: data.id, communityId, form };
}

export async function listCommunityRuleTemplates(communityId: string) {
  const { supabase } = await requireActiveProfile();
  const { data, error } = await supabase
    .from("community_rules")
    .select("id, name, player_count")
    .eq("community_id", communityId)
    .order("created_at", { ascending: true });
  if (error) {
    throw new Error("ルールを取得できませんでした。");
  }
  return data ?? [];
}

export async function copyCommunityRulesToTournament(
  communityId: string,
  tournamentId: string,
) {
  const { supabase } = await requireActiveProfile();
  const { data, error } = await supabase
    .from("community_rules")
    .select(RULE_COLUMNS)
    .eq("community_id", communityId)
    .order("created_at", { ascending: true });
  if (error) {
    throw new Error("ルールをコピーできませんでした。");
  }
  for (const row of data ?? []) {
    const { error: insertError } = await supabase
      .from("tournament_rules")
      .insert({
        tournament_id: tournamentId,
        ...ruleInsertFromRow(row),
      });
    if (insertError) {
      throw new Error("ルールをコピーできませんでした。");
    }
  }
}

export async function getTournamentRule(tournamentId: string, ruleId: string) {
  if (!isUuid(tournamentId) || !isUuid(ruleId)) {
    return null;
  }
  const { supabase } = await requireActiveProfile();
  const { data, error } = await supabase
    .from("tournament_rules")
    .select(RULE_COLUMNS)
    .eq("tournament_id", tournamentId)
    .eq("id", ruleId)
    .maybeSingle();
  if (error) {
    throw new Error("ルールを取得できませんでした。");
  }
  if (!data) {
    return null;
  }
  const form = toRuleFormDataFromRow(data);
  if (!form) {
    return null;
  }

  const { count, error: countError } = await supabase
    .from("matches")
    .select("id", { count: "exact", head: true })
    .eq("tournament_rule_id", ruleId);
  if (countError) {
    throw new Error("ルールを取得できませんでした。");
  }
  return { id: data.id, tournamentId, form, inUse: (count ?? 0) > 0 };
}
