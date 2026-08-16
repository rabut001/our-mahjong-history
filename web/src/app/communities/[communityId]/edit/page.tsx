import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { NavButton } from "@/components/NavButton";
import { getCommunity } from "@/mock";

type EditCommunityPageProps = {
  params: Promise<{ communityId: string }>;
};

const fieldClass =
  "mt-1 w-full border border-neutral-400 bg-white px-3 py-2 text-base";
const labelClass = "block text-sm";

export async function generateMetadata({
  params,
}: EditCommunityPageProps): Promise<Metadata> {
  const { communityId } = await params;
  const community = getCommunity(communityId);
  return {
    title: community ? `${community.name}を編集` : "コミュニティを編集",
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
        title="コミュニティを編集"
        backHref={`/communities/${community.id}`}
      />
      <main className="px-4 py-4">
        <div className="space-y-6">
          <label className={labelClass}>
            コミュニティ名
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
              rows={3}
              defaultValue={community.comment}
              placeholder="例: 毎週金曜の夜に集まっています"
              className="mt-1 w-full border border-neutral-400 bg-white px-3 py-2 text-sm"
            />
          </label>
          <NavButton href={`/communities/${community.id}`} variant="block">
            保存する
          </NavButton>
        </div>
        <p className="mt-16 text-center">
          <button type="button" className="text-sm text-neutral-600">
            このコミュニティを抜ける
          </button>
        </p>
      </main>
    </>
  );
}
