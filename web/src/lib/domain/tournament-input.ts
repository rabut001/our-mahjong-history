import { requiredTrimmed } from "@/lib/domain/text";

const YMD = /^\d{4}-\d{2}-\d{2}$/;

export function parseHeldOn(
  value: string,
): { ok: true; value: string } | { ok: false; error: string } {
  const trimmed = value.trim();
  if (!trimmed) {
    return { ok: false, error: "開催日を入力してください。" };
  }
  if (!YMD.test(trimmed)) {
    return { ok: false, error: "開催日を入力してください。" };
  }
  return { ok: true, value: trimmed };
}

export function parseTournamentName(
  value: string,
): { ok: true; value: string } | { ok: false; error: string } {
  return requiredTrimmed(value, "大会名を入力してください。");
}

export function parseGuestName(
  value: string,
  existing: string[],
): { ok: true; value: string } | { ok: false; error: string } {
  const parsed = requiredTrimmed(value, "表示名を入力してください。");
  if (!parsed.ok) {
    return parsed;
  }
  if (existing.includes(parsed.value)) {
    return { ok: false, error: "同じ名前のゲストがいます。" };
  }
  return parsed;
}
