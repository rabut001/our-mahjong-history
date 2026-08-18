"use client";

import { useActionState, useState, type FormEvent } from "react";
import Link from "next/link";
import { AppHeader, HeaderIconButton } from "@/components/AppHeader";
import { ChevronLeftIcon } from "@/components/NavIcons";
import {
  blockButtonClass,
  Field,
  fieldClass,
  outlineBlockButtonClass,
} from "@/components/ui";
import { signInWithEmailAction } from "@/lib/data/auth-actions";
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
  const [oauthError, setOauthError] = useState("");
  const [oauthBusy, setOauthBusy] = useState(false);
  const [state, formAction, pending] = useActionState(
    signInWithEmailAction,
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
          redirectTo: callbackUrl(next),
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

  function handlePasswordLogin(event: FormEvent<HTMLFormElement>) {
    if (!password.trim()) {
      event.preventDefault();
      setPasswordError("パスワードを入力してください。");
    }
  }

  const formError = state.formError;
  const busy = oauthBusy || pending;

  if (step === "password") {
    return (
      <>
        <AppHeader
          title="ログイン"
          back={
            <HeaderIconButton
              label="戻る"
              onClick={() => {
                setStep("email");
                setPassword("");
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
            onSubmit={handlePasswordLogin}
          >
            <input type="hidden" name="email" value={email} />
            <input type="hidden" name="next" value={next} />
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
        {oauthError ? (
          <p className="mt-3 text-sm text-muted">{oauthError}</p>
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
