import { describe, expect, it } from "vitest";
import { parseRuleInput } from "./rule";

const base = {
  name: "四麻標準",
  playerCount: "4",
  startingScore: "25000",
  returnScore: "30000",
  okaTieHandling: "kamicha",
  umaEnabled: "true",
  umaTieHandling: "kamicha",
  umaPoints1: "30",
  umaPoints2: "10",
  tobiEnabled: "true",
  yakitoriEnabled: "false",
  otherNames: ["祝儀", "", "", "", ""],
  rate: "1.0",
  notes: "",
};

describe("parseRuleInput", () => {
  it("既定の四麻を受け入れる", () => {
    const parsed = parseRuleInput(base);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) {
      return;
    }
    expect(parsed.value.playerCount).toBe(4);
    expect(parsed.value.umaPoints2).toBe(10);
    expect(parsed.value.otherPoints1Name).toBe("祝儀");
    expect(parsed.value.otherPoints2Name).toBeNull();
  });

  it("空の表示名はエラー", () => {
    const parsed = parseRuleInput({ ...base, name: "  " });
    expect(parsed.ok).toBe(false);
    if (parsed.ok) {
      return;
    }
    expect(parsed.fieldErrors.name).toBe("ルールの表示名が未設定です");
  });

  it("三麻のウマは 2位⇔3位を持たない", () => {
    const parsed = parseRuleInput({
      ...base,
      playerCount: "3",
      umaPoints1: "20",
      umaPoints2: "10",
    });
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) {
      return;
    }
    expect(parsed.value.umaPoints2).toBeNull();
  });

  it("ウマあり四麻でウマptが空ならエラー", () => {
    const parsed = parseRuleInput({ ...base, umaPoints2: "" });
    expect(parsed.ok).toBe(false);
    if (parsed.ok) {
      return;
    }
    expect(parsed.fieldErrors.umaPoints2).toBe(
      "ウマのポイントを入力してください。",
    );
  });

  it("負のレートはエラー", () => {
    const parsed = parseRuleInput({ ...base, rate: "-1" });
    expect(parsed.ok).toBe(false);
    if (parsed.ok) {
      return;
    }
    expect(parsed.fieldErrors.rate).toBe("0以上の数を入力してください。");
  });
});
