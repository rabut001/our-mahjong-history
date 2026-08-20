import { createClient } from "@/lib/supabase/client";
import { authErrorMessage } from "@/lib/supabase/auth-errors";

export type OAuthProvider = "google" | "custom:line";

export async function startOAuthRedirect(
  provider: OAuthProvider,
  redirectTo: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo,
        ...(provider === "custom:line"
          ? { queryParams: { disable_ios_auto_login: "true" } }
          : {}),
      },
    });
    if (error || !data.url) {
      return { ok: false, message: authErrorMessage(error, "oauth") };
    }
    window.location.assign(data.url);
    return { ok: true };
  } catch {
    return { ok: false, message: authErrorMessage(null, "oauth") };
  }
}
