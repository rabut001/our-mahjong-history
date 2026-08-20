type AuthKind = "login" | "signup" | "oauth" | "reset";

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
