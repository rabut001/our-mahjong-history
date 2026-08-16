import Link from "next/link";
import type { ReactNode } from "react";

type AppHeaderProps = {
  title: string;
  backHref?: string;
  action?: ReactNode;
};

export function AppHeader({ title, backHref, action }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-10 border-b border-neutral-300 bg-white">
      <div className="grid h-12 grid-cols-[4.5rem_1fr_4.5rem] items-center px-2">
        {backHref ? (
          <Link
            href={backHref}
            className="inline-flex h-10 items-center justify-start px-1 text-sm"
          >
            戻る
          </Link>
        ) : (
          <span />
        )}
        <h1 className="truncate text-center text-base font-medium">{title}</h1>
        {action ? (
          <div className="flex h-10 items-center justify-end px-1 text-sm">
            {action}
          </div>
        ) : (
          <span />
        )}
      </div>
    </header>
  );
}
