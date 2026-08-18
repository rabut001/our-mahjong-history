import { emptyRuleFormData, type RuleFormData } from "@/lib/domain/rule";

export type { RuleFormData };
export { emptyRuleFormData };

export const OTHER_MAX = 5;

export const TIE_OPTIONS = [
  { value: "kamicha", label: "上家取り" },
  { value: "split", label: "折半" },
  { value: "manual", label: "手動" },
] as const;

export type TieHandling = (typeof TIE_OPTIONS)[number]["value"];
