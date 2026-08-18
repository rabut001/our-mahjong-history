export function countFromEmbed(value: unknown): number {
  if (!Array.isArray(value) || value.length === 0) {
    return 0;
  }
  const first = value[0];
  if (
    typeof first === "object" &&
    first !== null &&
    "count" in first &&
    typeof first.count === "number"
  ) {
    return first.count;
  }
  return 0;
}

export function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    value,
  );
}

export function isUniqueViolation(error: { code?: string }): boolean {
  return error.code === "23505";
}

export function publicErrorMessage(
  error: { message?: string; code?: string } | null,
  fallback: string,
): string {
  const message = error?.message ?? "";
  if (message.includes("招待コードが無効")) {
    return "招待コードが無効です。";
  }
  if (message.includes("期限が切れ")) {
    return "招待コードの期限が切れています。";
  }
  if (message.includes("ログイン中の利用中プロフィール")) {
    return "ログインし直してください。";
  }
  return fallback;
}
