"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  calculateMatchPoints,
  trimToNull,
  type Seat,
  type ScoreRow,
} from "@/lib/domain";
import { requireActiveProfile } from "@/lib/data/auth";
import { isUuid, publicErrorMessage } from "@/lib/data/helpers";
import { toRuleFormDataFromRow } from "@/lib/data/rules";
import type { FormState } from "@/lib/data/types";

type PlayerPayload = {
  participantId: string;
  seat: Seat;
  score: number;
  tobiPoints: number;
  yakitoriPoints: number;
  otherPoints: number[];
  manualPoints: number[];
  baseOverride: number | null;
  umaOverride: number;
};

function pad5(values: number[]): [number, number, number, number, number] {
  return [
    values[0] ?? 0,
    values[1] ?? 0,
    values[2] ?? 0,
    values[3] ?? 0,
    values[4] ?? 0,
  ];
}

function pad3(values: number[]): [number, number, number] {
  return [values[0] ?? 0, values[1] ?? 0, values[2] ?? 0];
}

async function saveMatch(formData: FormData, matchId: string | null) {
  const tournamentId = String(formData.get("tournamentId") ?? "");
  const ruleId = String(formData.get("ruleId") ?? "");
  if (!isUuid(tournamentId) || !isUuid(ruleId)) {
    return { formError: "試合を保存できませんでした。" } satisfies FormState;
  }

  let players: PlayerPayload[] = [];
  let titles: [string, string, string] = ["", "", ""];
  try {
    players = JSON.parse(
      String(formData.get("players") ?? "[]"),
    ) as PlayerPayload[];
    const parsedTitles = JSON.parse(
      String(formData.get("manualTitles") ?? "[]"),
    ) as string[];
    titles = [
      parsedTitles[0] ?? "",
      parsedTitles[1] ?? "",
      parsedTitles[2] ?? "",
    ];
  } catch {
    return { formError: "入力を読み取れませんでした。" };
  }

  const { supabase } = await requireActiveProfile();
  const { data: ruleRow, error: ruleError } = await supabase
    .from("tournament_rules")
    .select(
      "id, player_count, starting_score, return_score, oka_tie_handling, uma_enabled, uma_tie_handling, uma_points_1, uma_points_2, tobi_enabled, yakitori_enabled, other_points_1_name, other_points_2_name, other_points_3_name, other_points_4_name, other_points_5_name, rate, notes, name",
    )
    .eq("id", ruleId)
    .eq("tournament_id", tournamentId)
    .maybeSingle();
  if (ruleError || !ruleRow) {
    return { formError: "ルールが見つかりません。" };
  }
  const rule = toRuleFormDataFromRow(ruleRow);
  if (!rule) {
    return { formError: "ルールが見つかりません。" };
  }
  if (players.length !== rule.playerCount) {
    return { formError: "人数がルールと一致しません。" };
  }
  if (
    rule.playerCount === 3 &&
    players.some((player) => player.seat === "north")
  ) {
    return { formError: "三麻では北家を使えません。" };
  }
  const seats = players.map((player) => player.seat);
  if (new Set(seats).size !== seats.length) {
    return { formError: "家が重複しています。" };
  }
  const participantIds = players.map((player) => player.participantId);
  if (new Set(participantIds).size !== participantIds.length) {
    return { formError: "参加者が重複しています。" };
  }

  const scoreRows: ScoreRow[] = players.map((player) => ({
    participantId: player.participantId,
    seat: player.seat,
    score: player.score,
    tobiPoints: player.tobiPoints,
    yakitoriPoints: player.yakitoriPoints,
    otherPoints: pad5(player.otherPoints),
    manualPoints: pad3(player.manualPoints),
    baseOverride: player.baseOverride,
    umaOverride: player.umaOverride,
  }));
  const calculated = calculateMatchPoints(scoreRows, rule);
  const comment = trimToNull(String(formData.get("comment") ?? ""));

  const matchFields = {
    tournament_id: tournamentId,
    tournament_rule_id: ruleId,
    comment,
    manual_points_1_title: trimToNull(titles[0]),
    manual_points_2_title: trimToNull(titles[1]),
    manual_points_3_title: trimToNull(titles[2]),
  };

  let savedId = matchId;
  if (matchId) {
    const { error } = await supabase
      .from("matches")
      .update(matchFields)
      .eq("id", matchId)
      .eq("tournament_id", tournamentId);
    if (error) {
      return {
        formError: publicErrorMessage(error, "試合を保存できませんでした。"),
      };
    }
    const { error: deleteError } = await supabase
      .from("match_results")
      .delete()
      .eq("match_id", matchId);
    if (deleteError) {
      return {
        formError: publicErrorMessage(
          deleteError,
          "試合を保存できませんでした。",
        ),
      };
    }
  } else {
    const { data, error } = await supabase
      .from("matches")
      .insert(matchFields)
      .select("id")
      .maybeSingle();
    if (error || !data) {
      return {
        formError: publicErrorMessage(error, "試合を保存できませんでした。"),
      };
    }
    savedId = data.id;
  }

  const { error: resultError } = await supabase.from("match_results").insert(
    calculated.map((row) => {
      const extras = pad5(row.otherPoints);
      const manuals = pad3(row.manualPoints);
      return {
        match_id: savedId as string,
        tournament_participant_id: row.participantId,
        seat: row.seat,
        score: row.score,
        base_points: row.basePoints,
        uma_points: row.umaPoints,
        tobi_points: row.tobiPoints,
        yakitori_points: row.yakitoriPoints,
        other_points_1: extras[0],
        other_points_2: extras[1],
        other_points_3: extras[2],
        other_points_4: extras[3],
        other_points_5: extras[4],
        manual_points_1: manuals[0],
        manual_points_2: manuals[1],
        manual_points_3: manuals[2],
        points: row.points,
        rank: row.rank,
      };
    }),
  );
  if (resultError) {
    return {
      formError: publicErrorMessage(
        resultError,
        "試合を保存できませんでした。",
      ),
    };
  }

  revalidatePath(`/tournaments/${tournamentId}`);
  revalidatePath(`/matches/${savedId}`);
  redirect(`/matches/${savedId}`);
}

export async function createMatchAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  return saveMatch(formData, null);
}

export async function updateMatchAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const matchId = String(formData.get("matchId") ?? "");
  if (!isUuid(matchId)) {
    return { formError: "試合が見つかりません。" };
  }
  return saveMatch(formData, matchId);
}

export async function deleteMatchAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const matchId = String(formData.get("matchId") ?? "");
  const tournamentId = String(formData.get("tournamentId") ?? "");
  if (!isUuid(matchId) || !isUuid(tournamentId)) {
    return { formError: "試合を削除できませんでした。" };
  }
  const { supabase } = await requireActiveProfile();
  const { error } = await supabase.from("matches").delete().eq("id", matchId);
  if (error) {
    return {
      formError: publicErrorMessage(error, "試合を削除できませんでした。"),
    };
  }
  revalidatePath(`/tournaments/${tournamentId}`);
  redirect(`/tournaments/${tournamentId}`);
}
