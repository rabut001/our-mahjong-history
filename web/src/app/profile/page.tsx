import type { Metadata } from "next";
import { Avatar } from "@/components/Avatar";
import { AppHeader } from "@/components/AppHeader";
import { DangerAction } from "@/components/DangerAction";
import { NavButton } from "@/components/NavButton";
import {
  Field,
  fieldClass,
  textareaClass,
  TEXTAREA_ROWS,
} from "@/components/ui";
import { getCurrentProfile } from "@/mock";

export const metadata: Metadata = {
  title: "プロフィール",
};

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
            {profile?.avatarUrl ? null : (
              <p className="mt-2 text-sm text-muted">
                メール登録のため、表示名の頭文字を出しています。
              </p>
            )}
          </div>
          <Field label="表示名">
            <input
              type="text"
              name="displayName"
              defaultValue={profile?.displayName ?? ""}
              className={fieldClass}
            />
          </Field>
          <Field label="コメント">
            <textarea
              name="comment"
              rows={TEXTAREA_ROWS}
              defaultValue={profile?.comment ?? ""}
              placeholder="例: 金曜はだいたい参加します"
              className={textareaClass}
            />
          </Field>
          <NavButton href="/communities" variant="block">
            保存する
          </NavButton>
        </div>
        <DangerAction
          label="アプリを退会する"
          dialogTitle="アプリを退会しますか？"
          dialogBody="アカウントが消え、参加している麻雀グループから外れます。元に戻せません。"
          confirmLabel="退会する"
          doneHref="/login"
        />
      </main>
    </>
  );
}
