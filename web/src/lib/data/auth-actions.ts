"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { parseDisplayName } from "@/lib/domain";
import { createClient } from "@/lib/supabase/server";
import { authErrorMessage } from "@/lib/supabase/auth-errors";
import {
  FORGOT_PASSWORD_SENT_PATH,
  HOME_PATH,
  LOGIN_PATH,
  recoveryCallbackUrl,
  safeNextPath,
} from "@/lib/supabase/paths";
import type { FormState } from "@/lib/data/types";

async function requestOrigin() {
  const headerList = await headers();
  const origin = headerList.get("origin");
  if (origin) {
    return origin;
  }
  const host =
    headerList.get("x-forwarded-host") ?? headerList.get("host") ?? "";
  const proto = headerList.get("x-forwarded-proto") ?? "http";
  if (host) {
    return `${proto}://${host.split(",")[0].trim()}`;
  }
  return "http://127.0.0.1:3000";
}

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
  const passwordConfirm = String(formData.get("passwordConfirm") ?? "");
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
  if (password !== passwordConfirm) {
    return { formError: "パスワードが一致しません。" };
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

export async function requestPasswordResetAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) {
    return { formError: "メールアドレスを入力してください。" };
  }

  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: recoveryCallbackUrl(await requestOrigin()),
  });
  redirect(FORGOT_PASSWORD_SENT_PATH);
}

export async function updatePasswordAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const password = String(formData.get("password") ?? "");
  if (!password) {
    return { formError: "パスワードを入力してください。" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    return { formError: authErrorMessage(error, "reset") };
  }
  await supabase.auth.signOut();
  return { ok: true };
}

export async function signOutToLoginAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect(LOGIN_PATH);
}
