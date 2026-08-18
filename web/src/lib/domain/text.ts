export const WITHDRAWN_DISPLAY_NAME = "退会済みユーザ";

export function trimToNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}

export function requiredTrimmed(
  value: string,
  emptyMessage: string,
): { ok: true; value: string } | { ok: false; error: string } {
  const trimmed = value.trim();
  if (!trimmed) {
    return { ok: false, error: emptyMessage };
  }
  return { ok: true, value: trimmed };
}

export function parseDisplayName(
  value: string,
): { ok: true; value: string } | { ok: false; error: string } {
  const parsed = requiredTrimmed(value, "表示名を入力してください。");
  if (!parsed.ok) {
    return parsed;
  }
  if (parsed.value === WITHDRAWN_DISPLAY_NAME) {
    return { ok: false, error: "この表示名は使えません。" };
  }
  return parsed;
}

export function parseCommunityName(
  value: string,
): { ok: true; value: string } | { ok: false; error: string } {
  return requiredTrimmed(value, "麻雀グループ名を入力してください。");
}
