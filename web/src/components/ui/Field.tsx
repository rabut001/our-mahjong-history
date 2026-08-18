import type { ReactNode } from "react";
import { labelClass } from "./classes";

type FieldProps = {
  label: string;
  children: ReactNode;
  error?: string;
};

export function Field({ label, children, error }: FieldProps) {
  return (
    <label className={labelClass}>
      {label}
      {children}
      {error ? (
        <span className="mt-1 block text-sm text-muted">{error}</span>
      ) : null}
    </label>
  );
}
