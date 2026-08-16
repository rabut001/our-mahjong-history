import type { Metadata } from "next";
import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";
import { NavButton } from "@/components/NavButton";

export const metadata: Metadata = {
  title: "アカウント作成",
};

const fieldClass =
  "mt-1 w-full border border-neutral-400 bg-white px-3 py-2 text-base";
const labelClass = "block text-sm";

export default function SignupPage() {
  return (
    <>
      <AppHeader title="アカウント作成" backHref="/login" />
      <main className="px-4 py-4">
        <div className="space-y-6">
          <label className={labelClass}>
            表示名
            <input type="text" name="displayName" className={fieldClass} />
          </label>
          <label className={labelClass}>
            メール
            <input
              type="email"
              name="email"
              autoComplete="email"
              className={fieldClass}
            />
          </label>
          <label className={labelClass}>
            パスワード
            <input
              type="password"
              name="password"
              autoComplete="new-password"
              className={fieldClass}
            />
          </label>
          <NavButton href="/communities" variant="block">
            登録する
          </NavButton>
        </div>
        <div className="mt-6">
          <NavButton href="/communities" variant="block">
            Googleでログイン
          </NavButton>
        </div>
        <p className="mt-6 text-center text-sm">
          <Link href="/login" className="underline">
            ログイン
          </Link>
        </p>
      </main>
    </>
  );
}
