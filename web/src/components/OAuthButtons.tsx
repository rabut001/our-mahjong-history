"use client";

import { useState } from "react";
import { blockButtonClass } from "@/components/ui";
import { startOAuthRedirect, type OAuthProvider } from "@/lib/supabase/oauth";

export function OrDivider() {
  return (
    <div className="flex items-center gap-3">
      <span className="h-px flex-1 bg-line" />
      <span className="text-sm text-muted">または</span>
      <span className="h-px flex-1 bg-line" />
    </div>
  );
}

type OAuthButtonsProps = {
  mode: "login" | "signup";
  redirectTo: string;
  disabled?: boolean;
};

export function OAuthButtons({
  mode,
  redirectTo,
  disabled,
}: OAuthButtonsProps) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const google = mode === "login" ? "Googleでログイン" : "Googleで登録";
  const line = mode === "login" ? "LINEでログイン" : "LINEで登録";

  async function startOAuth(provider: OAuthProvider) {
    setError("");
    setBusy(true);
    const result = await startOAuthRedirect(provider, redirectTo);
    if (!result.ok) {
      setError(result.message);
    }
    setBusy(false);
  }

  const blocked = disabled || busy;

  return (
    <div className="space-y-3">
      <button
        type="button"
        disabled={blocked}
        className={`${blockButtonClass} disabled:opacity-60`}
        onClick={() => startOAuth("google")}
      >
        {google}
      </button>
      <button
        type="button"
        disabled={blocked}
        className={`${blockButtonClass} disabled:opacity-60`}
        onClick={() => startOAuth("custom:line")}
      >
        {line}
      </button>
      {error ? <p className="text-sm text-muted">{error}</p> : null}
    </div>
  );
}
