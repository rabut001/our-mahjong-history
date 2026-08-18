import {
  Field,
  fieldClass,
  textareaClass,
  TEXTAREA_ROWS,
} from "@/components/ui";

type RateNotesFieldsProps = {
  readOnly: boolean;
  rate: string;
  onRateChange: (value: string) => void;
  onRateBlur: () => void;
  notes: string;
  onNotesChange: (value: string) => void;
};

export function RateNotesFields({
  readOnly,
  rate,
  onRateChange,
  onRateBlur,
  notes,
  onNotesChange,
}: RateNotesFieldsProps) {
  return (
    <>
      <Field label="レート">
        <input
          type="text"
          inputMode="decimal"
          value={rate}
          onChange={(event) => onRateChange(event.target.value)}
          onBlur={onRateBlur}
          disabled={readOnly}
          className={fieldClass}
        />
      </Field>

      <Field label="メモ">
        <textarea
          value={notes}
          onChange={(event) => onNotesChange(event.target.value)}
          disabled={readOnly}
          rows={TEXTAREA_ROWS}
          className={textareaClass}
        />
      </Field>
    </>
  );
}
