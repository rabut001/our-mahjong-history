import { Field, fieldClass, RadioOption, RadioRow } from "@/components/ui";

type BasicFieldsProps = {
  readOnly: boolean;
  name: string;
  onNameChange: (value: string) => void;
  playerCount: 3 | 4;
  onPlayerCountChange: (value: 3 | 4) => void;
  startingScore: string;
  onStartingScoreChange: (value: string) => void;
  returnScore: string;
  onReturnScoreChange: (value: string) => void;
};

export function BasicFields({
  readOnly,
  name,
  onNameChange,
  playerCount,
  onPlayerCountChange,
  startingScore,
  onStartingScoreChange,
  returnScore,
  onReturnScoreChange,
}: BasicFieldsProps) {
  return (
    <>
      <Field label="表示名">
        <input
          type="text"
          value={name}
          onChange={(event) => onNameChange(event.target.value)}
          disabled={readOnly}
          placeholder="例: 四麻標準"
          className={fieldClass}
        />
      </Field>

      <RadioRow legend="人数" disabled={readOnly}>
        <RadioOption
          name="playerCount"
          checked={playerCount === 4}
          onChange={() => onPlayerCountChange(4)}
        >
          四麻
        </RadioOption>
        <RadioOption
          name="playerCount"
          checked={playerCount === 3}
          onChange={() => onPlayerCountChange(3)}
        >
          三麻
        </RadioOption>
      </RadioRow>

      <Field label="持ち点">
        <input
          type="number"
          inputMode="numeric"
          value={startingScore}
          onChange={(event) => onStartingScoreChange(event.target.value)}
          disabled={readOnly}
          className={fieldClass}
        />
      </Field>

      <Field label="返し点">
        <input
          type="number"
          inputMode="numeric"
          value={returnScore}
          onChange={(event) => onReturnScoreChange(event.target.value)}
          disabled={readOnly}
          className={fieldClass}
        />
      </Field>
    </>
  );
}
