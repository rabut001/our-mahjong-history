import type { ReactNode } from "react";
import Link from "next/link";
import { ChevronLeftIcon, HomeIcon } from "@/components/NavIcons";
import { headerIconButtonClass } from "@/components/ui";
import { HOME_PATH } from "@/lib/supabase/paths";

type AppHeaderProps = {
  title: string;
  backHref?: string;
  back?: ReactNode;
  action?: ReactNode;
  showHome?: boolean;
};

export function HeaderIconButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={headerIconButtonClass}
    >
      {children}
    </button>
  );
}

export function AppHeader({
  title,
  backHref,
  back,
  action,
  showHome,
}: AppHeaderProps) {
  const homeVisible = showHome ?? Boolean(backHref);

  return (
    <header className="sticky top-0 z-10 bg-header text-header-fg [&_a]:min-h-header-btn [&_a]:border-header-fg [&_a]:text-header-fg [&_a]:shadow-[0_1px_0_rgb(0_0_0/0.25)] [&_a]:active:translate-y-px [&_a]:active:shadow-none [&_button]:min-h-header-btn [&_button]:border-header-fg [&_button]:text-header-fg [&_button]:shadow-[0_1px_0_rgb(0_0_0/0.25)] [&_button]:active:translate-y-px [&_button]:active:shadow-none">
      <div className="flex h-header items-center gap-2 px-2">
        <div className="flex w-28 shrink-0 items-center justify-start gap-2">
          {back ??
            (backHref ? (
              <Link
                href={backHref}
                aria-label="戻る"
                className={headerIconButtonClass}
              >
                <ChevronLeftIcon />
              </Link>
            ) : (
              <span />
            ))}
          {homeVisible ? (
            <Link
              href={HOME_PATH}
              aria-label="ホーム"
              className={headerIconButtonClass}
            >
              <HomeIcon />
            </Link>
          ) : null}
        </div>
        <h1 className="min-w-0 flex-1 truncate text-center text-heading font-medium">
          {title}
        </h1>
        <div className="flex w-28 shrink-0 justify-end">{action}</div>
      </div>
    </header>
  );
}
