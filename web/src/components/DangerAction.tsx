"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { blockButtonClass, outlineBlockButtonClass } from "@/components/ui";

type DangerActionProps = {
  label: string;
  dialogTitle: string;
  dialogBody?: string;
  confirmLabel: string;
  doneHref: string;
  disabled?: boolean;
  disabledNote?: string;
};

export function DangerAction({
  label,
  dialogTitle,
  dialogBody,
  confirmLabel,
  doneHref,
  disabled = false,
  disabledNote,
}: DangerActionProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <div className="mt-16 text-center">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(true)}
        className="text-sm text-muted disabled:text-line"
      >
        {label}
      </button>
      {disabled && disabledNote ? (
        <p className="mt-2 text-sm text-muted">{disabledNote}</p>
      ) : null}
      {open ? (
        <div
          className="fixed inset-0 z-20 flex items-center justify-center bg-ink/40 px-6"
          onClick={() => setOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={dialogTitle}
            onClick={(event) => event.stopPropagation()}
            className="w-full max-w-xs rounded-ui bg-surface px-4 py-4 text-left"
          >
            <p className="text-sm font-medium">{dialogTitle}</p>
            {dialogBody ? (
              <p className="mt-2 text-sm leading-6 text-muted">{dialogBody}</p>
            ) : null}
            <div className="mt-4 space-y-2">
              <button
                type="button"
                onClick={() => router.push(doneHref)}
                className={blockButtonClass}
              >
                {confirmLabel}
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className={outlineBlockButtonClass}
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
