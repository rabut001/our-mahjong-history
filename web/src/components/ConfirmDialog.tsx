"use client";

import { useEffect, useRef, type ReactNode, type RefObject } from "react";

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function focusableIn(root: HTMLElement): HTMLElement[] {
  return [...root.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
    (element) => !element.hasAttribute("disabled"),
  );
}

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  body?: string;
  onCancel: () => void;
  triggerRef?: RefObject<HTMLElement | null>;
  children: ReactNode;
};

export function ConfirmDialog({
  open,
  title,
  body,
  onCancel,
  triggerRef,
  children,
}: ConfirmDialogProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    const previousOverflow = document.body.style.overflow;
    const trigger = triggerRef?.current;
    document.body.style.overflow = "hidden";
    const panel = panelRef.current;
    const items = panel ? focusableIn(panel) : [];
    items[0]?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onCancel();
        return;
      }
      if (event.key !== "Tab" || !panelRef.current) {
        return;
      }
      const focusable = focusableIn(panelRef.current);
      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) {
        return;
      }
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
      trigger?.focus();
    };
  }, [open, onCancel, triggerRef]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-20 flex items-center justify-center bg-ink/40 px-6"
      onClick={onCancel}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
        className="w-full max-w-xs rounded-ui bg-surface px-4 py-4 text-left"
      >
        <p className="text-sm font-medium">{title}</p>
        {body ? (
          <p className="mt-2 text-sm leading-6 text-muted">{body}</p>
        ) : null}
        <div className="mt-4 space-y-2">{children}</div>
      </div>
    </div>
  );
}
