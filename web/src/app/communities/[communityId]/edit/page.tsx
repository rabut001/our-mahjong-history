import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { DangerAction } from "@/components/DangerAction";
import { NavButton } from "@/components/NavButton";
import {
  fieldClass,
  labelClass,
  textareaClass,
  TEXTAREA_ROWS,
} from "@/components/ui";
import { getCommunity } from "@/mock";

type EditCommunityPageProps = {
  params: Promise<{ communityId: string }>;
};

export async function generateMetadata({
  params,
}: EditCommunityPageProps): Promise<Metadata> {
  const { communityId } = await params;
  const community = getCommunity(communityId);
  return {
    title: community ? `${community.name}を編集` : "麻雀グループを編集",
  };
}

export default async function EditCommunityPage({
  params,
}: EditCommunityPageProps) {
  const { communityId } = await params;
  const community = getCommunity(communityId);
  if (!community) {
    notFound();
  }

  return (
    <>
      <AppHeader
        title="麻雀グループを編集"
        backHref={`/communities/${community.id}`}
      />
      <main className="px-4 py-4">
        <div className="space-y-6">
          <label className={labelClass}>
            麻雀グループ名
            <input
              type="text"
              name="name"
              defaultValue={community.name}
              className={fieldClass}
            />
          </label>
          <label className={labelClass}>
            コメント
            <textarea
              name="comment"
              rows={TEXTAREA_ROWS}
              defaultValue={community.comment}
              placeholder="例: 毎週金曜の夜に集まっています"
              className={textareaClass}
            />
          </label>
          <NavButton href={`/communities/${community.id}`} variant="block">
            保存する
          </NavButton>
        </div>
        <DangerAction
          label="この麻雀グループを抜ける"
          dialogTitle="この麻雀グループを抜けますか？"
          dialogBody="抜けると、この麻雀グループの大会と試合は見られなくなります。"
          confirmLabel="抜ける"
          doneHref="/communities"
        />
      </main>
    </>
  );
}
