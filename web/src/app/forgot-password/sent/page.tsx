import type { Metadata } from "next";
import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";
import { LOGIN_PATH } from "@/lib/supabase/paths";

export const metadata: Metadata = {
  title: "パスワードを忘れた",
};

export default function ForgotPasswordSentPage() {
  return (
    <>
      <AppHeader
        title="パスワードを忘れた"
        backHref={LOGIN_PATH}
        showHome={false}
      />
      <main className="px-4 py-4">
        <p className="text-sm leading-6">
          入力したメールアドレスに、再設定用のリンクを送りました。
        </p>
        <p className="mt-3 text-sm leading-6 text-muted">
          メールが届かないときは、迷惑メールフォルダを確認してください。
        </p>
        <p className="mt-6 text-center text-sm">
          <Link href={LOGIN_PATH} className="underline">
            ログインへ戻る
          </Link>
        </p>
      </main>
    </>
  );
}
