import { describe, expect, it } from "vitest";
import {
  parseCommunityName,
  parseDisplayName,
  trimToNull,
  WITHDRAWN_DISPLAY_NAME,
} from "./text";

describe("trimToNull", () => {
  it("空白のみは null", () => {
    expect(trimToNull("  \n ")).toBeNull();
  });

  it("前後の空白を除いて返す", () => {
    expect(trimToNull("  hello  ")).toBe("hello");
  });
});

describe("parseCommunityName", () => {
  it("空はエラー", () => {
    expect(parseCommunityName("   ")).toEqual({
      ok: false,
      error: "麻雀グループ名を入力してください。",
    });
  });

  it("前後空白を除く", () => {
    expect(parseCommunityName(" 金曜麻雀 ")).toEqual({
      ok: true,
      value: "金曜麻雀",
    });
  });
});

describe("parseDisplayName", () => {
  it("空はエラー", () => {
    expect(parseDisplayName("")).toEqual({
      ok: false,
      error: "表示名を入力してください。",
    });
  });

  it("退会済みの予約名は使えない", () => {
    expect(parseDisplayName(WITHDRAWN_DISPLAY_NAME)).toEqual({
      ok: false,
      error: "この表示名は使えません。",
    });
  });
});
