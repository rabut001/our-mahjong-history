import type { Metadata } from "next";
import { AppHeader } from "@/components/AppHeader";
import { NavButton } from "@/components/NavButton";

export const metadata: Metadata = {
  title: "コミュニティを作成",
};

const fieldClass =
  "mt-1 w-full border border-neutral-400 bg-white px-3 py-2 text-base";
const labelClass = "block text-sm";

export default function NewCommunityPage() {
  return (
    <>
      <AppHeader title="コミュニティを作成" backHref="/communities" />
      <main className="px-4 py-4">
        <div className="space-y-6">
          <label className={labelClass}>
            コミュニティ名
            <input
              type="text"
              name="name"
              placeholder="例: 金曜麻雀"
              className={fieldClass}
            />
          </label>
          <label className={labelClass}>
            コメント
            <textarea
              name="comment"
              rows={3}
              placeholder="例: 毎週金曜の夜に集まっています"
              className="mt-1 w-full border border-neutral-400 bg-white px-3 py-2 text-sm"
            />
          </label>
          <NavButton href="/communities" variant="block">
            作成する
          </NavButton>
        </div>
      </main>
    </>
  );
}
