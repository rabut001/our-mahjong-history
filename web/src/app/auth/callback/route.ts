import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { authQueryKeyFromCallback } from "@/lib/supabase/auth-errors";
import {
  OAUTH_FROM_COOKIE,
  authErrorUrl,
  safeNextPath,
} from "@/lib/supabase/paths";

const hashContinueHtml = `<!DOCTYPE html>
<html lang="ja">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>俺たちの雀歴</title>
  </head>
  <body>
    <p>処理しています。</p>
    <script>
      location.replace("/auth/continue" + location.search + location.hash);
    </script>
  </body>
</html>
`;

async function redirectAuthError(requestUrl: URL, key: string, next: string) {
  const cookieStore = await cookies();
  const from = cookieStore.get(OAUTH_FROM_COOKIE)?.value;
  const response = NextResponse.redirect(
    authErrorUrl(requestUrl.origin, key, from, next),
  );
  response.cookies.delete(OAUTH_FROM_COOKIE);
  return response;
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = safeNextPath(requestUrl.searchParams.get("next"));
  const oauthError = requestUrl.searchParams.get("error");
  const oauthErrorCode = requestUrl.searchParams.get("error_code");

  if (oauthError || oauthErrorCode) {
    const key = authQueryKeyFromCallback({
      error: oauthError,
      errorCode: oauthErrorCode,
      errorDescription: requestUrl.searchParams.get("error_description"),
    });
    return redirectAuthError(requestUrl, key, next);
  }

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const response = NextResponse.redirect(new URL(next, requestUrl.origin));
      response.cookies.delete(OAUTH_FROM_COOKIE);
      return response;
    }
    return redirectAuthError(
      requestUrl,
      authQueryKeyFromCallback({ authError: error }),
      next,
    );
  }

  // 再設定メールのトークンは URL ハッシュに付く。サーバーへは届かないので
  // ブラウザで /auth/continue へ渡し、そこでセッションにする。
  return new NextResponse(hashContinueHtml, {
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}
