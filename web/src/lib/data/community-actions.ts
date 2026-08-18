"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  inviteExpiresAt,
  isInviteCodeFormat,
  parseCommunityName,
  trimToNull,
} from "@/lib/domain";
import { requireActiveProfile } from "@/lib/data/auth";
import { generateInviteCode } from "@/lib/data/invite-code";
import {
  isUniqueViolation,
  isUuid,
  publicErrorMessage,
} from "@/lib/data/helpers";
import type { FormState } from "@/lib/data/types";
import { HOME_PATH } from "@/lib/supabase/paths";

function revalidateCommunity(communityId: string) {
  revalidatePath(HOME_PATH);
  revalidatePath(`/communities/${communityId}`);
  revalidatePath(`/communities/${communityId}/edit`);
  revalidatePath(`/communities/${communityId}/invite`);
}

export async function createCommunityAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = parseCommunityName(String(formData.get("name") ?? ""));
  if (!parsed.ok) {
    return { fieldErrors: { name: parsed.error } };
  }
  const comment = trimToNull(String(formData.get("comment") ?? ""));

  const { supabase } = await requireActiveProfile();
  const payload: { name: string; comment?: string } = { name: parsed.value };
  if (comment) {
    payload.comment = comment;
  }
  const { data, error } = await supabase.rpc("create_community", payload);

  if (error || !data) {
    return {
      formError: publicErrorMessage(
        error,
        "麻雀グループを作成できませんでした。",
      ),
    };
  }

  revalidatePath(HOME_PATH);
  redirect(`/communities/${data}`);
}

export async function updateCommunityAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const communityId = String(formData.get("communityId") ?? "");
  if (!isUuid(communityId)) {
    return { formError: "麻雀グループが見つかりません。" };
  }

  const parsed = parseCommunityName(String(formData.get("name") ?? ""));
  if (!parsed.ok) {
    return { fieldErrors: { name: parsed.error } };
  }
  const comment = trimToNull(String(formData.get("comment") ?? ""));

  const { supabase } = await requireActiveProfile();
  const { error } = await supabase
    .from("communities")
    .update({ name: parsed.value, comment })
    .eq("id", communityId);

  if (error) {
    return {
      formError: publicErrorMessage(
        error,
        "麻雀グループを保存できませんでした。",
      ),
    };
  }

  revalidateCommunity(communityId);
  redirect(`/communities/${communityId}`);
}

export async function joinCommunityAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const raw = String(formData.get("code") ?? "");
  if (!raw.trim()) {
    return { fieldErrors: { code: "招待コードを入力してください。" } };
  }
  if (!isInviteCodeFormat(raw)) {
    return { fieldErrors: { code: "招待コードの形式が違います。" } };
  }

  const { supabase } = await requireActiveProfile();
  const { data, error } = await supabase.rpc("join_community", {
    code: raw.trim(),
  });

  if (error || !data) {
    return {
      fieldErrors: {
        code: publicErrorMessage(error, "参加できませんでした。"),
      },
    };
  }

  revalidatePath(HOME_PATH);
  revalidatePath(`/communities/${data}`);
  redirect(`/communities/${data}`);
}

export async function leaveCommunityAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const communityId = String(formData.get("communityId") ?? "");
  if (!isUuid(communityId)) {
    return { formError: "麻雀グループが見つかりません。" };
  }

  const { supabase } = await requireActiveProfile();
  const { error } = await supabase.rpc("leave_community", {
    community_id: communityId,
  });

  if (error) {
    return {
      formError: publicErrorMessage(
        error,
        "麻雀グループを抜けられませんでした。",
      ),
    };
  }

  revalidatePath(HOME_PATH);
  redirect(HOME_PATH);
}

export async function issueInviteAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const communityId = String(formData.get("communityId") ?? "");
  if (!isUuid(communityId)) {
    return { formError: "麻雀グループが見つかりません。" };
  }

  const { supabase, profile } = await requireActiveProfile();
  const expiresAt = inviteExpiresAt();

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const { error } = await supabase.from("community_invite_codes").insert({
      community_id: communityId,
      code: generateInviteCode(),
      expires_at: expiresAt,
      created_by: profile.id,
    });

    if (!error) {
      revalidateCommunity(communityId);
      redirect(`/communities/${communityId}/invite`);
    }
    if (!isUniqueViolation(error)) {
      return {
        formError: publicErrorMessage(
          error,
          "招待コードを発行できませんでした。",
        ),
      };
    }
  }

  return { formError: "招待コードを発行できませんでした。" };
}

export async function reissueInviteAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const communityId = String(formData.get("communityId") ?? "");
  if (!isUuid(communityId)) {
    return { formError: "麻雀グループが見つかりません。" };
  }

  const { supabase } = await requireActiveProfile();
  const { error: deleteError } = await supabase
    .from("community_invite_codes")
    .delete()
    .eq("community_id", communityId);

  if (deleteError) {
    return {
      formError: publicErrorMessage(
        deleteError,
        "招待コードを再発行できませんでした。",
      ),
    };
  }

  return issueInviteAction(_prev, formData);
}

export async function removeMemberAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const communityId = String(formData.get("communityId") ?? "");
  const userId = String(formData.get("userId") ?? "");
  if (!isUuid(communityId) || !isUuid(userId)) {
    return { formError: "メンバーを外せませんでした。" };
  }

  const { supabase, profile } = await requireActiveProfile();
  if (userId === profile.id) {
    return { formError: "自分を外すときは、麻雀グループを抜けてください。" };
  }

  const { error } = await supabase
    .from("community_memberships")
    .delete()
    .eq("community_id", communityId)
    .eq("user_id", userId);

  if (error) {
    return {
      formError: publicErrorMessage(error, "メンバーを外せませんでした。"),
    };
  }

  revalidateCommunity(communityId);
  redirect(`/communities/${communityId}`);
}
