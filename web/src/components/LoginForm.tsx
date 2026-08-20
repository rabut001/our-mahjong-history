"use client";

import { useActionState, useState, type FormEvent } from "react";
import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";
import { OAuthButtons, OrDivider } from "@/components/OAuthButtons";
import { Field, fieldClass, outlineBlockButtonClass } from "@/components/ui";
import { signInWithEmailAction } from "@/lib/data/auth-actions";
import {
  CALLBACK_PATH,
  FORGOT_PASSWORD_PATH,
  HOME_PATH,
  SIGNUP_PATH,
} from "@/lib/supabase/paths";

type LoginFormProps = {
  next: string;
};

function callbackUrl(next: string) {
  const url = new URL(CALLBACK_PATH, window.location.origin);
  if (next !== HOME_PATH) {
    url.searchParams.set("next", next);
  }
  return url.toString();
}

export function LoginForm({ next }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [state, formAction, pending] = useActionState(
    signInWithEmailAction,
    {},
  );

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    let hasError = false;
    if (!email.trim()) {
      setEmailError("メールアドレスを入力してください。");
      hasError = true;
    } else {
      setEmailError("");
    }
    if (!password.trim()) {
      setPasswordError("パスワードを入力してください。");
      hasError = true;
    } else {
      setPasswordError("");
    }
    if (hasError) {
      event.preventDefault();
    }
  }

  return (
    <>
      <AppHeader title="ログイン" />
      <main className="px-4 py-4">
        <form className="space-y-6" action={formAction} onSubmit={handleSubmit}>
          <input type="hidden" name="next" value={next} />
          <Field label="メールアドレス" error={emailError}>
            <input
              type="email"
              name="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className={fieldClass}
            />
          </Field>
          <div>
            <Field label="パスワード" error={passwordError}>
              <input
                type="password"
                name="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className={fieldClass}
              />
            </Field>
            <p className="mt-2 text-right text-sm">
              <Link href={FORGOT_PASSWORD_PATH} className="underline">
                パスワードを忘れた
              </Link>
            </p>
          </div>
          <button
            type="submit"
            disabled={pending}
            className={`${outlineBlockButtonClass} disabled:opacity-60`}
          >
            ログイン
          </button>
          {state.formError ? (
            <p className="text-sm text-muted">{state.formError}</p>
          ) : null}
        </form>
        <div className="mt-6">
          <OrDivider />
        </div>
        <div className="mt-6">
          <OAuthButtons
            mode="login"
            redirectTo={callbackUrl(next)}
            disabled={pending}
          />
        </div>
        <p className="mt-6 text-center text-base">
          アカウントを持っていない方は{" "}
          <Link href={SIGNUP_PATH} className="underline">
            アカウントを作成
          </Link>
        </p>
      </main>
    </>
  );
}
