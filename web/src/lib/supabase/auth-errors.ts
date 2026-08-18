type AuthKind = "login" | "signup" | "oauth";

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
  if (kind === "oauth") {
    return "この方法ではログインできませんでした。";
  }
  if (kind === "signup") {
    return "登録できませんでした。";
  }
  return "ログインできませんでした。";
}
