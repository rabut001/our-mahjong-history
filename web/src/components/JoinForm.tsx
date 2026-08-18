"use client";

import { useActionState } from "react";
import { Field, fieldClass, blockButtonClass } from "@/components/ui";
import type { FormState } from "@/lib/data/types";

type JoinFormProps = {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
};

export function JoinForm({ action }: JoinFormProps) {
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction} className="space-y-6">
      <Field label="招待コード" error={state.fieldErrors?.code}>
        <input
          type="text"
          name="code"
          autoCapitalize="characters"
          autoCorrect="off"
          spellCheck={false}
          className={fieldClass}
        />
      </Field>
      <p className="text-sm leading-6 text-muted">
        招待コードを入力し「参加する」ボタンを押してください。
        <br />
        コードは麻雀グループに参加済みの人に確認してください。
      </p>
      {state.formError ? (
        <p className="text-sm text-muted">{state.formError}</p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className={`${blockButtonClass} disabled:opacity-60`}
      >
        参加する
      </button>
    </form>
  );
}
