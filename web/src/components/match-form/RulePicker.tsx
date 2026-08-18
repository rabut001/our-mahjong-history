import { RadioOption } from "@/components/ui";
import type { MatchFormRule } from "./types";

type RulePickerProps = {
  rules: MatchFormRule[];
  selectedRuleId: string;
  onSelect: (rule: MatchFormRule) => void;
};

export function RulePicker({
  rules,
  selectedRuleId,
  onSelect,
}: RulePickerProps) {
  if (rules.length <= 1) {
    const rule = rules[0];
    if (!rule) {
      return null;
    }
    return (
      <p className="text-sm text-muted">
        ルール {rule.name}
        <span className="ml-2">{rule.playerCount === 4 ? "四麻" : "三麻"}</span>
      </p>
    );
  }

  return (
    <fieldset>
      <legend className="text-sm">ルール</legend>
      <ul className="mt-2 space-y-2">
        {rules.map((item) => (
          <li key={item.id}>
            <RadioOption
              name="rule"
              checked={item.id === selectedRuleId}
              onChange={() => onSelect(item)}
            >
              {item.name}
              <span className="text-sm text-muted">
                {item.playerCount === 4 ? "四麻" : "三麻"}
              </span>
            </RadioOption>
          </li>
        ))}
      </ul>
    </fieldset>
  );
}
