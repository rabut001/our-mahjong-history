import { requireActiveProfile } from "@/lib/data/auth";
import { isUuid } from "@/lib/data/helpers";
import { toRuleFormDataFromRow } from "@/lib/data/rules";
import { getTournamentDetail } from "@/lib/data/tournaments";
import type {
  MatchFormData,
  MatchFormPlayer,
} from "@/components/match-form/types";
import type { Seat } from "@/lib/domain";
import { SEAT_ORDER } from "@/lib/domain";

export type MatchDetail = {
  id: string;
  number: number;
  tournamentId: string;
  tournamentName: string;
  ruleName: string;
  playerCount: 3 | 4;
  comment: string;
  results: {
    participantId: string;
    name: string;
    seat: Seat;
    rank: number;
    score: number;
    points: number;
  }[];
};

export async function getMatchFormData(
  tournamentId: string,
  matchId?: string,
): Promise<MatchFormData | null> {
  if (!isUuid(tournamentId)) {
    return null;
  }
  const tournament = await getTournamentDetail(tournamentId);
  if (!tournament || tournament.rules.length === 0) {
    return null;
  }

  const { supabase } = await requireActiveProfile();
  const { data: ruleRows, error } = await supabase
    .from("tournament_rules")
    .select(
      "id, name, player_count, starting_score, return_score, oka_tie_handling, uma_enabled, uma_tie_handling, uma_points_1, uma_points_2, tobi_enabled, yakitori_enabled, other_points_1_name, other_points_2_name, other_points_3_name, other_points_4_name, other_points_5_name, rate, notes",
    )
    .eq("tournament_id", tournamentId)
    .order("created_at", { ascending: true });
  if (error) {
    throw new Error("ルールを取得できませんでした。");
  }
  const rules = (ruleRows ?? []).flatMap((row) => {
    const form = toRuleFormDataFromRow(row);
    return form ? [{ id: row.id, ...form }] : [];
  });
  if (rules.length === 0) {
    return null;
  }

  const participants = tournament.participants.map((item) => ({
    id: item.id,
    name: item.displayName,
  }));

  if (!matchId) {
    return {
      matchId: null,
      tournamentId,
      tournamentName: tournament.name,
      rules,
      selectedRuleId: rules[0]?.id ?? "",
      participants,
      players: [],
      manualTitles: ["", "", ""],
      comment: "",
    };
  }

  if (!isUuid(matchId)) {
    return null;
  }
  const { data: match, error: matchError } = await supabase
    .from("matches")
    .select(
      "id, tournament_id, tournament_rule_id, comment, manual_points_1_title, manual_points_2_title, manual_points_3_title, match_results(*)",
    )
    .eq("id", matchId)
    .eq("tournament_id", tournamentId)
    .maybeSingle();
  if (matchError) {
    throw new Error("試合を取得できませんでした。");
  }
  if (!match) {
    return null;
  }

  const nameById = new Map(participants.map((item) => [item.id, item.name]));
  const players: MatchFormPlayer[] = (match.match_results ?? []).map((row) => ({
    participantId: row.tournament_participant_id,
    name: nameById.get(row.tournament_participant_id) ?? "",
    seat: row.seat,
    score: row.score,
    tobiPoints: Number(row.tobi_points),
    yakitoriPoints: Number(row.yakitori_points),
    otherPoints: [
      Number(row.other_points_1),
      Number(row.other_points_2),
      Number(row.other_points_3),
      Number(row.other_points_4),
      Number(row.other_points_5),
    ],
    manualPoints: [
      Number(row.manual_points_1),
      Number(row.manual_points_2),
      Number(row.manual_points_3),
    ],
    umaPoints: Number(row.uma_points),
    baseOverride: Number(row.base_points),
    points: Number(row.points),
    rank: row.rank,
  }));

  return {
    matchId: match.id,
    tournamentId,
    tournamentName: tournament.name,
    rules,
    selectedRuleId: match.tournament_rule_id,
    participants,
    players,
    manualTitles: [
      match.manual_points_1_title ?? "",
      match.manual_points_2_title ?? "",
      match.manual_points_3_title ?? "",
    ],
    comment: match.comment ?? "",
  };
}

export async function getMatchDetail(
  matchId: string,
): Promise<MatchDetail | null> {
  if (!isUuid(matchId)) {
    return null;
  }
  const { supabase } = await requireActiveProfile();
  const { data: match, error } = await supabase
    .from("matches")
    .select(
      "id, tournament_id, tournament_rule_id, comment, created_at, match_results(rank, score, points, seat, tournament_participant_id)",
    )
    .eq("id", matchId)
    .maybeSingle();
  if (error) {
    throw new Error("試合を取得できませんでした。");
  }
  if (!match) {
    return null;
  }
  const tournament = await getTournamentDetail(match.tournament_id);
  if (!tournament) {
    return null;
  }
  const rule = tournament.rules.find(
    (item) => item.id === match.tournament_rule_id,
  );
  const newer = tournament.matches.filter(
    (item) => item.createdAt > match.created_at,
  ).length;
  const number = tournament.matches.length - newer;
  const nameById = new Map(
    tournament.participants.map((item) => [item.id, item.displayName]),
  );

  return {
    id: match.id,
    number,
    tournamentId: match.tournament_id,
    tournamentName: tournament.name,
    ruleName: rule?.name ?? "",
    playerCount: rule?.playerCount ?? 4,
    comment: match.comment ?? "",
    results: (match.match_results ?? [])
      .slice()
      .sort((a, b) => {
        if (a.rank !== b.rank) {
          return a.rank - b.rank;
        }
        return SEAT_ORDER.indexOf(a.seat) - SEAT_ORDER.indexOf(b.seat);
      })
      .map((row) => ({
        participantId: row.tournament_participant_id,
        name: nameById.get(row.tournament_participant_id) ?? "",
        seat: row.seat,
        rank: row.rank,
        score: row.score,
        points: Number(row.points),
      })),
  };
}
