import { Field, fieldClass, RadioOption, RadioRow } from "@/components/ui";
import { TIE_OPTIONS, type TieHandling } from "./data";

type OkaUmaFieldsProps = {
  readOnly: boolean;
  playerCount: 3 | 4;
  okaTieHandling: TieHandling;
  onOkaTieHandlingChange: (value: TieHandling) => void;
  umaEnabled: boolean;
  onUmaEnabledChange: (value: boolean) => void;
  umaTieHandling: TieHandling;
  onUmaTieHandlingChange: (value: TieHandling) => void;
  umaPoints1: string;
  onUmaPoints1Change: (value: string) => void;
  umaPoints2: string;
  onUmaPoints2Change: (value: string) => void;
  umaPoints1Error?: string;
  umaPoints2Error?: string;
};

export function OkaUmaFields({
  readOnly,
  playerCount,
  okaTieHandling,
  onOkaTieHandlingChange,
  umaEnabled,
  onUmaEnabledChange,
  umaTieHandling,
  onUmaTieHandlingChange,
  umaPoints1,
  onUmaPoints1Change,
  umaPoints2,
  onUmaPoints2Change,
  umaPoints1Error,
  umaPoints2Error,
}: OkaUmaFieldsProps) {
  return (
    <>
      <RadioRow legend="オカの同着時" disabled={readOnly}>
        {TIE_OPTIONS.map((option) => (
          <RadioOption
            key={option.value}
            name="okaTie"
            checked={okaTieHandling === option.value}
            onChange={() => onOkaTieHandlingChange(option.value)}
          >
            {option.label}
          </RadioOption>
        ))}
      </RadioRow>

      <RadioRow legend="ウマ" disabled={readOnly}>
        <RadioOption
          name="uma"
          checked={umaEnabled}
          onChange={() => onUmaEnabledChange(true)}
        >
          あり
        </RadioOption>
        <RadioOption
          name="uma"
          checked={!umaEnabled}
          onChange={() => onUmaEnabledChange(false)}
        >
          なし
        </RadioOption>
      </RadioRow>

      {umaEnabled ? (
        <>
          <RadioRow legend="ウマの同着時" disabled={readOnly}>
            {TIE_OPTIONS.map((option) => (
              <RadioOption
                key={option.value}
                name="umaTie"
                checked={umaTieHandling === option.value}
                onChange={() => onUmaTieHandlingChange(option.value)}
              >
                {option.label}
              </RadioOption>
            ))}
          </RadioRow>
          <Field label="ウマ（最上位 ⇔ 最下位）" error={umaPoints1Error}>
            <input
              type="number"
              inputMode="numeric"
              value={umaPoints1}
              onChange={(event) => onUmaPoints1Change(event.target.value)}
              disabled={readOnly}
              className={fieldClass}
            />
          </Field>
          {playerCount === 4 ? (
            <Field label="ウマ（2位 ⇔ 3位）" error={umaPoints2Error}>
              <input
                type="number"
                inputMode="numeric"
                value={umaPoints2}
                onChange={(event) => onUmaPoints2Change(event.target.value)}
                disabled={readOnly}
                className={fieldClass}
              />
            </Field>
          ) : null}
        </>
      ) : null}
    </>
  );
}
