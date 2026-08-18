import type { ReactNode } from "react";
import { labelClass } from "./classes";

type FieldProps = {
  label: string;
  children: ReactNode;
};

export function Field({ label, children }: FieldProps) {
  return (
    <label className={labelClass}>
      {label}
      {children}
    </label>
  );
}
