"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  parseGuestName,
  parseHeldOn,
  parseTournamentName,
  trimToNull,
} from "@/lib/domain";
import { requireActiveProfile } from "@/lib/data/auth";
import {
  isUniqueViolation,
  isUuid,
  publicErrorMessage,
} from "@/lib/data/helpers";
import { copyCommunityRulesToTournament } from "@/lib/data/rules";
import { getTournamentDetail } from "@/lib/data/tournaments";
import type { FormState } from "@/lib/data/types";

function revalidateTournament(communityId: string, tournamentId: string) {
  revalidatePath(`/communities/${communityId}`);
  revalidatePath(`/tournaments/${tournamentId}`);
  revalidatePath(`/tournaments/${tournamentId}/edit`);
}

export async function createTournamentAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const communityId = String(formData.get("communityId") ?? "");
  if (!isUuid(communityId)) {
    return { formError: "麻雀グループが見つかりません。" };
  }
  const heldOn = parseHeldOn(String(formData.get("heldOn") ?? ""));
  if (!heldOn.ok) {
    return { fieldErrors: { heldOn: heldOn.error } };
  }
  const name = parseTournamentName(String(formData.get("name") ?? ""));
  if (!name.ok) {
    return { fieldErrors: { name: name.error } };
  }
  const memo = trimToNull(String(formData.get("memo") ?? ""));
  const userIds = [
    ...new Set(
      formData
        .getAll("userId")
        .map(String)
        .filter((id) => isUuid(id)),
    ),
  ];
  const guestNames: string[] = [];
  for (const raw of formData.getAll("guestName").map(String)) {
    const parsed = parseGuestName(raw, guestNames);
    if (!parsed.ok) {
      return { formError: parsed.error };
    }
    guestNames.push(parsed.value);
  }

  const { supabase } = await requireActiveProfile();
  const { data, error } = await supabase
    .from("tournaments")
    .insert({
      community_id: communityId,
      held_on: heldOn.value,
      name: name.value,
      memo,
    })
    .select("id")
    .maybeSingle();
  if (error || !data) {
    return {
      formError: publicErrorMessage(error, "大会を作成できませんでした。"),
    };
  }

  await copyCommunityRulesToTournament(communityId, data.id);

  if (userIds.length > 0 || guestNames.length > 0) {
    const { data: memberships, error: memberError } = await supabase
      .from("community_memberships")
      .select("user_id")
      .eq("community_id", communityId);
    if (memberError) {
      return {
        formError: publicErrorMessage(
          memberError,
          "大会を作成できませんでした。",
        ),
      };
    }
    const allowed = new Set((memberships ?? []).map((row) => row.user_id));
    const rows = [
      ...userIds
        .filter((userId) => allowed.has(userId))
        .map((userId) => ({
          tournament_id: data.id,
          user_id: userId,
          guest_display_name: null as string | null,
        })),
      ...guestNames.map((name) => ({
        tournament_id: data.id,
        user_id: null as string | null,
        guest_display_name: name,
      })),
    ];
    const { error: participantError } = await supabase
      .from("tournament_participants")
      .insert(rows);
    if (participantError) {
      return {
        formError: publicErrorMessage(
          participantError,
          "大会を作成できませんでした。",
        ),
      };
    }
  }

  revalidateTournament(communityId, data.id);
  redirect(`/tournaments/${data.id}`);
}

export async function updateTournamentAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const tournamentId = String(formData.get("tournamentId") ?? "");
  if (!isUuid(tournamentId)) {
    return { formError: "大会が見つかりません。" };
  }
  const heldOn = parseHeldOn(String(formData.get("heldOn") ?? ""));
  if (!heldOn.ok) {
    return { formError: heldOn.error };
  }
  const name = parseTournamentName(String(formData.get("name") ?? ""));
  if (!name.ok) {
    return { fieldErrors: { name: name.error } };
  }
  const memo = trimToNull(String(formData.get("memo") ?? ""));

  const tournament = await getTournamentDetail(tournamentId);
  if (!tournament) {
    return { formError: "大会が見つかりません。" };
  }

  const { supabase } = await requireActiveProfile();
  const { error } = await supabase
    .from("tournaments")
    .update({ held_on: heldOn.value, name: name.value, memo })
    .eq("id", tournamentId);
  if (error) {
    return {
      formError: publicErrorMessage(error, "大会を保存できませんでした。"),
    };
  }

  revalidateTournament(tournament.communityId, tournamentId);
  redirect(`/tournaments/${tournamentId}`);
}

