import Link from "next/link";
import type { ReactNode } from "react";

const compactClass =
  "inline-flex shrink-0 items-center justify-center border border-neutral-400 px-3 py-1 text-sm";
const blockClass =
  "block w-full border border-neutral-400 px-4 py-3 text-center text-sm";

type NavButtonProps = {
  href: string;
  children: ReactNode;
  variant?: "compact" | "block";
};

export function NavButton({
  href,
  children,
  variant = "compact",
}: NavButtonProps) {
  return (
    <Link
      href={href}
      className={variant === "block" ? blockClass : compactClass}
    >
      {children}
    </Link>
  );
}
