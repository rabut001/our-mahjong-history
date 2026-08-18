"use server";

import { redirect } from "next/navigation";
import { parseDisplayName } from "@/lib/domain";
import { createClient } from "@/lib/supabase/server";
import { authErrorMessage } from "@/lib/supabase/auth-errors";
import { HOME_PATH, safeNextPath } from "@/lib/supabase/paths";
import type { FormState } from "@/lib/data/types";

export async function signInWithEmailAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = safeNextPath(String(formData.get("next") ?? ""));
  if (!email || !password) {
    return { formError: authErrorMessage(null, "login") };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return { formError: authErrorMessage(error, "login") };
  }
  redirect(next);
}

export async function signUpWithEmailAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email) {
    return { formError: authErrorMessage(null, "signup") };
  }
  const name = parseDisplayName(String(formData.get("displayName") ?? ""));
  if (!name.ok) {
    return { fieldErrors: { displayName: name.error } };
  }
  if (!password) {
    return { formError: "パスワードを入力してください。" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { display_name: name.value },
    },
  });
  if (error) {
    return { formError: authErrorMessage(error, "signup") };
  }
  if (data.session) {
    redirect(HOME_PATH);
  }
  return { formError: "確認メールを送信しました。" };
}
