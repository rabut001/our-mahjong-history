"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  DUPLICATE_RULE_NAME_MESSAGE,
  parseRuleInput,
  ruleInputFromFormData,
} from "@/lib/domain";
import { requireActiveProfile } from "@/lib/data/auth";
import {
  isUniqueViolation,
  isUuid,
  publicErrorMessage,
} from "@/lib/data/helpers";
import { toRuleInsert } from "@/lib/data/rules";
import type { FormState } from "@/lib/data/types";
import { safeNextPath } from "@/lib/supabase/paths";

function isDuplicateRuleName(error: { code?: string; message?: string }) {
  return (
    isUniqueViolation(error) || (error.message ?? "").includes("community_name")
  );
}

function uniqueNameError(error: {
  code?: string;
  message?: string;
}): FormState {
  if (isDuplicateRuleName(error)) {
    return { fieldErrors: { name: DUPLICATE_RULE_NAME_MESSAGE } };
  }
  return {
    formError: publicErrorMessage(error, "ルールを保存できませんでした。"),
  };
}

export async function createCommunityRuleAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const communityId = String(formData.get("communityId") ?? "");
  if (!isUuid(communityId)) {
    return { formError: "麻雀グループが見つかりません。" };
  }

  const parsed = parseRuleInput(ruleInputFromFormData(formData));
  if (!parsed.ok) {
    return { fieldErrors: parsed.fieldErrors };
  }

  const { supabase } = await requireActiveProfile();
  const { error } = await supabase.from("community_rules").insert({
    community_id: communityId,
    ...toRuleInsert(parsed.value),
  });

  if (error) {
    return uniqueNameError(error);
  }

  revalidatePath(`/communities/${communityId}`);
  const next = String(formData.get("next") ?? "");
  redirect(next ? safeNextPath(next) : `/communities/${communityId}`);
}

export async function updateCommunityRuleAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const communityId = String(formData.get("communityId") ?? "");
  const ruleId = String(formData.get("ruleId") ?? "");
  if (!isUuid(communityId) || !isUuid(ruleId)) {
    return { formError: "ルールが見つかりません。" };
  }

  const parsed = parseRuleInput(ruleInputFromFormData(formData));
  if (!parsed.ok) {
    return { fieldErrors: parsed.fieldErrors };
  }

  const { supabase } = await requireActiveProfile();
  const { error } = await supabase
    .from("community_rules")
    .update(toRuleInsert(parsed.value))
    .eq("id", ruleId)
    .eq("community_id", communityId);

  if (error) {
    return uniqueNameError(error);
  }

  revalidatePath(`/communities/${communityId}`);
  revalidatePath(`/communities/${communityId}/rules/${ruleId}`);
  redirect(`/communities/${communityId}`);
}

export async function deleteCommunityRuleAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const communityId = String(formData.get("communityId") ?? "");
  const ruleId = String(formData.get("ruleId") ?? "");
  if (!isUuid(communityId) || !isUuid(ruleId)) {
    return { formError: "ルールを削除できませんでした。" };
  }

  const { supabase } = await requireActiveProfile();
  const { error } = await supabase
    .from("community_rules")
    .delete()
    .eq("id", ruleId)
    .eq("community_id", communityId);

  if (error) {
    return {
      formError: publicErrorMessage(error, "ルールを削除できませんでした。"),
    };
  }

  revalidatePath(`/communities/${communityId}`);
  redirect(`/communities/${communityId}`);
}

export async function createTournamentRuleAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const tournamentId = String(formData.get("tournamentId") ?? "");
  if (!isUuid(tournamentId)) {
    return { formError: "大会が見つかりません。" };
  }
  const parsed = parseRuleInput(ruleInputFromFormData(formData));
  if (!parsed.ok) {
    return { fieldErrors: parsed.fieldErrors };
  }
  const { supabase } = await requireActiveProfile();
  const { error } = await supabase.from("tournament_rules").insert({
    tournament_id: tournamentId,
    ...toRuleInsert(parsed.value),
  });
  if (error) {
    return uniqueNameError(error);
  }
  revalidatePath(`/tournaments/${tournamentId}`);
  revalidatePath(`/tournaments/${tournamentId}/edit`);
  redirect(`/tournaments/${tournamentId}/edit`);
}

export async function updateTournamentRuleAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const tournamentId = String(formData.get("tournamentId") ?? "");
  const ruleId = String(formData.get("ruleId") ?? "");
  if (!isUuid(tournamentId) || !isUuid(ruleId)) {
    return { formError: "ルールが見つかりません。" };
  }
  const parsed = parseRuleInput(ruleInputFromFormData(formData));
  if (!parsed.ok) {
    return { fieldErrors: parsed.fieldErrors };
  }
  const { supabase } = await requireActiveProfile();
  const { error } = await supabase
    .from("tournament_rules")
    .update(toRuleInsert(parsed.value))
    .eq("id", ruleId)
    .eq("tournament_id", tournamentId);
  if (error) {
    if ((error.message ?? "").includes("使用中")) {
      return { formError: "試合で使用中のため修正できません。" };
    }
    return uniqueNameError(error);
  }
  revalidatePath(`/tournaments/${tournamentId}`);
  revalidatePath(`/tournaments/${tournamentId}/edit`);
  revalidatePath(`/tournaments/${tournamentId}/rules/${ruleId}`);
  redirect(`/tournaments/${tournamentId}/edit`);
}

export async function deleteTournamentRuleAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const tournamentId = String(formData.get("tournamentId") ?? "");
  const ruleId = String(formData.get("ruleId") ?? "");
  if (!isUuid(tournamentId) || !isUuid(ruleId)) {
    return { formError: "ルールを削除できませんでした。" };
  }
  const { supabase } = await requireActiveProfile();
  const { error } = await supabase
    .from("tournament_rules")
    .delete()
    .eq("id", ruleId)
    .eq("tournament_id", tournamentId);
  if (error) {
    return {
      formError: publicErrorMessage(
        error,
        "試合で使用中のため削除できません。",
      ),
    };
  }
  revalidatePath(`/tournaments/${tournamentId}`);
  revalidatePath(`/tournaments/${tournamentId}/edit`);
  redirect(`/tournaments/${tournamentId}/edit`);
}
