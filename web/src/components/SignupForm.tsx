"use client";

import Link from "next/link";
import { useActionState, useState, type FormEvent } from "react";
import { AppHeader, HeaderIconButton } from "@/components/AppHeader";
import { ChevronLeftIcon } from "@/components/NavIcons";
import {
  blockButtonClass,
  Field,
  fieldClass,
  outlineBlockButtonClass,
} from "@/components/ui";
import { signUpWithEmailAction } from "@/lib/data/auth-actions";
import { createClient } from "@/lib/supabase/client";
import { authErrorMessage } from "@/lib/supabase/auth-errors";
import { CALLBACK_PATH, LOGIN_PATH } from "@/lib/supabase/paths";

function callbackUrl() {
  return new URL(CALLBACK_PATH, window.location.origin).toString();
}

export function SignupForm() {
  const [step, setStep] = useState<"method" | "password">("method");
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [displayNameError, setDisplayNameError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [oauthError, setOauthError] = useState("");
  const [oauthBusy, setOauthBusy] = useState(false);
  const [state, formAction, pending] = useActionState(
    signUpWithEmailAction,
    {},
  );

  async function startOAuth(provider: "google" | "custom:line") {
    setOauthError("");
    setOauthBusy(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: callbackUrl(),
        },
      });
      if (error || !data.url) {
        setOauthError(authErrorMessage(error, "oauth"));
        return;
      }
      window.location.assign(data.url);
    } catch {
      setOauthError(authErrorMessage(null, "oauth"));
    } finally {
      setOauthBusy(false);
    }
  }

  function handleSignup(event: FormEvent<HTMLFormElement>) {
    let hasError = false;
    if (!displayName.trim()) {
      setDisplayNameError("表示名を入力してください。");
      hasError = true;
    } else {
      setDisplayNameError("");
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

  const busy = oauthBusy || pending;

  if (step === "password") {
    return (
      <>
        <AppHeader
          title="アカウント作成"
          back={
            <HeaderIconButton
              label="戻る"
              onClick={() => {
                setStep("method");
                setDisplayName("");
                setPassword("");
                setDisplayNameError("");
                setPasswordError("");
              }}
            >
              <ChevronLeftIcon />
            </HeaderIconButton>
          }
        />
        <main className="px-4 py-4">
          <p className="text-sm text-muted">{email || "メール"}</p>
          <form
            className="mt-6 space-y-6"
            action={formAction}
            onSubmit={handleSignup}
          >
            <input type="hidden" name="email" value={email} />
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
            <button
              type="submit"
              disabled={busy}
              className={`${blockButtonClass} disabled:opacity-60`}
            >
              登録する
            </button>
            {state.formError ? (
              <p className="text-sm text-muted">{state.formError}</p>
            ) : null}
          </form>
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
        <div className="space-y-6">
          <Field label="メールアドレスで登録" error={emailError}>
            <input
              type="email"
              name="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className={fieldClass}
            />
          </Field>
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              if (!email.trim()) {
                setEmailError("メールを入力してください。");
                return;
              }
              setEmailError("");
              setOauthError("");
              setStep("password");
            }}
            className={`${blockButtonClass} disabled:opacity-60`}
          >
            次へ
          </button>
        </div>
        <div className="mt-6 space-y-3">
          <button
            type="button"
            disabled={busy}
            onClick={() => startOAuth("google")}
            className={`${outlineBlockButtonClass} disabled:opacity-60`}
          >
            Googleで登録
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => startOAuth("custom:line")}
            className={`${outlineBlockButtonClass} disabled:opacity-60`}
          >
            LINEで登録
          </button>
        </div>
        {oauthError ? (
          <p className="mt-3 text-sm text-muted">{oauthError}</p>
        ) : null}
        <p className="mt-6 text-center text-sm">
          <Link href={LOGIN_PATH} className="underline">
            ログイン
          </Link>
        </p>
      </main>
    </>
  );
}
