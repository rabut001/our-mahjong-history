import type { Rule } from "@/mock/types";

export type RuleFormData = Omit<Rule, "id">;

export function toRuleFormData(rule: Rule): RuleFormData {
  return {
    name: rule.name,
    playerCount: rule.playerCount,
    startingScore: rule.startingScore,
    returnScore: rule.returnScore,
    okaTieHandling: rule.okaTieHandling,
    umaEnabled: rule.umaEnabled,
    umaTieHandling: rule.umaTieHandling,
    umaPoints1: rule.umaPoints1,
    umaPoints2: rule.umaPoints2,
    tobiEnabled: rule.tobiEnabled,
    yakitoriEnabled: rule.yakitoriEnabled,
    otherPoints1Name: rule.otherPoints1Name,
    otherPoints2Name: rule.otherPoints2Name,
    otherPoints3Name: rule.otherPoints3Name,
    otherPoints4Name: rule.otherPoints4Name,
    otherPoints5Name: rule.otherPoints5Name,
    rate: rule.rate,
    notes: rule.notes,
  };
}

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

export const OTHER_MAX = 5;

export const TIE_OPTIONS = [
  { value: "kamicha", label: "上家取り" },
  { value: "split", label: "折半" },
  { value: "manual", label: "手動" },
] as const;

export type TieHandling = (typeof TIE_OPTIONS)[number]["value"];
