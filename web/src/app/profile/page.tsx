import type { Metadata } from "next";
import { Avatar } from "@/components/Avatar";
import { AppHeader } from "@/components/AppHeader";
import { NavButton } from "@/components/NavButton";
import { getCurrentProfile } from "@/mock";

export const metadata: Metadata = {
  title: "プロフィール",
};

const fieldClass =
  "mt-1 w-full border border-neutral-400 bg-white px-3 py-2 text-base";
const labelClass = "block text-sm";

export default function ProfilePage() {
  const profile = getCurrentProfile();

  return (
    <>
      <AppHeader title="プロフィール" backHref="/communities" />
      <main className="px-4 py-4">
        <div className="space-y-6">
          <div className="text-center">
            <Avatar
              url={profile?.avatarUrl ?? null}
              name={profile?.displayName ?? ""}
              sizeClass="h-20 w-20 text-xl"
              className="mx-auto"
            />
            <p className="mt-2 text-sm text-neutral-600">
              {profile?.avatarUrl
                ? "Google / LINE のアイコンです。アプリから変更はできません。"
                : "メール登録のため、表示名の頭文字を出しています。"}
            </p>
          </div>
          <label className={labelClass}>
            表示名
            <input
              type="text"
              name="displayName"
              defaultValue={profile?.displayName ?? ""}
              className={fieldClass}
            />
          </label>
          <label className={labelClass}>
            コメント
            <textarea
              name="comment"
              rows={3}
              defaultValue={profile?.comment ?? ""}
              placeholder="例: 金曜はだいたい参加します"
              className="mt-1 w-full border border-neutral-400 bg-white px-3 py-2 text-sm"
            />
          </label>
          <NavButton href="/communities" variant="block">
            保存する
          </NavButton>
        </div>
        <p className="mt-16 text-center">
          <button type="button" className="text-sm text-neutral-600">
            アプリを退会する
          </button>
        </p>
      </main>
    </>
  );
}
