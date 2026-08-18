import type { TieHandling } from "@/lib/domain/types";
import { requiredTrimmed, trimToNull } from "@/lib/domain/text";

export type RuleFieldErrors = {
  name?: string;
  startingScore?: string;
  returnScore?: string;
  umaPoints1?: string;
  umaPoints2?: string;
  rate?: string;
};

export type ParsedRule = {
  name: string;
  playerCount: 3 | 4;
  startingScore: number;
  returnScore: number;
  okaTieHandling: TieHandling;
  umaEnabled: boolean;
  umaTieHandling: TieHandling | null;
  umaPoints1: number | null;
  umaPoints2: number | null;
  tobiEnabled: boolean;
  yakitoriEnabled: boolean;
  otherPoints1Name: string | null;
  otherPoints2Name: string | null;
  otherPoints3Name: string | null;
  otherPoints4Name: string | null;
  otherPoints5Name: string | null;
  rate: number;
  notes: string | null;
};

export const DUPLICATE_RULE_NAME_MESSAGE =
  "同じ名前のルールがすでに登録されています";
export const MISSING_RULE_NAME_MESSAGE = "ルールの表示名が未設定です";

export type RuleFormData = {
  name: string;
  playerCount: 3 | 4;
  startingScore: number;
  returnScore: number;
  okaTieHandling: TieHandling;
  umaEnabled: boolean;
  umaTieHandling: TieHandling | null;
  umaPoints1: number | null;
  umaPoints2: number | null;
  tobiEnabled: boolean;
  yakitoriEnabled: boolean;
  otherPoints1Name: string;
  otherPoints2Name: string;
  otherPoints3Name: string;
  otherPoints4Name: string;
  otherPoints5Name: string;
  rate: number;
  notes: string;
};

export function emptyRuleFormData(): RuleFormData {
  return {
    name: "",
    playerCount: 4,
    startingScore: 25000,
    returnScore: 30000,
    okaTieHandling: "kamicha",
    umaEnabled: true,
    umaTieHandling: "kamicha",
    umaPoints1: 30,
    umaPoints2: 10,
    tobiEnabled: true,
    yakitoriEnabled: false,
    otherPoints1Name: "",
    otherPoints2Name: "",
    otherPoints3Name: "",
    otherPoints4Name: "",
    otherPoints5Name: "",
    rate: 1,
    notes: "",
  };
}

type RuleInput = {
  name: string;
  playerCount: string;
  startingScore: string;
  returnScore: string;
  okaTieHandling: string;
  umaEnabled: string;
  umaTieHandling: string;
  umaPoints1: string;
  umaPoints2: string;
  tobiEnabled: string;
  yakitoriEnabled: string;
  otherNames: string[];
  rate: string;
  notes: string;
};

function parseInteger(
  raw: string,
  emptyMessage: string,
): { ok: true; value: number } | { ok: false; error: string } {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { ok: false, error: emptyMessage };
  }
  if (!/^-?\d+$/.test(trimmed)) {
    return { ok: false, error: "整数を入力してください。" };
  }
  const value = Number(trimmed);
  if (!Number.isSafeInteger(value)) {
    return { ok: false, error: "整数を入力してください。" };
  }
  return { ok: true, value };
}

function parseRate(
  raw: string,
): { ok: true; value: number } | { ok: false; error: string } {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { ok: false, error: "レートを入力してください。" };
  }
  const value = Number(trimmed);
  if (!Number.isFinite(value) || value < 0) {
    return { ok: false, error: "0以上の数を入力してください。" };
  }
  return { ok: true, value: Math.round(value * 10) / 10 };
}

function parseTie(raw: string): TieHandling | null {
  if (raw === "kamicha" || raw === "split" || raw === "manual") {
    return raw;
  }
  return null;
}

function parseBool(raw: string): boolean {
  return raw === "true" || raw === "1" || raw === "on";
}

