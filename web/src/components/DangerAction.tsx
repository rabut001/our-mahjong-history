"use client";

import { useActionState, useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { blockButtonClass, outlineBlockButtonClass } from "@/components/ui";
import type { FormState } from "@/lib/data/types";

type DangerActionProps = {
  label: string;
  dialogTitle: string;
  dialogBody?: string;
  confirmLabel: string;
  doneHref: string;
  action?: (prev: FormState, formData: FormData) => Promise<FormState>;
  hiddenFields?: Record<string, string>;
  disabled?: boolean;
  disabledNote?: string;
};

export function DangerAction({
  label,
  dialogTitle,
  dialogBody,
  confirmLabel,
  doneHref,
  action,
  hiddenFields,
  disabled = false,
  disabledNote,
}: DangerActionProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    action ?? (async () => ({})),
    {},
  );
  const triggerRef = useRef<HTMLButtonElement>(null);
  const onCancel = useCallback(() => setOpen(false), []);

  return (
    <div className="mt-16 text-center">
      <button
        ref={triggerRef}
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
      <ConfirmDialog
        open={open}
        title={dialogTitle}
        body={dialogBody}
        onCancel={onCancel}
        triggerRef={triggerRef}
      >
        {action ? (
          <form action={formAction} className="space-y-2">
            {hiddenFields
              ? Object.entries(hiddenFields).map(([name, value]) => (
                  <input key={name} type="hidden" name={name} value={value} />
                ))
              : null}
            {state.formError ? (
              <p className="text-sm text-muted">{state.formError}</p>
            ) : null}
            <button
              type="submit"
              disabled={pending}
              className={`${blockButtonClass} disabled:opacity-60`}
            >
              {confirmLabel}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className={outlineBlockButtonClass}
            >
              キャンセル
            </button>
          </form>
        ) : (
          <>
            <button
              type="button"
              onClick={() => router.push(doneHref)}
              className={blockButtonClass}
            >
              {confirmLabel}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className={outlineBlockButtonClass}
            >
              キャンセル
            </button>
          </>
        )}
      </ConfirmDialog>
    </div>
  );
}
