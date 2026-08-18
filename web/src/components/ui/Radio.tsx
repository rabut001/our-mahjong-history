import type { ReactNode } from "react";

type RadioRowProps = {
  legend: string;
  disabled: boolean;
  children: ReactNode;
};

export function RadioRow({ legend, disabled, children }: RadioRowProps) {
  return (
    <fieldset disabled={disabled}>
      <legend className="text-sm">{legend}</legend>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2">{children}</div>
    </fieldset>
  );
}

type RadioOptionProps = {
  name: string;
  checked: boolean;
  onChange: () => void;
  children: ReactNode;
};

export function RadioOption({
  name,
  checked,
  onChange,
  children,
}: RadioOptionProps) {
  return (
    <label className="flex items-center gap-2 text-base">
      <input type="radio" name={name} checked={checked} onChange={onChange} />
      {children}
    </label>
  );
}
