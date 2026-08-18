export const INVITE_DEFAULT_DAYS = 7;
export const INVITE_CODE_LENGTH = 10;
export const INVITE_CODE_ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

const STORED_CODE_PATTERN = /^[0-9A-HJKMNP-TV-Z]{10}$/;

export function tokyoYmd(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo",
  }).format(now);
}

export function addDaysYmd(ymd: string, days: number): string {
  const [year, month, day] = ymd.split("-").map(Number);
  const next = new Date(Date.UTC(year, month - 1, day + days));
  return next.toISOString().slice(0, 10);
}

export function inviteExpiryYmd(
  tokyoToday: string = tokyoYmd(),
  days: number = INVITE_DEFAULT_DAYS,
): string {
  return addDaysYmd(tokyoToday, days);
}

export function inviteExpiresAt(
  tokyoToday: string = tokyoYmd(),
  days: number = INVITE_DEFAULT_DAYS,
): string {
  return `${inviteExpiryYmd(tokyoToday, days)}T12:00:00+09:00`;
}

export function normalizeInviteCode(code: string): string {
  return code
    .trim()
    .toUpperCase()
    .replaceAll("I", "1")
    .replaceAll("L", "1")
    .replaceAll("O", "0");
}

export function isInviteCodeFormat(code: string): boolean {
  return STORED_CODE_PATTERN.test(normalizeInviteCode(code));
}
