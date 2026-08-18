"use client";

import { useState } from "react";
import { CellInput } from "@/components/ui";
import { parseAmount } from "./helpers";

type AmountCellProps = {
  amount: number;
  disabled?: boolean;
  "aria-label": string;
  onAmountChange: (amount: number) => void;
};

export function AmountCell({
  amount,
  disabled,
  onAmountChange,
  "aria-label": ariaLabel,
}: AmountCellProps) {
  const [draft, setDraft] = useState<string | null>(null);

  return (
    <CellInput
      type="number"
      step="0.1"
      disabled={disabled}
      aria-label={ariaLabel}
      value={draft ?? (amount === 0 ? "" : String(amount))}
      onChange={(event) => {
        const raw = event.target.value;
        setDraft(raw);
        onAmountChange(parseAmount(raw));
      }}
      onBlur={() => setDraft(null)}
    />
  );
}
