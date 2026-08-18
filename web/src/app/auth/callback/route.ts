import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { HOME_PATH, LOGIN_PATH, safeNextPath } from "@/lib/supabase/paths";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = safeNextPath(requestUrl.searchParams.get("next"));

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(new URL(next, requestUrl.origin));
    }
  }

  const loginUrl = new URL(LOGIN_PATH, requestUrl.origin);
  if (next !== HOME_PATH) {
    loginUrl.searchParams.set("next", next);
  }
  return NextResponse.redirect(loginUrl);
}
