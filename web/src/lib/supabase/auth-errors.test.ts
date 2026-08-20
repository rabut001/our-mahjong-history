import { describe, expect, test } from "vitest";
import {
  authQueryKeyFromCallback,
  authQueryMessage,
  parseAuthQueryKey,
} from "./auth-errors";

describe("authQueryKeyFromCallback", () => {
  test("maps access_denied", () => {
    expect(authQueryKeyFromCallback({ error: "access_denied" })).toBe("denied");
  });

  test("maps expired codes", () => {
    expect(authQueryKeyFromCallback({ errorCode: "otp_expired" })).toBe(
      "expired",
    );
    expect(
      authQueryKeyFromCallback({
        authError: { message: "flow expired", code: "flow_state_expired" },
      }),
    ).toBe("expired");
  });

  test("falls back to oauth", () => {
    expect(
      authQueryKeyFromCallback({
        authError: { message: "bad code verifier", code: "bad_code_verifier" },
      }),
    ).toBe("oauth");
  });
});

describe("authQueryMessage", () => {
  test("whitelists keys", () => {
    expect(parseAuthQueryKey("denied")).toBe("denied");
    expect(parseAuthQueryKey("<script>")).toBeNull();
  });

  test("returns Japanese for login and signup", () => {
    expect(authQueryMessage("denied")).toBe("ログインがキャンセルされました。");
    expect(authQueryMessage("denied", "signup")).toBe(
      "登録がキャンセルされました。",
    );
    expect(authQueryMessage("oauth", "signup")).toBe(
      "この方法では登録できませんでした。",
    );
  });
});
