import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { safeNextPath } from "@/lib/supabase/paths";

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

  // 再設定メールのトークンは URL ハッシュに付く。サーバーへは届かないので
  // ブラウザで /auth/continue へ渡し、そこでセッションにする。
  return new NextResponse(hashContinueHtml, {
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}
