"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";
import {
  blockButtonClass,
  compactButtonClass,
  Field,
  fieldClass,
  outlineBlockButtonClass,
} from "@/components/ui";
import { createClient } from "@/lib/supabase/client";
import { authErrorMessage } from "@/lib/supabase/auth-errors";
import { CALLBACK_PATH, HOME_PATH, SIGNUP_PATH } from "@/lib/supabase/paths";

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
  const [step, setStep] = useState<"email" | "password">("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);

  async function startOAuth(provider: "google" | "custom:line") {
    setFormError("");
    setBusy(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: callbackUrl(next),
        },
      });
      if (error || !data.url) {
        setFormError(authErrorMessage(error, "oauth"));
        return;
      }
      window.location.assign(data.url);
    } catch {
      setFormError(authErrorMessage(null, "oauth"));
    } finally {
      setBusy(false);
    }
  }

  async function handlePasswordLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!password.trim()) {
      setPasswordError("パスワードを入力してください。");
      return;
    }
    setPasswordError("");
    setFormError("");
    setBusy(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        setFormError(authErrorMessage(error, "login"));
        return;
      }
      window.location.assign(next);
    } catch {
      setFormError(authErrorMessage(null, "login"));
    } finally {
      setBusy(false);
    }
  }

  if (step === "password") {
    return (
      <>
        <AppHeader
          title="ログイン"
          back={
            <button
              type="button"
              onClick={() => {
                setStep("email");
                setPassword("");
                setPasswordError("");
                setFormError("");
              }}
              className={compactButtonClass}
            >
              戻る
            </button>
          }
        />
        <main className="px-4 py-4">
          <p className="text-sm text-muted">{email || "メール"}</p>
          <form className="mt-6 space-y-6" onSubmit={handlePasswordLogin}>
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
            <button
              type="submit"
              disabled={busy}
              className={`${blockButtonClass} disabled:opacity-60`}
            >
              ログイン
            </button>
            {formError ? (
              <p className="text-sm text-muted">{formError}</p>
            ) : null}
          </form>
        </main>
      </>
    );
  }

  return (
    <>
      <AppHeader title="ログイン" />
      <main className="px-4 py-4">
        <div className="space-y-6">
          <Field label="メール" error={emailError}>
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
              setFormError("");
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
            Googleでログイン
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => startOAuth("custom:line")}
            className={`${outlineBlockButtonClass} disabled:opacity-60`}
          >
            LINEでログイン
          </button>
        </div>
        {formError ? (
          <p className="mt-3 text-sm text-muted">{formError}</p>
        ) : null}
        <p className="mt-6 text-center text-sm">
          <Link href={SIGNUP_PATH} className="underline">
            アカウントを作成
          </Link>
        </p>
      </main>
    </>
  );
}
