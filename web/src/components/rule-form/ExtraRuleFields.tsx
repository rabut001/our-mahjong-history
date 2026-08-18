import {
  compactButtonClass,
  fieldClass,
  RadioOption,
  RadioRow,
} from "@/components/ui";
import { OTHER_MAX } from "./data";

type ExtraRuleFieldsProps = {
  readOnly: boolean;
  tobiEnabled: boolean;
  onTobiEnabledChange: (value: boolean) => void;
  yakitoriEnabled: boolean;
  onYakitoriEnabledChange: (value: boolean) => void;
  otherNames: string[];
  onOtherNameChange: (index: number, value: string) => void;
  onAddOtherName: () => void;
};

export function ExtraRuleFields({
  readOnly,
  tobiEnabled,
  onTobiEnabledChange,
  yakitoriEnabled,
  onYakitoriEnabledChange,
  otherNames,
  onOtherNameChange,
  onAddOtherName,
}: ExtraRuleFieldsProps) {
  return (
    <>
      <RadioRow legend="トビ" disabled={readOnly}>
        <RadioOption
          name="tobi"
          checked={tobiEnabled}
          onChange={() => onTobiEnabledChange(true)}
        >
          あり
        </RadioOption>
        <RadioOption
          name="tobi"
          checked={!tobiEnabled}
          onChange={() => onTobiEnabledChange(false)}
        >
          なし
        </RadioOption>
      </RadioRow>

      <RadioRow legend="焼き鳥" disabled={readOnly}>
        <RadioOption
          name="yakitori"
          checked={yakitoriEnabled}
          onChange={() => onYakitoriEnabledChange(true)}
        >
          あり
        </RadioOption>
        <RadioOption
          name="yakitori"
          checked={!yakitoriEnabled}
          onChange={() => onYakitoriEnabledChange(false)}
        >
          なし
        </RadioOption>
      </RadioRow>

      <section>
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm">その他ポイント</h2>
          {!readOnly && otherNames.length < OTHER_MAX ? (
            <button
              type="button"
              onClick={onAddOtherName}
              className={compactButtonClass}
            >
              追加
            </button>
          ) : null}
        </div>
        <ul className="mt-2 space-y-2">
          {otherNames.map((item, index) => (
            <li key={index}>
              <input
                type="text"
                value={item}
                onChange={(event) =>
                  onOtherNameChange(index, event.target.value)
                }
                disabled={readOnly}
                aria-label={`その他ポイント${index + 1}`}
                placeholder="例：役満ご祝儀"
                className={fieldClass}
              />
            </li>
          ))}
        </ul>
        <p className="mt-2 text-sm text-muted">
          試合で手入力する枠です。未使用なら空のままで大丈夫です。
        </p>
      </section>
    </>
  );
}
