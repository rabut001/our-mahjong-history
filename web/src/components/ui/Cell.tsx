import type { ComponentProps, ReactNode } from "react";
import { cellInputClass, cellSelectClass, gridLabelClass } from "./classes";

export function CellInput(props: Omit<ComponentProps<"input">, "className">) {
  return <input {...props} className={cellInputClass} />;
}

export function CellSelect(props: Omit<ComponentProps<"select">, "className">) {
  return <select {...props} className={cellSelectClass} />;
}

export function CellRead({ children }: { children: string }) {
  return (
    <p className="px-0.5 py-1 text-center text-sm tabular-nums text-muted">
      {children}
    </p>
  );
}

export function GridRow({
  label,
  children,
}: {
  label: ReactNode;
  children: ReactNode;
}) {
  return (
    <>
      <div className={gridLabelClass}>{label}</div>
      {children}
    </>
  );
}
