"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { HOME_PATH, LOGIN_PATH, safeNextPath } from "@/lib/supabase/paths";

export function AuthContinue() {
  useEffect(() => {
    const next = safeNextPath(
      new URLSearchParams(window.location.search).get("next"),
    );
    const login = new URL(LOGIN_PATH, window.location.origin);
    if (next !== HOME_PATH) {
      login.searchParams.set("next", next);
    }

    void (async () => {
      const hash = new URLSearchParams(window.location.hash.slice(1));
      const accessToken = hash.get("access_token");
      const refreshToken = hash.get("refresh_token");
      if (!accessToken || !refreshToken) {
        window.location.replace(login.toString());
        return;
      }

      const supabase = createClient();
      const { error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
      window.location.replace(error ? login.toString() : next);
    })();
  }, []);

  return (
    <main className="px-4 py-4">
      <p className="text-sm leading-6 text-muted">処理しています。</p>
    </main>
  );
}