export function parseRuleInput(
  input: RuleInput,
):
  | { ok: true; value: ParsedRule }
  | { ok: false; fieldErrors: RuleFieldErrors } {
  const fieldErrors: RuleFieldErrors = {};
  const name = requiredTrimmed(input.name, MISSING_RULE_NAME_MESSAGE);
  if (!name.ok) {
    fieldErrors.name = name.error;
  }

  const playerCount = input.playerCount === "3" ? 3 : 4;
  const startingScore = parseInteger(
    input.startingScore,
    "持ち点を入力してください。",
  );
  if (!startingScore.ok) {
    fieldErrors.startingScore = startingScore.error;
  }
  const returnScore = parseInteger(
    input.returnScore,
    "返し点を入力してください。",
  );
  if (!returnScore.ok) {
    fieldErrors.returnScore = returnScore.error;
  }

  const okaTieHandling = parseTie(input.okaTieHandling) ?? "kamicha";
  const umaEnabled = parseBool(input.umaEnabled);
  const rate = parseRate(input.rate);
  if (!rate.ok) {
    fieldErrors.rate = rate.error;
  }

  let umaTieHandling: TieHandling | null = null;
  let umaPoints1: number | null = null;
  let umaPoints2: number | null = null;

  if (umaEnabled) {
    umaTieHandling = parseTie(input.umaTieHandling) ?? "kamicha";
    const p1 = parseInteger(
      input.umaPoints1,
      "ウマのポイントを入力してください。",
    );
    if (!p1.ok) {
      fieldErrors.umaPoints1 = p1.error;
    } else {
      umaPoints1 = p1.value;
    }
    if (playerCount === 4) {
      const p2 = parseInteger(
        input.umaPoints2,
        "ウマのポイントを入力してください。",
      );
      if (!p2.ok) {
        fieldErrors.umaPoints2 = p2.error;
      } else {
        umaPoints2 = p2.value;
      }
    }
  }

  if (Object.keys(fieldErrors).length > 0 || !name.ok) {
    return { ok: false, fieldErrors };
  }

  const packed = input.otherNames
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
    .slice(0, 5);

  return {
    ok: true,
    value: {
      name: name.value,
      playerCount,
      startingScore: startingScore.ok ? startingScore.value : 0,
      returnScore: returnScore.ok ? returnScore.value : 0,
      okaTieHandling,
      umaEnabled,
      umaTieHandling,
      umaPoints1,
      umaPoints2,
      tobiEnabled: parseBool(input.tobiEnabled),
      yakitoriEnabled: parseBool(input.yakitoriEnabled),
      otherPoints1Name: packed[0] ?? null,
      otherPoints2Name: packed[1] ?? null,
      otherPoints3Name: packed[2] ?? null,
      otherPoints4Name: packed[3] ?? null,
      otherPoints5Name: packed[4] ?? null,
      rate: rate.ok ? rate.value : 0,
      notes: trimToNull(input.notes),
    },
  };
}

export function ruleInputFromFormData(formData: FormData) {
  const otherNames: string[] = [];
  for (let index = 1; index <= 5; index += 1) {
    otherNames.push(String(formData.get(`otherPoints${index}Name`) ?? ""));
  }
  return {
    name: String(formData.get("name") ?? ""),
    playerCount: String(formData.get("playerCount") ?? "4"),
    startingScore: String(formData.get("startingScore") ?? ""),
    returnScore: String(formData.get("returnScore") ?? ""),
    okaTieHandling: String(formData.get("okaTieHandling") ?? "kamicha"),
    umaEnabled: String(formData.get("umaEnabled") ?? "true"),
    umaTieHandling: String(formData.get("umaTieHandling") ?? "kamicha"),
    umaPoints1: String(formData.get("umaPoints1") ?? ""),
    umaPoints2: String(formData.get("umaPoints2") ?? ""),
    tobiEnabled: String(formData.get("tobiEnabled") ?? "false"),
    yakitoriEnabled: String(formData.get("yakitoriEnabled") ?? "false"),
    otherNames,
    rate: String(formData.get("rate") ?? ""),
    notes: String(formData.get("notes") ?? ""),
  };
}
