import Link from "next/link";
import type { ReactNode } from "react";
import {
  blockButtonClass,
  compactButtonClass,
  outlineBlockButtonClass,
} from "@/components/ui";

type NavButtonProps = {
  href: string;
  children: ReactNode;
  variant?: "compact" | "block" | "outline";
};

export function NavButton({
  href,
  children,
  variant = "compact",
}: NavButtonProps) {
  const className =
    variant === "block"
      ? blockButtonClass
      : variant === "outline"
        ? outlineBlockButtonClass
        : compactButtonClass;

  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}