export async function deleteTournamentAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const tournamentId = String(formData.get("tournamentId") ?? "");
  if (!isUuid(tournamentId)) {
    return { formError: "大会を削除できませんでした。" };
  }
  const tournament = await getTournamentDetail(tournamentId);
  if (!tournament) {
    return { formError: "大会が見つかりません。" };
  }

  const { supabase } = await requireActiveProfile();
  const { error: matchError } = await supabase
    .from("matches")
    .delete()
    .eq("tournament_id", tournamentId);
  if (matchError) {
    return {
      formError: publicErrorMessage(matchError, "大会を削除できませんでした。"),
    };
  }
  const { error: participantError } = await supabase
    .from("tournament_participants")
    .delete()
    .eq("tournament_id", tournamentId);
  if (participantError) {
    return {
      formError: publicErrorMessage(
        participantError,
        "大会を削除できませんでした。",
      ),
    };
  }
  const { error: ruleError } = await supabase
    .from("tournament_rules")
    .delete()
    .eq("tournament_id", tournamentId);
  if (ruleError) {
    return {
      formError: publicErrorMessage(ruleError, "大会を削除できませんでした。"),
    };
  }
  const { error } = await supabase
    .from("tournaments")
    .delete()
    .eq("id", tournamentId);
  if (error) {
    return {
      formError: publicErrorMessage(error, "大会を削除できませんでした。"),
    };
  }

  revalidatePath(`/communities/${tournament.communityId}`);
  redirect(`/communities/${tournament.communityId}`);
}

export async function addParticipantsAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const tournamentId = String(formData.get("tournamentId") ?? "");
  if (!isUuid(tournamentId)) {
    return { formError: "参加者を追加できませんでした。" };
  }
  const userIds = formData.getAll("userId").map(String).filter(isUuid);
  if (userIds.length === 0) {
    return { formError: "追加する人を選んでください。" };
  }

  const { supabase } = await requireActiveProfile();
  const { error } = await supabase.from("tournament_participants").insert(
    userIds.map((userId) => ({
      tournament_id: tournamentId,
      user_id: userId,
    })),
  );
  if (error) {
    return {
      formError: publicErrorMessage(error, "参加者を追加できませんでした。"),
    };
  }

  revalidatePath(`/tournaments/${tournamentId}`);
  revalidatePath(`/tournaments/${tournamentId}/edit`);
  redirect(`/tournaments/${tournamentId}/edit`);
}

export async function addGuestAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const tournamentId = String(formData.get("tournamentId") ?? "");
  if (!isUuid(tournamentId)) {
    return { formError: "ゲストを追加できませんでした。" };
  }
  const tournament = await getTournamentDetail(tournamentId);
  if (!tournament) {
    return { formError: "大会が見つかりません。" };
  }
  const existing = tournament.participants
    .map((item) => item.guestDisplayName)
    .filter((name): name is string => Boolean(name));
  const parsed = parseGuestName(
    String(formData.get("displayName") ?? ""),
    existing,
  );
  if (!parsed.ok) {
    return { fieldErrors: { displayName: parsed.error } };
  }

  const { supabase } = await requireActiveProfile();
  const { error } = await supabase.from("tournament_participants").insert({
    tournament_id: tournamentId,
    guest_display_name: parsed.value,
  });
  if (error) {
    if (isUniqueViolation(error)) {
      return { fieldErrors: { displayName: "同じ名前のゲストがいます。" } };
    }
    return {
      formError: publicErrorMessage(error, "ゲストを追加できませんでした。"),
    };
  }

  revalidatePath(`/tournaments/${tournamentId}`);
  revalidatePath(`/tournaments/${tournamentId}/edit`);
  redirect(`/tournaments/${tournamentId}/edit`);
}

export async function removeParticipantAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const tournamentId = String(formData.get("tournamentId") ?? "");
  const participantId = String(formData.get("participantId") ?? "");
  if (!isUuid(tournamentId) || !isUuid(participantId)) {
    return { formError: "参加者を外せませんでした。" };
  }

  const { supabase } = await requireActiveProfile();
  const { error } = await supabase
    .from("tournament_participants")
    .delete()
    .eq("id", participantId)
    .eq("tournament_id", tournamentId);
  if (error) {
    return {
      formError: publicErrorMessage(
        error,
        "試合に出ている参加者は外せません。",
      ),
    };
  }

  revalidatePath(`/tournaments/${tournamentId}`);
  revalidatePath(`/tournaments/${tournamentId}/edit`);
  redirect(`/tournaments/${tournamentId}/edit`);
}
