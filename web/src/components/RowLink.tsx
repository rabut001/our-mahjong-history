import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronRight } from "@/components/ChevronRight";

type RowLinkProps = {
  href: string;
  children: ReactNode;
  label?: string;
};

export function RowLink({ href, children, label }: RowLinkProps) {
  return (
    <Link
      href={href}
      aria-label={label}
      className="flex items-center justify-between gap-3 py-3 text-ink"
    >
      <span className="min-w-0 flex-1">{children}</span>
      <ChevronRight className="h-5 w-5 shrink-0 text-muted" />
    </Link>
  );
}
