"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
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
import { CALLBACK_PATH, HOME_PATH, LOGIN_PATH } from "@/lib/supabase/paths";

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
          redirectTo: callbackUrl(),
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

  async function handleSignup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
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
      return;
    }
    setFormError("");
    setBusy(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { display_name: displayName.trim() },
          emailRedirectTo: callbackUrl(),
        },
      });
      if (error) {
        setFormError(authErrorMessage(error, "signup"));
        return;
      }
      if (data.session) {
        window.location.assign(HOME_PATH);
        return;
      }
      setFormError("確認メールを送信しました。");
    } catch {
      setFormError(authErrorMessage(null, "signup"));
    } finally {
      setBusy(false);
    }
  }

  if (step === "password") {
    return (
      <>
        <AppHeader
          title="アカウント作成"
          back={
            <button
              type="button"
              onClick={() => {
                setStep("method");
                setDisplayName("");
                setPassword("");
                setDisplayNameError("");
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
          <form className="mt-6 space-y-6" onSubmit={handleSignup}>
            <Field label="表示名" error={displayNameError}>
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
      <AppHeader title="アカウント作成" backHref={LOGIN_PATH} />
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
        {formError ? (
          <p className="mt-3 text-sm text-muted">{formError}</p>
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
