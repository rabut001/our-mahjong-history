"use client";

import { useActionState, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { AppHeader, HeaderIconButton } from "@/components/AppHeader";
import { ChevronLeftIcon } from "@/components/NavIcons";
import { Field, blockButtonClass, fieldClass } from "@/components/ui";
import {
  signOutToLoginAction,
  updatePasswordAction,
} from "@/lib/data/auth-actions";
import { createClient } from "@/lib/supabase/client";
import { LOGIN_PATH } from "@/lib/supabase/paths";

export function ResetPasswordForm() {
  const [passwordError, setPasswordError] = useState("");
  const [state, formAction, pending] = useActionState(updatePasswordAction, {});

  useEffect(() => {
    void createClient().auth.getSession();
  }, []);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    const password = String(
      new FormData(event.currentTarget).get("password") ?? "",
    );
    if (!password.trim()) {
      event.preventDefault();
      setPasswordError("パスワードを入力してください。");
    } else {
      setPasswordError("");
    }
  }

  if (state.ok) {
    return (
      <>
        <AppHeader
          title="パスワードの再設定"
          backHref={LOGIN_PATH}
          showHome={false}
        />
        <main className="px-4 py-4">
          <p className="text-sm leading-6">パスワードを変更しました。</p>
          <p className="mt-6 text-center text-sm">
            <Link href={LOGIN_PATH} className="underline">
              ログイン
            </Link>
          </p>
        </main>
      </>
    );
  }

  return (
    <>
      <AppHeader
        title="パスワードの再設定"
        back={
          <HeaderIconButton
            label="戻る"
            onClick={() => {
              void signOutToLoginAction();
            }}
          >
            <ChevronLeftIcon />
          </HeaderIconButton>
        }
        showHome={false}
      />
      <main className="px-4 py-4">
        <p className="text-sm leading-6 text-muted">
          新しいパスワードを入力してください。
        </p>
        <form
          className="mt-6 space-y-6"
          action={formAction}
          onSubmit={handleSubmit}
        >
          <Field
            label="新しいパスワード"
            error={passwordError || state.formError}
          >
            <input
              type="password"
              name="password"
              autoComplete="new-password"
              className={fieldClass}
            />
          </Field>
          <button
            type="submit"
            disabled={pending}
            className={`${blockButtonClass} disabled:opacity-60`}
          >
            変更する
          </button>
        </form>
      </main>
    </>
  );
}
