import { Children, type ReactNode } from "react";

type SectionCardProps = {
  title: string;
  action?: ReactNode;
  children?: ReactNode;
};

export function SectionCard({ title, action, children }: SectionCardProps) {
  const hasBody = Children.toArray(children).length > 0;

  return (
    <section className="rounded-ui border border-line p-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-medium">{title}</h2>
        {action}
      </div>
      {hasBody ? <div className="mt-3">{children}</div> : null}
    </section>
  );
}
