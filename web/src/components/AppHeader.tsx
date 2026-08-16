import type { ReactNode } from "react";
import { NavButton } from "@/components/NavButton";

type AppHeaderProps = {
  title: string;
  backHref?: string;
  action?: ReactNode;
};

export function AppHeader({ title, backHref, action }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-10 border-b border-neutral-300 bg-white">
      <div className="flex h-12 items-center gap-2 px-2">
        <div className="flex w-[4.75rem] shrink-0 justify-start">
          {backHref ? <NavButton href={backHref}>戻る</NavButton> : <span />}
        </div>
        <h1 className="min-w-0 flex-1 truncate text-center text-base font-medium">
          {title}
        </h1>
        <div className="flex w-[4.75rem] shrink-0 justify-end">{action}</div>
      </div>
    </header>
  );
}
