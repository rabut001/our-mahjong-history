"use client";

import { useActionState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { Field, blockButtonClass, fieldClass } from "@/components/ui";
import { requestPasswordResetAction } from "@/lib/data/auth-actions";
import { LOGIN_PATH } from "@/lib/supabase/paths";

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState(
    requestPasswordResetAction,
    {},
  );

  return (
    <>
      <AppHeader
        title="パスワードを忘れた"
        backHref={LOGIN_PATH}
        showHome={false}
      />
      <main className="px-4 py-4">
        <p className="text-sm leading-6 text-muted">
          登録したメールアドレスを入力してください。再設定用のリンクを送ります。
        </p>
        <form className="mt-6 space-y-6" action={formAction}>
          <Field label="メールアドレス" error={state.formError}>
            <input
              type="email"
              name="email"
              autoComplete="email"
              className={fieldClass}
            />
          </Field>
          <button
            type="submit"
            disabled={pending}
            className={`${blockButtonClass} disabled:opacity-60`}
          >
            送信する
          </button>
        </form>
      </main>
    </>
  );
}
