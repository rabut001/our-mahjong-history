import type { Metadata } from "next";
import { AppHeader } from "@/components/AppHeader";
import { CommunityForm } from "@/components/CommunityForm";
import { createCommunityAction } from "@/lib/data/community-actions";

export const metadata: Metadata = {
  title: "麻雀グループを作成",
};

export default function NewCommunityPage() {
  return (
    <>
      <AppHeader title="麻雀グループを作成" backHref="/communities" />
      <main className="px-4 py-4">
        <CommunityForm
          action={createCommunityAction}
          submitLabel="作成する"
          namePlaceholder="例: 朝雀高校 麻雀クラブ"
          commentPlaceholder="例: 麻雀好きで作ったクラブ。最強を目指す！"
        />
      </main>
    </>
  );
}
