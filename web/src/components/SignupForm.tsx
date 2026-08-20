"use client";

import Link from "next/link";
import { useActionState, useState, type FormEvent } from "react";
import { AppHeader, HeaderIconButton } from "@/components/AppHeader";
import { ChevronLeftIcon } from "@/components/NavIcons";
import { OAuthButtons } from "@/components/OAuthButtons";
import { Field, blockButtonClass, fieldClass } from "@/components/ui";
import { signUpWithEmailAction } from "@/lib/data/auth-actions";
import { CALLBACK_PATH, LOGIN_PATH } from "@/lib/supabase/paths";

function callbackUrl() {
  return new URL(CALLBACK_PATH, window.location.origin).toString();
}

export function SignupForm({ callbackError }: { callbackError?: string }) {
  const [view, setView] = useState<"oauth" | "email">("oauth");
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [emailError, setEmailError] = useState("");
  const [displayNameError, setDisplayNameError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordConfirmError, setPasswordConfirmError] = useState("");
  const [state, formAction, pending] = useActionState(
    signUpWithEmailAction,
    {},
  );

  function handleSignup(event: FormEvent<HTMLFormElement>) {
    let hasError = false;
    if (!displayName.trim()) {
      setDisplayNameError("表示名を入力してください。");
      hasError = true;
    } else {
      setDisplayNameError("");
    }
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
    if (password !== passwordConfirm) {
      setPasswordConfirmError("パスワードが一致しません。");
      hasError = true;
    } else {
      setPasswordConfirmError("");
    }
    if (hasError) {
      event.preventDefault();
    }
  }

  if (view === "email") {
    return (
      <>
        <AppHeader
          title="アカウント作成"
          back={
            <HeaderIconButton
              label="戻る"
              onClick={() => {
                setView("oauth");
                setDisplayName("");
                setPassword("");
                setPasswordConfirm("");
                setDisplayNameError("");
                setPasswordError("");
                setPasswordConfirmError("");
                setEmailError("");
              }}
            >
              <ChevronLeftIcon />
            </HeaderIconButton>
          }
          showHome={false}
        />
        <main className="px-4 py-4">
          <form
            className="space-y-6"
            action={formAction}
            onSubmit={handleSignup}
          >
            <Field
              label="表示名"
              error={displayNameError || state.fieldErrors?.displayName}
            >
              <input
                type="text"
                name="displayName"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                className={fieldClass}
              />
            </Field>
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
            <Field label="パスワード" error={passwordError}>
              <input
                type="password"
                name="password"
                autoComplete="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className={fieldClass}
              />
            </Field>
            <Field label="パスワード（確認）" error={passwordConfirmError}>
              <input
                type="password"
                name="passwordConfirm"
                autoComplete="new-password"
                value={passwordConfirm}
                onChange={(event) => setPasswordConfirm(event.target.value)}
                className={fieldClass}
              />
            </Field>
            <button
              type="submit"
              disabled={pending}
              className={`${blockButtonClass} disabled:opacity-60`}
            >
              登録する
            </button>
            {state.formError ? (
              <p className="text-sm text-muted">{state.formError}</p>
            ) : null}
          </form>
          <p className="mt-6 text-center text-sm">
            すでにアカウントがある方は{" "}
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
        title="アカウント作成"
        backHref={LOGIN_PATH}
        showHome={false}
      />
      <main className="px-4 py-4">
        <OAuthButtons
          mode="signup"
          redirectTo={callbackUrl()}
          disabled={pending}
          callbackError={callbackError}
        />
        <p className="mt-6 text-center text-base">
          <button
            type="button"
            className="bg-transparent p-0 text-base underline"
            onClick={() => setView("email")}
          >
            メールアドレスで登録
          </button>
        </p>
        <p className="mt-6 text-center text-sm">
          すでにアカウントがある方は{" "}
          <Link href={LOGIN_PATH} className="underline">
            ログイン
          </Link>
        </p>
      </main>
    </>
  );
}
