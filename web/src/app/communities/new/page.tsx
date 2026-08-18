import type { Metadata } from "next";
import { AppHeader } from "@/components/AppHeader";
import { NavButton } from "@/components/NavButton";
import {
  Field,
  fieldClass,
  textareaClass,
  TEXTAREA_ROWS,
} from "@/components/ui";

export const metadata: Metadata = {
  title: "麻雀グループを作成",
};

export default function NewCommunityPage() {
  return (
    <>
      <AppHeader title="麻雀グループを作成" backHref="/communities" />
      <main className="px-4 py-4">
        <div className="space-y-6">
          <Field label="麻雀グループ名">
            <input
              type="text"
              name="name"
              placeholder="例: ○○株式会社 麻雀仲間"
              className={fieldClass}
            />
          </Field>
          <Field label="コメント">
            <textarea
              name="comment"
              rows={TEXTAREA_ROWS}
              placeholder="例: 社内の有志で、月に数回集まっています"
              className={textareaClass}
            />
          </Field>
          <NavButton href="/communities" variant="block">
            作成する
          </NavButton>
        </div>
      </main>
    </>
  );
}
