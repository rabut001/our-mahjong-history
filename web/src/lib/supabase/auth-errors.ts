type AuthKind = "login" | "signup" | "oauth" | "reset";

export type AuthQueryKey = "denied" | "expired" | "oauth";

export function authErrorMessage(
  error: { message: string; code?: string } | null,
  kind: AuthKind,
) {
  const message = (error?.message ?? "").toLowerCase();
  const code = error?.code ?? "";

  if (code === "invalid_credentials" || message.includes("invalid login")) {
    return "メールまたはパスワードが違います。";
  }
  if (
    code === "user_already_exists" ||
    message.includes("already registered")
  ) {
    return "このメールはすでに登録されています。";
  }
  if (code === "weak_password" || message.includes("password should be")) {
    return "パスワードが短すぎます。";
  }
  if (kind === "oauth") {
    return "この方法ではログインできませんでした。";
  }
  if (kind === "reset") {
    return "パスワードを変更できませんでした。";
  }
  if (kind === "signup") {
    return "登録できませんでした。";
  }
  return "ログインできませんでした。";
}

export function authQueryKeyFromCallback(params: {
  error?: string | null;
  errorCode?: string | null;
  errorDescription?: string | null;
  authError?: { message: string; code?: string } | null;
}): AuthQueryKey {
  const error = (params.error ?? "").toLowerCase();
  const code = (params.errorCode ?? params.authError?.code ?? "").toLowerCase();
  const detail = (
    params.errorDescription ??
    params.authError?.message ??
    ""
  ).toLowerCase();
  const text = `${error} ${code} ${detail}`;

  if (
    error === "access_denied" ||
    text.includes("access_denied") ||
    text.includes("cancelled") ||
    text.includes("canceled")
  ) {
    return "denied";
  }
  if (
    code === "otp_expired" ||
    code === "flow_state_expired" ||
    text.includes("expired")
  ) {
    return "expired";
  }
  return "oauth";
}

export function parseAuthQueryKey(
  value: string | null | undefined,
): AuthQueryKey | null {
  if (value === "denied" || value === "expired" || value === "oauth") {
    return value;
  }
  return null;
}

export function authQueryMessage(
  value: string | null | undefined,
  kind: "login" | "signup" = "login",
) {
  const key = parseAuthQueryKey(value) ?? (value ? "oauth" : null);
  if (!key) {
    return "";
  }
  if (key === "denied") {
    return kind === "signup"
      ? "登録がキャンセルされました。"
      : "ログインがキャンセルされました。";
  }
  if (key === "expired") {
    return "手続きの有効期限が切れました。もう一度やり直してください。";
  }
  return kind === "signup"
    ? "この方法では登録できませんでした。"
    : authErrorMessage(null, "oauth");
}
