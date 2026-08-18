import type { Metadata } from "next";
import { AppHeader } from "@/components/AppHeader";
import { NavButton } from "@/components/NavButton";
import { Field, fieldClass } from "@/components/ui";

export const metadata: Metadata = {
  title: "招待コードで参加",
};

export default function JoinPage() {
  return (
    <>
      <AppHeader title="招待コードで参加" backHref="/communities" />
      <main className="px-4 py-4">
        <div className="space-y-6">
          <Field label="招待コード">
            <input
              type="text"
              name="code"
              autoCapitalize="characters"
              autoCorrect="off"
              spellCheck={false}
              className={fieldClass}
            />
          </Field>
          <p className="text-sm leading-6 text-muted">
            招待コードを入力し「参加する」ボタンを押してください。
            <br />
            コードは麻雀グループに参加済みの人に確認してください。
          </p>
          <NavButton href="/communities/friday" variant="block">
            参加する
          </NavButton>
        </div>
      </main>
    </>
  );
}
