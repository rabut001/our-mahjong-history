"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { parseDisplayName, trimToNull } from "@/lib/domain";
import { requireActiveProfile } from "@/lib/data/auth";
import { publicErrorMessage } from "@/lib/data/helpers";
import type { FormState } from "@/lib/data/types";
import { createAdminClient } from "@/lib/supabase/admin";
import { HOME_PATH, LOGIN_PATH } from "@/lib/supabase/paths";

export async function updateProfileAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = parseDisplayName(String(formData.get("displayName") ?? ""));
  if (!parsed.ok) {
    return { fieldErrors: { displayName: parsed.error } };
  }
  const comment = trimToNull(String(formData.get("comment") ?? ""));

  const { supabase, profile } = await requireActiveProfile();
  const { error } = await supabase
    .from("profiles")
    .update({ display_name: parsed.value, comment })
    .eq("id", profile.id);

  if (error) {
    return {
      formError: publicErrorMessage(
        error,
        "プロフィールを保存できませんでした。",
      ),
    };
  }

  revalidatePath(HOME_PATH);
  revalidatePath("/profile");
  redirect(HOME_PATH);
}

export async function withdrawAccountAction(
  prev: FormState,
  formData: FormData,
): Promise<FormState> {
  void prev;
  void formData;
  const { supabase, user } = await requireActiveProfile();
  const { error } = await supabase.rpc("withdraw_account");
  if (error) {
    return {
      formError: publicErrorMessage(error, "退会できませんでした。"),
    };
  }

  const admin = createAdminClient();
  await admin.auth.admin.deleteUser(user.id);
  await supabase.auth.signOut();

  revalidatePath(HOME_PATH);
  redirect(LOGIN_PATH);
}
