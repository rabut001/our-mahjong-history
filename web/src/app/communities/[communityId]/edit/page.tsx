import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { CommunityForm } from "@/components/CommunityForm";
import { DangerAction } from "@/components/DangerAction";
import { getCommunityDetail } from "@/lib/data";
import {
  leaveCommunityAction,
  updateCommunityAction,
} from "@/lib/data/community-actions";

type EditCommunityPageProps = {
  params: Promise<{ communityId: string }>;
};

export async function generateMetadata({
  params,
}: EditCommunityPageProps): Promise<Metadata> {
  const { communityId } = await params;
  const community = await getCommunityDetail(communityId);
  return {
    title: community ? `${community.name}を編集` : "麻雀グループを編集",
  };
}

export const dynamic = "force-dynamic";

export default async function EditCommunityPage({
  params,
}: EditCommunityPageProps) {
  const { communityId } = await params;
  const community = await getCommunityDetail(communityId);
  if (!community) {
    notFound();
  }

  const lastMember = community.memberCount <= 1;

  return (
    <>
      <AppHeader
        title="麻雀グループを編集"
        backHref={`/communities/${community.id}`}
      />
      <main className="px-4 py-4">
        <CommunityForm
          action={updateCommunityAction}
          submitLabel="保存する"
          communityId={community.id}
          defaultName={community.name}
          defaultComment={community.comment}
          commentPlaceholder="例: 毎週金曜の夜に集まっています"
        />
        <DangerAction
          label="この麻雀グループを抜ける"
          dialogTitle="この麻雀グループを抜けますか？"
          dialogBody={
            lastMember
              ? "あなたが最後のメンバーです。抜けると、大会とルールも含めて麻雀グループごと消えます。元に戻せません。"
              : "抜けると、この麻雀グループの大会と試合は見られなくなります。"
          }
          confirmLabel="抜ける"
          doneHref="/communities"
          action={leaveCommunityAction}
          hiddenFields={{ communityId: community.id }}
        />
      </main>
    </>
  );
}
