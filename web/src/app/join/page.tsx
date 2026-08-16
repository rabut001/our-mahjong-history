import type { Metadata } from "next";
import { AppHeader } from "@/components/AppHeader";
import { NavButton } from "@/components/NavButton";

export const metadata: Metadata = {
  title: "招待コードで参加",
};

const fieldClass =
  "mt-1 w-full border border-neutral-400 bg-white px-3 py-2 text-base";
const labelClass = "block text-sm";

export default function JoinPage() {
  return (
    <>
      <AppHeader title="招待コードで参加" backHref="/communities" />
      <main className="px-4 py-4">
        <div className="space-y-6">
          <label className={labelClass}>
            招待コード
            <input
              type="text"
              name="code"
              autoCapitalize="characters"
              autoCorrect="off"
              spellCheck={false}
              className={fieldClass}
            />
          </label>
          <p className="text-sm text-neutral-600">
            参加するにはログインが必要です。コードはコミュニティ ID
            なしで使えます。
          </p>
          <NavButton href="/communities/friday" variant="block">
            参加する
          </NavButton>
        </div>
      </main>
    </>
  );
}
