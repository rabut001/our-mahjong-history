import { describe, expect, it } from "vitest";
import {
  INVITE_CODE_LENGTH,
  inviteExpiresAt,
  inviteExpiryYmd,
  isInviteCodeFormat,
  normalizeInviteCode,
  tokyoYmd,
} from "./invite";

describe("normalizeInviteCode", () => {
  it("小文字と別名を正規化する", () => {
    expect(normalizeInviteCode(" iloabcxyz1 ")).toBe("110ABCXYZ1");
  });
});

describe("isInviteCodeFormat", () => {
  it("正規化後に 10 文字なら受け入れる", () => {
    expect(isInviteCodeFormat("abcdefghjk")).toBe(true);
    expect(isInviteCodeFormat("ILO" + "A".repeat(7))).toBe(true);
  });

  it("長さや字母外は拒否する", () => {
    expect(isInviteCodeFormat("ABCDEFGHJ")).toBe(false);
    expect(isInviteCodeFormat("ABCDEFGHJKU")).toBe(false);
    expect(isInviteCodeFormat("ABCDEFGHJ*")).toBe(false);
  });
});

describe("inviteExpiryYmd", () => {
  it("JST の発行日から 7 日後", () => {
    expect(inviteExpiryYmd("2026-08-18", 7)).toBe("2026-08-25");
    expect(inviteExpiryYmd("2026-08-28", 7)).toBe("2026-09-04");
  });

  it("expires_at はその日の JST 正午", () => {
    expect(inviteExpiresAt("2026-08-18", 7)).toBe("2026-08-25T12:00:00+09:00");
  });
});

describe("tokyoYmd", () => {
  it("UTC 前日でも JST 当日になる", () => {
    expect(tokyoYmd(new Date("2026-08-18T15:30:00Z"))).toBe("2026-08-19");
  });
});

describe("INVITE_CODE_LENGTH", () => {
  it("10 文字", () => {
    expect(INVITE_CODE_LENGTH).toBe(10);
  });
});
