"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { authQueryKeyFromCallback } from "@/lib/supabase/auth-errors";
import {
  HOME_PATH,
  LOGIN_PATH,
  OAUTH_FROM_COOKIE,
  authErrorUrl,
  safeNextPath,
} from "@/lib/supabase/paths";

function cookieValue(name: string) {
  const match = document.cookie.match(
    new RegExp(
      `(?:^|; )${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}=([^;]*)`,
    ),
  );
  return match ? decodeURIComponent(match[1]) : null;
}

function clearOauthFromCookie() {
  document.cookie = `${OAUTH_FROM_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
}

export function AuthContinue() {
  useEffect(() => {
    const search = new URLSearchParams(window.location.search);
    const hash = new URLSearchParams(window.location.hash.slice(1));
    const next = safeNextPath(search.get("next"));
    const error = search.get("error") ?? hash.get("error");
    const errorCode = search.get("error_code") ?? hash.get("error_code");
    const errorDescription =
      search.get("error_description") ?? hash.get("error_description");

    if (error || errorCode) {
      const key = authQueryKeyFromCallback({
        error,
        errorCode,
        errorDescription,
      });
      const from = cookieValue(OAUTH_FROM_COOKIE);
      clearOauthFromCookie();
      window.location.replace(
        authErrorUrl(window.location.origin, key, from, next).toString(),
      );
      return;
    }

    const login = new URL(LOGIN_PATH, window.location.origin);
    if (next !== HOME_PATH) {
      login.searchParams.set("next", next);
    }

    void (async () => {
      const accessToken = hash.get("access_token");
      const refreshToken = hash.get("refresh_token");
      if (!accessToken || !refreshToken) {
        window.location.replace(login.toString());
        return;
      }

      const supabase = createClient();
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
      const from = cookieValue(OAUTH_FROM_COOKIE);
      clearOauthFromCookie();
      if (sessionError && (from === "login" || from === "signup")) {
        const key = authQueryKeyFromCallback({ authError: sessionError });
        window.location.replace(
          authErrorUrl(window.location.origin, key, from, next).toString(),
        );
        return;
      }
      window.location.replace(sessionError ? login.toString() : next);
    })();
  }, []);

  return (
    <main className="px-4 py-4">
      <p className="text-sm leading-6 text-muted">処理しています。</p>
    </main>
  );
}
